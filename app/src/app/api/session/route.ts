import { NextResponse } from "next/server";

const sessionId = Date.now().toString();

export function GET() {
  return NextResponse.json({ sessionId });
}
