import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Connection from "@/models/Connection";
import Investor from "@/models/Investor";

// Create a connection request (investor expresses interest)
export async function POST(request) {
  try {
    await dbConnect();
    
    // Get token from cookies
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "investor") {
      return NextResponse.json({ error: "Only investors can send requests" }, { status: 403 });
    }

    // Get investor profile
    const investor = await Investor.findOne({ userId: decoded.userId }).select('_id').lean();
    if (!investor) {
      return NextResponse.json({ error: "Investor profile not found" }, { status: 404 });
    }

    const { startupId, message } = await request.json();

    // Check if connection already exists
    const existing = await Connection.findOne({
      investorId: investor._id,
      startupId,
    }).select('_id').lean();

    if (existing) {
      return NextResponse.json({ error: "Already expressed interest" }, { status: 400 });
    }

    const connection = await Connection.create({
      investorId: investor._id,
      startupId,
      message: message || "Interested in your startup",
      status: "pending",
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get connections (for both startup and investor)
export async function GET(request) {
  try {
    await dbConnect();
    
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get("startupId");

    let connections;

    if (decoded.role === "startup") {
      // Startup sees interested investors
      const Startup = (await import("@/models/Startup")).default;
      const startup = await Startup.findOne({ userId: decoded.userId }).select('_id').lean();
      
      if (!startup) {
        return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
      }
      
      connections = await Connection.find({ startupId: startup._id })
        .populate({
          path: "investorId",
          select: "fullName firm sectors location bio",
          populate: { path: "userId", select: "name email" }
        })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Investor sees their sent requests
      const investor = await Investor.findOne({ userId: decoded.userId }).select('_id').lean();
      
      if (!investor) {
        return NextResponse.json({ error: "Investor profile not found" }, { status: 404 });
      }
      
      connections = await Connection.find({ investorId: investor._id })
        .populate({
          path: "startupId",
          select: "startupName tagline stage industry location",
          populate: { path: "userId", select: "name email" }
        })
        .sort({ createdAt: -1 })
        .lean();
    }

    return NextResponse.json(connections);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
