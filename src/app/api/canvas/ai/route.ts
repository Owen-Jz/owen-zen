import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, nodeData } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

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
      return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        const processBuffer = () => {
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices?.[0]?.delta?.content || "";
              if (chunk) {
                controller.enqueue(
                  new TextEncoder().encode(`event: message\ndata: ${JSON.stringify({ type: "text", content: chunk })}\n\n`)
                );
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
              controller.enqueue(new TextEncoder().encode(`event: done\ndata: ${JSON.stringify({})}\n\n`));
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            processBuffer();
          }
        } catch (streamError) {
          console.error("[Canvas AI] Stream error:", streamError);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Canvas AI] Error:", message);
    return NextResponse.json({ error: message || "Failed" }, { status: 500 });
  }
}
