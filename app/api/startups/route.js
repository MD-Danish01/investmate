import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Startup from "@/models/Startup";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    // Build filter query
    const filter = {};
    
    const industry = searchParams.get("industry");
    if (industry && industry !== "all") {
      filter.industry = industry;
    }
    
    const stage = searchParams.get("stage");
    if (stage && stage !== "all") {
      filter.stage = stage;
    }
    
    const location = searchParams.get("location");
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }
    
    const search = searchParams.get("search");
    if (search) {
      filter.$or = [
        { startupName: { $regex: search, $options: "i" } },
        { tagline: { $regex: search, $options: "i" } },
        { problem: { $regex: search, $options: "i" } },
      ];
    }

    const startups = await Startup.find(filter)
      .select('startupName tagline founderName location stage industry problem solution traction userId createdAt')
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Filter out any startups where userId population failed (orphaned records)
    const validStartups = startups.filter(s => s.userId !== null);

    return NextResponse.json(validStartups);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
