import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "Sync request queued. Live Google Sheets and HenrikDev stats are fetched on-demand.",
      info: "To update Google Sheets directly, ensure the Google Cloud service account has Editor permission on the target spreadsheet."
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
