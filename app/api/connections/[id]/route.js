import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Connection from "@/models/Connection";
import Startup from "@/models/Startup";

// Update connection status (accept/reject)
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    // Use role-specific cookie
    const token = request.cookies.get("startup_token")?.value || request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "startup") {
      return NextResponse.json({ error: "Only startups can update status" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify this connection belongs to the startup
    const startup = await Startup.findOne({ userId: decoded.userId }).select('_id').lean();
    const connection = await Connection.findOne({
      _id: id,
      startupId: startup._id,
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    connection.status = status;
    await connection.save();

    return NextResponse.json(connection);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
