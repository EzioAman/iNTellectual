import { NextResponse } from "next/server";
import { updateCoachEvaluation } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { playerId, scores } = body;

    if (!playerId || !scores) {
      return NextResponse.json(
        { error: "Missing required fields: playerId, scores" },
        { status: 400 }
      );
    }

    const { player, allPlayers } = updateCoachEvaluation(playerId, scores);

    return NextResponse.json({
      success: true,
      message: `Coach metrics successfully applied for ${player.name}`,
      player,
      players: allPlayers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to commit coach evaluation" },
      { status: 500 }
    );
  }
}
