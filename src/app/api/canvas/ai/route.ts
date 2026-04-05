import { NextRequest } from "next/server";

// Force dynamic rendering so Next.js doesn't buffer
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { messages: any[]; nodeData: any };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, nodeData } = body;

  const systemPrompt = `You are a Socratic + Structured AI assistant helping the user explore and refine a canvas node.

## NODE CONTEXT
Title: ${nodeData.content || '(no title)'}
Description: ${nodeData.description || '(no description)'}
Sub-nodes: ${nodeData.subNodes?.length ? nodeData.subNodes.map((s: { content: unknown }) => s.content).join(' | ') : 'none'}

## YOUR STYLE
- Ask probing questions to challenge assumptions and deepen thinking
- Organize information clearly into categories and bullet points when summarizing
- Suggest concrete next steps when appropriate
- Use structured response directives (see below) when you want to write back to the node

## STRUCTURED RESPONSE DIRECTIVES
When you want to apply changes to the node, respond with a JSON block on its own line:

- Apply description update:
{"type":"apply_description","content":"Your refined description text here..."}

- Apply title update:
{"type":"apply_title","content":"Your refined title here..."}

- Add a new sub-node:
{"type":"apply_subnode","content":"New sub-node content here..."}

- Ask the user a question:
{"type":"ask_user","question":"What specific outcome are you hoping for?"}

For all other responses (questions, analysis, discussion), respond with plain text.`;

  const minimaxMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  // Use fetch with streaming
  const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "MiniMax-M2.7",
      messages: minimaxMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Canvas AI] MiniMax error:", errorText);
    return new Response(JSON.stringify({ error: "AI request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream the SSE response directly to the client
  // Use a TransformStream to parse and re-emit as our own SSE format
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const encode = (event: string, data: object) => {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(chunk));
      };

      const processBuffer = () => {
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              encode("message", { type: "text", content: chunk });
            }
          } catch {
            // Skip malformed lines
          }
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer) processBuffer();
            controller.enqueue(new TextEncoder().encode(`event: done\ndata: {}\n\n`));
            break;
          }
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            processBuffer();
          }
        }
      } catch (e) {
        console.error("[Canvas AI] Stream read error:", e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering if proxied
    },
  });
}
