import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Startup from "@/models/Startup";
import Investor from "@/models/Investor";

// Helper to parse AI response (handles "raw" field with markdown JSON)
function parseAIResponse(data) {
  // Handle { value: [...] } format
  if (data.value && Array.isArray(data.value)) {
    return data.value;
  }
  // Handle { raw: "```json...```" } format
  if (data.raw) {
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

// POST /api/ai/matchmaking/startup
// Find investors/partners matching a startup's profile
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

    const response = await fetch(`${aiApiUrl}/matchmaking-startup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupData: startup }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "AI service error" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log("Raw AI response:", JSON.stringify(data, null, 2));
    
    let aiMatches = parseAIResponse(data);
    console.log("Parsed AI response:", JSON.stringify(aiMatches, null, 2));

    if (!Array.isArray(aiMatches)) {
      aiMatches = [];
    }

    // Fetch startup/investor details for each matched userId
    // The AI returns other startups as potential partners
    const enrichedMatches = await Promise.all(
      aiMatches.map(async (match, index) => {
        try {
          const userId = match.userId || match.userid || match.user_id;
          
          if (userId) {
            // First try to find a startup (partner match)
            const partnerStartup = await Startup.findOne({ userId: userId }).lean();
            if (partnerStartup) {
              return {
                _id: partnerStartup._id,
                type: "startup",
                name: partnerStartup.startupName,
                tagline: partnerStartup.tagline,
                founderName: partnerStartup.founderName,
                industry: partnerStartup.industry,
                stage: partnerStartup.stage,
                location: partnerStartup.location,
                profilePicture: partnerStartup.profilePicture,
                aiReason: match.explanation || match.reason || "AI matched as potential partner",
                matchIndex: index + 1,
              };
            }
            
            // Try to find an investor
            const investor = await Investor.findOne({ userId: userId }).lean();
            if (investor) {
              return {
                _id: investor._id,
                type: "investor",
                name: investor.fullName,
                firm: investor.firm,
                sectors: investor.sectors,
                location: investor.location,
                profilePicture: investor.profilePicture,
                aiReason: match.explanation || match.reason || "AI matched as potential investor",
                matchIndex: index + 1,
              };
            }
          }
          
          // If no match found
          return {
            name: `Partner ${index + 1}`,
            aiReason: match.explanation || "AI matched suggestion",
            matchIndex: index + 1,
            notFound: true,
            rawData: match,
          };
        } catch (err) {
          console.error("Error fetching match:", err);
          return {
            name: `Match ${index + 1}`,
            aiReason: match.explanation || "AI matched suggestion",
            error: true,
          };
        }
      })
    );

    console.log("Enriched matches:", JSON.stringify(enrichedMatches, null, 2));

    // If all matches are not found, fetch random investors as alternatives
    const foundCount = enrichedMatches.filter(m => !m.notFound && !m.error).length;
    if (foundCount === 0 && enrichedMatches.length > 0) {
      console.log("No exact matches found, fetching random investors as alternatives");
      
      // Get investors that match startup's industry if possible
      let fallbackInvestors = [];
      
      if (startup.industry) {
        fallbackInvestors = await Investor.find({
          preferredSectors: { $regex: new RegExp(startup.industry, 'i') }
        }).limit(5).lean();
      }
      
      // If no sector match, get any investors
      if (fallbackInvestors.length === 0) {
        fallbackInvestors = await Investor.find({}).limit(5).lean();
      }
      
      // Create enriched responses from fallback investors
      return NextResponse.json({
        success: true,
        matches: fallbackInvestors.map((investor, index) => ({
          _id: investor._id.toString(),
          type: "investor",
          name: investor.fullName,
          firm: investor.firm,
          sectors: investor.preferredSectors,
          location: investor.location,
          profilePicture: investor.profilePicture || "/default-avatar.png",
          aiReason: enrichedMatches[index]?.aiReason || `Investor interested in ${investor.preferredSectors?.join(', ') || 'various sectors'}`,
          matchIndex: index + 1,
        })),
        note: "Showing alternative matches from our database",
      });
    }

    return NextResponse.json({
      success: true,
      matches: enrichedMatches,
    });
  } catch (error) {
    console.error("AI Matchmaking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
