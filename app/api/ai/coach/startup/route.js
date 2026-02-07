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
    
    let parsed = null;
    
    if (aiApiUrl) {
      try {
        const response = await fetch(`${aiApiUrl}/startup-coach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startupData: startup }),
        });

        if (response.ok) {
          const data = await response.json();
          parsed = parseAIResponse(data);
        } else {
          console.log("AI Coach API returned error:", response.status);
        }
      } catch (aiError) {
        console.log("AI Coach API call failed:", aiError.message);
      }
    }
    
    // If AI call failed, provide default coaching tips
    if (!parsed) {
      const industry = startup.industry || "technology";
      const stage = startup.stage || "early-stage";
      const fundingNeeded = startup.fundingNeeded || "seed funding";
      
      parsed = {
        analysis: {
          profile_summary: `Welcome back, ${startup.founderName || startup.startupName || "Founder"}! Your ${stage} ${industry} startup is on an exciting journey.`,
          market_position: `As a ${stage} company in ${industry}, you're entering a dynamic and growing market with significant opportunities.`,
          funding_readiness: `You're seeking ${fundingNeeded}. Focus on demonstrating clear traction and unit economics to attract the right investors.`
        },
        actionable_advice: [
          `For ${stage} startups in ${industry}, focus on demonstrating clear problem-solution fit and early traction metrics in your pitch deck.`,
          `When seeking ${fundingNeeded}, prioritize investors with portfolio companies in ${industry} who understand your market dynamics.`,
          "Track and highlight key metrics like user growth, engagement rates, and unit economics to build investor confidence.",
          "Leverage warm introductions through your network. Investors are 4x more likely to respond to referred founders."
        ],
        coach_verdict: {
          next_steps: "Refine your pitch deck with clear problem-solution narrative and identify 10 target investors this week.",
          focus_area: "Prepare your data room with financials and metrics while practicing your pitch.",
          overall: `Focus on building strong traction in ${industry} while preparing compelling materials for your ${fundingNeeded} round.`
        }
      };
    }

    return NextResponse.json({
      success: true,
      coaching: parsed,
    });
  } catch (error) {
    console.error("AI Coach error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
