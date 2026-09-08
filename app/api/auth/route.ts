import { NextResponse } from "next/server";
import {
  authenticateUser,
  registerUser,
  validateSession,
  logoutSession,
  validatePasswordStrength,
} from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ authenticated: false, role: "GUEST" });
    }

    const { valid, session, user } = validateSession(token);
    if (!valid || !session || !user) {
      return NextResponse.json({ authenticated: false, role: "GUEST" });
    }

    return NextResponse.json({
      authenticated: true,
      role: session.role,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      expiresAt: session.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. LOGIN
    if (action === "LOGIN") {
      const { identifier, password } = body;
      if (!identifier || !password) {
        return NextResponse.json(
          { success: false, error: "Username/Email and Password are required." },
          { status: 400 }
        );
      }

      const result = authenticateUser(identifier, password);
      if (!result.success || !result.session || !result.user) {
        return NextResponse.json(
          { success: false, error: result.error || "Authentication failed." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Welcome back, ${result.user.displayName || result.user.username}!`,
        token: result.session.token,
        role: result.session.role,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          displayName: result.user.displayName,
          role: result.user.role,
        },
      });
    }

    // 2. REGISTER
    if (action === "REGISTER") {
      const { username, email, password, displayName } = body;
      if (!username || !email || !password) {
        return NextResponse.json(
          { success: false, error: "Username, email, and password are required." },
          { status: 400 }
        );
      }

      const result = registerUser(username, email, password, displayName);
      if (!result.success || !result.session || !result.user) {
        return NextResponse.json(
          { success: false, error: result.error || "Registration failed." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Account created successfully with secure credentials.",
        token: result.session.token,
        role: result.session.role,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          displayName: result.user.displayName,
          role: result.user.role,
        },
      });
    }

    // 3. CHECK PASSWORD STRENGTH HELPER
    if (action === "CHECK_PASSWORD_STRENGTH") {
      const { password } = body;
      const evaluation = validatePasswordStrength(password || "");
      return NextResponse.json({ success: true, evaluation });
    }

    // 4. VERIFY TOKEN
    if (action === "VERIFY") {
      const { token } = body;
      const { valid, session, user } = validateSession(token);
      if (!valid || !session || !user) {
        return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        role: session.role,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      });
    }

    // 5. LOGOUT
    if (action === "LOGOUT") {
      const { token } = body;
      if (token) {
        logoutSession(token);
      }
      return NextResponse.json({ success: true, message: "Logged out successfully." });
    }

    return NextResponse.json({ success: false, error: `Unknown action ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
