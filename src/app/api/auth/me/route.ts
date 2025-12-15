import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@farcaster/quick-auth";

const client = createClient();

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    // Use the production domain for verification
    const domain = process.env.NODE_ENV === "production"
      ? "https://geoguesserv1.vercel.app"
      : req.nextUrl.origin;
    
    const payload = await client.verifyJwt({ token, domain });
    // Minimal response; extend as needed (e.g., look up user in DB)
    return NextResponse.json({ fid: payload.sub });
  } catch (e) {
    console.error("JWT verification failed:", e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
