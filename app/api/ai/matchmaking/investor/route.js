import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";
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
    
    let parsed = null;
    let aiCallFailed = false;
    
    if (aiApiUrl) {
      try {
        const response = await fetch(`${aiApiUrl}/matchmaking-investor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ investorData: investor }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Raw AI response:", JSON.stringify(data, null, 2));
          parsed = parseAIResponse(data);
          console.log("Parsed AI response:", JSON.stringify(parsed, null, 2));
        } else {
          console.log("AI API returned error status:", response.status);
          aiCallFailed = true;
        }
      } catch (aiError) {
        console.log("AI API call failed:", aiError.message);
        aiCallFailed = true;
      }
    } else {
      console.log("AI service not configured, using fallback");
      aiCallFailed = true;
    }
    
    // If AI call failed, fall back to database-based matching
    if (aiCallFailed || !parsed) {
      console.log("Using database fallback for investor matchmaking");
      
      let fallbackStartups = [];
      
      // Try matching by investor's preferred sectors
      if (investor.preferredSectors && investor.preferredSectors.length > 0) {
        fallbackStartups = await Startup.find({
          industry: { $in: investor.preferredSectors }
        }).limit(6).lean();
      }
      
      // If no sector match, get random startups
      if (fallbackStartups.length === 0) {
        fallbackStartups = await Startup.find({}).limit(6).lean();
      }
      
      return NextResponse.json({
        success: true,
        matches: fallbackStartups.map((startup, index) => ({
          _id: startup._id.toString(),
          userId: startup.userId?.toString(),
          startupName: startup.startupName,
          tagline: startup.tagline,
          founderName: startup.founderName,
          industry: startup.industry,
          stage: startup.stage,
          location: startup.location,
          funding: startup.funding,
          problem: startup.problem,
          solution: startup.solution,
          profilePicture: startup.profilePicture || "/default-avatar.png",
          coverImage: startup.coverImage,
          aiReason: `This ${startup.industry} startup matches your investment preferences in ${investor.preferredSectors?.join(", ") || "emerging sectors"}`,
          matchIndex: index + 1,
        })),
        note: "Showing recommended matches based on your preferences",
      });
    }

    // Handle different response structures
    let aiMatches = [];
    if (Array.isArray(parsed)) {
      aiMatches = parsed;
    } else if (parsed.matches && Array.isArray(parsed.matches)) {
      aiMatches = parsed.matches;
    } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      aiMatches = parsed.recommendations;
    } else if (parsed.startups && Array.isArray(parsed.startups)) {
      aiMatches = parsed.startups;
    } else if (parsed.results && Array.isArray(parsed.results)) {
      aiMatches = parsed.results;
    }

    // Fetch startup details for each matched userid
    const enrichedMatches = await Promise.all(
      aiMatches.map(async (match, index) => {
        try {
          // Get userid from match - AI returns { userid, explanation }
          const matchId = match.userid || match.userId || match.user_id || match.startupId;
          
          if (matchId) {
            // Try to find startup - first by userId field, then by _id
            let startup = await Startup.findOne({ userId: matchId }).lean();
            
            // If not found by userId, try by startup's own _id
            if (!startup) {
              try {
                startup = await Startup.findById(matchId).lean();
              } catch (e) {
                // Invalid ObjectId format, ignore
              }
            }
            
            // If still not found, try finding by name match from the seeded data
            if (!startup && match.explanation) {
              // Extract startup name from explanation if possible
              const nameMatch = match.explanation.match(/^(\w+)\s/);
              if (nameMatch) {
                startup = await Startup.findOne({ 
                  startupName: { $regex: new RegExp(`^${nameMatch[1]}`, 'i') }
                }).lean();
              }
            }
            
            if (startup) {
              return {
                _id: startup._id.toString(),
                userId: startup.userId?.toString(),
                startupName: startup.startupName,
                tagline: startup.tagline,
                founderName: startup.founderName,
                industry: startup.industry,
                stage: startup.stage,
                location: startup.location,
                funding: startup.funding,
                problem: startup.problem,
                solution: startup.solution,
                profilePicture: startup.profilePicture || "/default-avatar.png",
                coverImage: startup.coverImage,
                aiReason: match.explanation || match.reason || match.why || "AI matched based on your investment preferences",
                matchIndex: index + 1,
              };
            }
          }
          
          // If no startup found, return AI data with the explanation
          return {
            startupName: `Match ${index + 1}`,
            aiReason: match.explanation || match.reason || "AI matched suggestion",
            matchIndex: index + 1,
            notFound: true,
          };
        } catch (err) {
          console.error("Error fetching startup:", err);
          return {
            startupName: `Match ${index + 1}`,
            aiReason: match.explanation || "AI matched suggestion",
            error: true,
          };
        }
      })
    );

    console.log("Enriched matches:", JSON.stringify(enrichedMatches, null, 2));

    // If all matches are not found, fetch random startups as alternatives
    const foundCount = enrichedMatches.filter(m => !m.notFound && !m.error).length;
    if (foundCount === 0 && enrichedMatches.length > 0) {
      console.log("No exact matches found, fetching random startups as alternatives");
      
      // Get random startups that match investor's preferences if possible
      let fallbackStartups = [];
      
      if (investor.preferredSectors && investor.preferredSectors.length > 0) {
        fallbackStartups = await Startup.find({
          industry: { $in: investor.preferredSectors }
        }).limit(5).lean();
      }
      
      // If no sector match, get any startups
      if (fallbackStartups.length === 0) {
        fallbackStartups = await Startup.find({}).limit(5).lean();
      }
      
      // Create enriched responses from fallback startups
      return NextResponse.json({
        success: true,
        matches: fallbackStartups.map((startup, index) => ({
          _id: startup._id.toString(),
          userId: startup.userId?.toString(),
          startupName: startup.startupName,
          tagline: startup.tagline,
          founderName: startup.founderName,
          industry: startup.industry,
          stage: startup.stage,
          location: startup.location,
          funding: startup.funding,
          problem: startup.problem,
          solution: startup.solution,
          profilePicture: startup.profilePicture || "/default-avatar.png",
          coverImage: startup.coverImage,
          aiReason: enrichedMatches[index]?.aiReason || `This ${startup.industry} startup aligns with your investment focus`,
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
