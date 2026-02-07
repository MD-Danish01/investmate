import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Startup from "@/models/Startup";
import Investor from "@/models/Investor";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Check for role query param to determine which cookie to use
    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get("role");
    
    // Try role-specific cookie first, then fall back to generic token
    let token = null;
    if (requestedRole === "startup") {
      token = request.cookies.get("startup_token")?.value;
    } else if (requestedRole === "investor") {
      token = request.cookies.get("investor_token")?.value;
    } else {
      // Try both (for backward compatibility)
      token = request.cookies.get("startup_token")?.value || 
              request.cookies.get("investor_token")?.value ||
              request.cookies.get("token")?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify role matches if requested
    if (requestedRole && decoded.role !== requestedRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await User.findById(decoded.userId).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let profile = null;
    if (user.role === "startup") {
      profile = await Startup.findOne({ userId: user._id }).lean();
    } else if (user.role === "investor") {
      profile = await Investor.findOne({ userId: user._id }).lean();
    }

    return NextResponse.json({ user, profile });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
