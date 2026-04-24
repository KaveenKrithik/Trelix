import { NextResponse } from "next/server";
import { processBFHL } from "@/lib/bfhl";

/**
 * Common GET requirement for SRM challenges.
 */
export async function GET() {
  return NextResponse.json({ operation_code: 1 }, { status: 200 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: '"data" must be an array of strings.' },
        { status: 400 }
      );
    }

    const result = processBFHL(data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error processing /api/bfhl:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
