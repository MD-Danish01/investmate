import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Startup from "@/models/Startup";

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

// POST /api/ai/coach/startup
// Get AI coaching advice for a startup
export async function POST(request) {
  try {
    await dbConnect();

    // Check auth - startup only
    const token = request.cookies.get("startup_token")?.value || request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "startup") {
      return NextResponse.json({ error: "Only startups can use this feature" }, { status: 403 });
    }

    // Get startup profile
    const startup = await Startup.findOne({ userId: decoded.userId }).lean();
    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    // Call external AI API
    const aiApiUrl = process.env.INVESTMATE_AI_API_URL;
    if (!aiApiUrl) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const response = await fetch(`${aiApiUrl}/startup-coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupData: startup }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "AI service error" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    const parsed = parseAIResponse(data);

    return NextResponse.json({
      success: true,
      coaching: parsed,
    });
  } catch (error) {
    console.error("AI Coach error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
