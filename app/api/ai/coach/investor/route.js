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

// POST /api/ai/coach/investor
// Get AI coaching advice for an investor
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
    
    let parsed = null;
    
    if (aiApiUrl) {
      try {
        const response = await fetch(`${aiApiUrl}/investor-coach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ investorData: investor }),
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
      const sectors = investor.preferredSectors?.join(", ") || "technology";
      const ticketSize = investor.ticketSize || "₹10L - ₹50L";
      
      parsed = {
        greeting: `Welcome back, ${investor.fullName || "Investor"}!`,
        tips: [
          {
            title: "Portfolio Diversification",
            content: `Consider diversifying across ${sectors} subsectors to reduce risk while maintaining exposure to high-growth opportunities.`
          },
          {
            title: "Due Diligence Focus",
            content: `For your ${ticketSize} ticket size, prioritize startups with clear unit economics and a path to profitability within 18-24 months.`
          },
          {
            title: "Market Trends",
            content: `The ${sectors} space is seeing increased activity. Look for startups solving genuine pain points with defensible technology.`
          },
          {
            title: "Founder Assessment",
            content: "Evaluate founder-market fit carefully. The best founders have deep domain expertise and relentless execution focus."
          }
        ],
        summary: `Based on your focus on ${sectors}, we recommend actively engaging with early-stage startups that demonstrate strong product-market fit signals.`
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
