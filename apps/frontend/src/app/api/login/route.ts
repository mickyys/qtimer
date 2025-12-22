import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import { serialize } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: Request) {
  if (!SECRET_KEY || !ADMIN_PASSWORD) {
    console.error("Missing JWT_SECRET or ADMIN_PASSWORD environment variables");
    return new Response(JSON.stringify({ message: "Server configuration error" }), { status: 500 });
  }

  const { password } = await req.json();

  if (password === ADMIN_PASSWORD) {
    // Create a JWT token
    const token = sign({ user: "admin" }, SECRET_KEY, { expiresIn: "1h" });

    // Serialize the cookie
    const serializedCookie = serialize("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return new Response(JSON.stringify({ message: "Authenticated" }), {
      status: 200,
      headers: {
        "Set-Cookie": serializedCookie,
      },
    });
  } else {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  }
}
