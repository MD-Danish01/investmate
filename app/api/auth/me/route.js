import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Startup from "@/models/Startup";
import Investor from "@/models/Investor";

export async function GET(request) {
  try {
    await dbConnect();
    
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let profile = null;
    if (user.role === "startup") {
      profile = await Startup.findOne({ userId: user._id });
    } else if (user.role === "investor") {
      profile = await Investor.findOne({ userId: user._id });
    }

    return NextResponse.json({ user, profile });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
