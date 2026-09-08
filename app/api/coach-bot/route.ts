import { NextResponse } from "next/server";
import { generateCoachFeedback } from "@/lib/ragEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, playerId } = body;

    if (!query) {
      return NextResponse.json({ error: "Missing query in request" }, { status: 400 });
    }

    const feedback = generateCoachFeedback(query, playerId);
    return NextResponse.json({
      success: true,
      ...feedback,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed running RAG Tactical Coach Bot" },
      { status: 500 }
    );
  }
}
