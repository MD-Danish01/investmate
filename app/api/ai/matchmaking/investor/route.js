import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";

// Helper to parse AI response (handles "raw" field with markdown JSON)
function parseAIResponse(data) {
  if (data.raw) {
    // Extract JSON from markdown code block
    const jsonMatch = data.raw.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return data;
      }
    }
  }
  return data;
}

// POST /api/ai/matchmaking/investor
// Find startups matching an investor's profile
export async function POST(request) {
  try {
    await dbConnect();

    // Check auth - investor only
    const token = request.cookies.get("investor_token")?.value || request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "investor") {
      return NextResponse.json({ error: "Only investors can use this feature" }, { status: 403 });
    }

    // Get investor profile
    const investor = await Investor.findOne({ userId: decoded.userId }).lean();
    if (!investor) {
      return NextResponse.json({ error: "Investor profile not found" }, { status: 404 });
    }

    // Call external AI API
    const aiApiUrl = process.env.INVESTMATE_AI_API_URL;
    if (!aiApiUrl) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const response = await fetch(`${aiApiUrl}/matchmaking-investor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investorData: investor }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "AI service error" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const parsed = parseAIResponse(data);

    return NextResponse.json({
      success: true,
      matches: parsed,
    });
  } catch (error) {
    console.error("AI Matchmaking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
