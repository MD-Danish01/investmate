import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Startup from "@/models/Startup";

// Update startup profile
export async function PATCH(request) {
  try {
    await dbConnect();
    
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "startup") {
      return NextResponse.json({ error: "Only startups can update profile" }, { status: 403 });
    }

    const updates = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates._id;

    const startup = await Startup.findOneAndUpdate(
      { userId: decoded.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!startup) {
      return NextResponse.json({ error: "Startup not found" }, { status: 404 });
    }

    return NextResponse.json(startup);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
