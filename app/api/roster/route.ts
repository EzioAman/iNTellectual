import { NextResponse } from "next/server";
import { getDatabase, addOperative } from "@/lib/db";

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({
      players: db.players,
      metrics: db.metrics,
      history: db.history,
      isDatabase: true,
      lastSync: db.lastSync,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load squad database" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.player || !body.role || !body.agent) {
      return NextResponse.json(
        { error: "Missing required fields: player, role, agent" },
        { status: 400 }
      );
    }

    const created = addOperative({
      player: body.player,
      role: body.role,
      agent: body.agent,
      kd: parseFloat(body.kd) || 1.0,
      acs: parseFloat(body.acs) || 200,
      hsPercent: parseFloat(body.hsPercent) || 20,
      aim: parseFloat(body.aim) || 7,
      utility: parseFloat(body.utility) || 7,
      comms: parseFloat(body.comms) || 7,
      entry: parseFloat(body.entry) || 7,
      clutch: parseFloat(body.clutch) || 7,
    });

    const db = getDatabase();
    return NextResponse.json({
      player: created,
      players: db.players,
      metrics: db.metrics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register operative" },
      { status: 500 }
    );
  }
}
