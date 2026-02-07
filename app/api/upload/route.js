import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Startup from "@/models/Startup";
import Investor from "@/models/Investor";

// Configure Cloudinary - supports both CLOUDINARY_URL and individual env vars
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
  // SDK auto-configures from this URL
  const url = new URL(process.env.CLOUDINARY_URL.replace("cloudinary://", "https://"));
  cloudinary.config({
    cloud_name: url.hostname,
    api_key: url.username,
    api_secret: url.password,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request) {
  try {
    await dbConnect();

    const formData = await request.formData();
    const file = formData.get("file");
    const imageType = formData.get("type") || "profile"; // "profile" or "cover"
    const requestedRole = formData.get("role"); // "startup" or "investor"
    
    // Try role-specific cookie first
    let token = null;
    if (requestedRole === "startup") {
      token = request.cookies.get("startup_token")?.value;
    } else if (requestedRole === "investor") {
      token = request.cookies.get("investor_token")?.value;
    } else {
      token = request.cookies.get("startup_token")?.value || 
              request.cookies.get("investor_token")?.value ||
              request.cookies.get("token")?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role } = decoded;
    
    // Verify role matches if requested
    if (requestedRole && role !== requestedRole) {
      return NextResponse.json({ error: "Role mismatch" }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB for profile, 5MB for cover)
    const maxSize = imageType === "cover" ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${imageType === "cover" ? "5MB" : "2MB"} limit` },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary with different transformations based on type
    const transformation = imageType === "cover"
      ? [
          { width: 800, height: 300, crop: "fill" },
          { quality: "auto", fetch_format: "auto" },
        ]
      : [
          { width: 200, height: 200, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ];

    const result = await cloudinary.uploader.upload(base64, {
      folder: `investmate/${role}s/${imageType}`,
      transformation,
    });

    // Update user profile with new image URL
    const imageUrl = result.secure_url;

    if (role === "startup") {
      const updateField = imageType === "cover" ? { coverImage: imageUrl } : { profilePicture: imageUrl };
      await Startup.findOneAndUpdate({ userId }, updateField, { new: true });
    } else if (role === "investor") {
      await Investor.findOneAndUpdate(
        { userId },
        { profilePicture: imageUrl }
      );
    }

    return NextResponse.json({
      message: "Image uploaded successfully",
      imageUrl,
      type: imageType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
