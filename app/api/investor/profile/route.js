import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Investor from "@/models/Investor";

// Update investor profile
export async function PATCH(request) {
  try {
    await dbConnect();
    
    // Use role-specific cookie
    const token = request.cookies.get("investor_token")?.value || request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "investor") {
      return NextResponse.json({ error: "Only investors can update profile" }, { status: 403 });
    }

    const updates = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates._id;

    const investor = await Investor.findOneAndUpdate(
      { userId: decoded.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!investor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 });
    }

    return NextResponse.json(investor);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
