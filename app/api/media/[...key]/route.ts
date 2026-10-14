import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Media storage is not connected in this build; connect your own storage and serve files from here.
export async function GET() {
  return NextResponse.json({ success: false, error: "Media not found." }, { status: 404 });
}
