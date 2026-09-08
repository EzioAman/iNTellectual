import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({
      tactics: db.tactics || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load tactics" },
      { status: 500 }
    );
  }
}
