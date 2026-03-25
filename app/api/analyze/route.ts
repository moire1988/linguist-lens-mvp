import { NextResponse } from "next/server";
import { analyzeContent } from "@/app/actions/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false as const,
        error: "Invalid JSON",
        errorCode: "generic" as const,
      },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        success: false as const,
        error: "Invalid body",
        errorCode: "generic" as const,
      },
      { status: 400 }
    );
  }

  const rec = body as Record<string, unknown>;
  const input = rec.input;
  const cefrLevel = rec.cefrLevel;
  const inputMode = rec.inputMode;
  const devMode = rec.devMode;

  if (typeof input !== "string" || typeof cefrLevel !== "string") {
    return NextResponse.json(
      {
        success: false as const,
        error: "Invalid body",
        errorCode: "generic" as const,
      },
      { status: 400 }
    );
  }

  if (inputMode !== "url" && inputMode !== "text") {
    return NextResponse.json(
      {
        success: false as const,
        error: "Invalid inputMode",
        errorCode: "generic" as const,
      },
      { status: 400 }
    );
  }

  if (devMode !== undefined && typeof devMode !== "boolean") {
    return NextResponse.json(
      {
        success: false as const,
        error: "Invalid devMode",
        errorCode: "generic" as const,
      },
      { status: 400 }
    );
  }

  const result = await analyzeContent(
    input,
    cefrLevel,
    inputMode,
    typeof devMode === "boolean" ? devMode : undefined
  );
  return NextResponse.json(result);
}
