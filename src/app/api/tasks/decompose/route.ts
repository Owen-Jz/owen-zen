import { NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT = 30000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description } = body;

    if (!description || description.trim().split(/\s+/).length < 3) {
      return NextResponse.json(
        { success: false, error: "Description must have at least 3 words to decompose." },
        { status: 400 }
      );
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key not configured." }, { status: 500 });
    }

    const prompt = `You are a task decomposition assistant. Given a task description, break it down into 3-8 clear, actionable sub-steps that a developer or knowledge worker can complete independently.

Task description: "${description}"

Rules:
- Each sub-step should be a single, concrete action (verb + object)
- Use imperative mood (e.g., "Set up Xcode project" not "Setting up Xcode project")
- Order logically — prerequisite steps first
- Each step should take 15-60 minutes to complete
- Return ONLY a valid JSON array with no markdown, no code blocks, no explanation

Output format:
[{"title": "Step 1 text", "completed": false}, {"title": "Step 2 text", "completed": false}]

Respond ONLY with the JSON array. No preamble or explanation.`;

    const response = await fetchWithTimeout("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.5",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return NextResponse.json(
        { success: false, error: "Failed to decompose. Please try again." },
        { status: 500 }
      );
    }

    const rawContent = data.choices[0].message.content.trim();

    // Strip markdown code fences if present
    const jsonStr = rawContent.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let subtasks;
    try {
      subtasks = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { success: false, error: "Could not decompose. Try a more detailed description." },
        { status: 422 }
      );
    }

    if (!Array.isArray(subtasks) || subtasks.length < 2) {
      return NextResponse.json(
        { success: false, error: "Could not decompose. Try a more detailed description." },
        { status: 422 }
      );
    }

    // Normalize: ensure each has title and completed
    const normalized = subtasks.map((s: any) => ({
      title: String(s.title || "").trim(),
      completed: false,
      description: String(s.description || "").trim(),
    })).filter((s: any) => s.title.length > 0);

    if (normalized.length < 2) {
      return NextResponse.json(
        { success: false, error: "Could not decompose. Try a more detailed description." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: { subtasks: normalized } });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 504 });
    }
    console.error("[Decompose] Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to decompose." },
      { status: 500 }
    );
  }
}