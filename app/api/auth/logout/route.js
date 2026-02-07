import { NextResponse } from "next/server";

export async function POST(request) {
  // Get role from query param or body to clear the correct cookie
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "startup";
  
  const response = NextResponse.json({ message: "Logged out" });
  
  // Clear the role-specific cookie
  const cookieName = role === "investor" ? "investor_token" : "startup_token";
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    expires: new Date(0),
  });
  return response;
}
