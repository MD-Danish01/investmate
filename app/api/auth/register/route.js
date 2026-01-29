import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Startup from "@/models/Startup";
import Investor from "@/models/Investor";

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, role, ...profileData } = body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Create profile based on role
    if (role === "startup") {
      await Startup.create({
        userId: user._id,
        startupName: profileData.startupName || name,
        tagline: profileData.tagline || "No tagline",
        founderName: name,
        problem: profileData.problem || "To be updated",
        solution: profileData.solution || "To be updated",
        ...profileData,
      });
    } else if (role === "investor") {
      await Investor.create({
        userId: user._id,
        fullName: name,
        ...profileData,
      });
    }

    return NextResponse.json(
      { message: "User registered successfully", userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
