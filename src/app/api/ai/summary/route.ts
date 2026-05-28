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
    const { tasks, habits, type } = body;

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const taskList = tasks || [];
    const habitList = habits || [];

    let prompt = "";
    
    if (type === "daily") {
      const completedTasks = taskList.filter((t: any) => t.status === "completed");
      const pendingTasks = taskList.filter((t: any) => t.status !== "completed" && !t.isArchived);
      const habitCount = habitList.filter((h: any) => h.completedToday).length;
      
      prompt = `You are a productivity assistant. Generate a brief daily summary and motivation for the user based on their data:

Completed Tasks (${completedTasks.length}): ${completedTasks.map((t: any) => t.title).join(", ") || "None"}

Pending Tasks (${pendingTasks.length}): ${pendingTasks.slice(0, 5).map((t: any) => t.title).join(", ")}${pendingTasks.length > 5 ? "..." : ""}

Habits Completed Today: ${habitCount}/${habitList.length}

Generate a friendly, motivating daily summary in 2-3 sentences. Highlight wins, acknowledge pending work, and encourage progress.`;
    } else if (type === "weekly") {
      prompt = `You are a productivity assistant. Generate a brief weekly summary and insights for the user based on their task data:

Total Tasks: ${taskList.length}
Completed Tasks: ${taskList.filter((t: any) => t.status === "completed").length}

Generate a weekly recap in 3-4 sentences. Discuss productivity trends, suggest improvements, and motivate for the next week.`;
    } else {
      return NextResponse.json({ error: "Invalid summary type" }, { status: 400 });
    }
    
    const response = await fetchWithTimeout("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "MiniMax-M2.5",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      return NextResponse.json({ summary: data.choices[0].message.content });
    } else if (data.base_resp && data.base_resp.status_msg) {
      return NextResponse.json({ summary: `API Error: ${data.base_resp.status_msg}` });
    } else {
      return NextResponse.json({ summary: "Unable to generate summary. Please try again." });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 504 });
    }
    console.error("[AI Summary] Error:", error.message || error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}
