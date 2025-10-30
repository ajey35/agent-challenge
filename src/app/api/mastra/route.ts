import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { agentName = "personalMailAgent", messages } = body || {};

    const agent = mastra.getAgent(agentName);
    if (!agent) {
      return NextResponse.json({ error: `Agent not found: ${agentName}` }, { status: 404 });
    }

    // If messages weren't provided, default to asking for drafts
    const prompt = messages ?? [{ role: "user", content: "Show my drafts" }];

    const response = await agent.generateVNext(prompt as any);

    return NextResponse.json({
      text: response?.text ?? null,
      object: response?.object ?? null,
      toolResults: response?.toolResults ?? null,
    });
  } catch (err: any) {
    console.error("/api/mastra error:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
};
