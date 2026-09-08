import { NextResponse } from "next/server";
import {
  getDatabase,
  addOperative,
  removeOperative,
  getCoaches,
  addCoach,
  removeCoach,
  updateCoach,
  getTeamProfile,
  updateTeamProfile,
} from "@/lib/db";
import { validateSession, authenticateUser } from "@/lib/auth";

/**
 * Check if the request has valid Admin or Super Admin privileges
 */
function verifyCallerRole(
  token?: string,
  authHeader?: string | null,
  password?: string
): { authorized: boolean; role: "SUPER_ADMIN" | "ADMIN" | null; error?: string } {
  // 1. First check session token
  const bearerToken = authHeader?.replace("Bearer ", "").trim() || token;
  if (bearerToken) {
    const { valid, session } = validateSession(bearerToken);
    if (valid && session) {
      if (session.role === "SUPER_ADMIN") {
        return { authorized: true, role: "SUPER_ADMIN" };
      }
      if (session.role === "ADMIN") {
        return { authorized: true, role: "ADMIN" };
      }
    }
  }

  // 2. Fallback check via secure cryptographic authentication (timing-safe salted PBKDF2)
  if (password) {
    // Try Super Admin (Morfit)
    const superRes = authenticateUser("morfit", password);
    if (superRes.success && superRes.user?.role === "SUPER_ADMIN") {
      return { authorized: true, role: "SUPER_ADMIN" };
    }

    // Try Coach Admin (Coach)
    const adminRes = authenticateUser("coach", password);
    if (adminRes.success && adminRes.user?.role === "ADMIN") {
      return { authorized: true, role: "ADMIN" };
    }
  }

  return { authorized: false, role: null, error: "Unauthorized. Valid Admin or Super Admin credentials required." };
}

export async function GET(request: Request) {
  try {
    const db = getDatabase();
    return NextResponse.json({
      success: true,
      coaches: getCoaches(),
      teamProfile: getTeamProfile(),
      playerCount: db.players.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, token, password } = body;
    const authHeader = request.headers.get("Authorization");

    const authCheck = verifyCallerRole(token, authHeader, password);

    if (!authCheck.authorized || !authCheck.role) {
      return NextResponse.json(
        { success: false, error: authCheck.error || "Unauthorized. Insufficient permissions." },
        { status: 401 }
      );
    }

    const isSuperAdmin = authCheck.role === "SUPER_ADMIN";

    // Role Verification
    if (action === "VERIFY_ROLE") {
      return NextResponse.json({
        success: true,
        role: authCheck.role,
        message: isSuperAdmin ? "Authenticated as Super Admin" : "Authenticated as Admin",
      });
    }

    // Add Player (Admin & Super Admin)
    if (action === "ADD_PLAYER") {
      const { player, role, agent, kd, acs, hsPercent, aim, utility, comms, entry, clutch } = body;
      const newPlayer = addOperative({
        player,
        role: role || "Duelist",
        agent: agent || "Jett",
        kd: parseFloat(kd) || 1.0,
        acs: parseFloat(acs) || 200,
        hsPercent: parseFloat(hsPercent) || 25,
        aim: parseFloat(aim) || 8.0,
        utility: parseFloat(utility) || 8.0,
        comms: parseFloat(comms) || 8.0,
        entry: parseFloat(entry) || 8.0,
        clutch: parseFloat(clutch) || 8.0,
      });
      return NextResponse.json({ success: true, message: `Player ${player} added to roster.`, player: newPlayer });
    }

    // Remove Player (Admin & Super Admin)
    if (action === "REMOVE_PLAYER") {
      const { playerId } = body;
      const updatedPlayers = removeOperative(playerId);
      return NextResponse.json({ success: true, message: `Player ${playerId} removed from roster.`, players: updatedPlayers });
    }

    // Add Coach (Admin & Super Admin)
    if (action === "ADD_COACH") {
      const { name, email, title, specialization, assignedPlayers } = body;
      const newCoach = addCoach({
        name,
        email,
        title: title || "Assistant Coach",
        specialization: specialization || "Strategic Analyst",
        assignedPlayers: assignedPlayers || [],
      });
      return NextResponse.json({ success: true, message: `Coach ${name} added.`, coach: newCoach });
    }

    // Remove Coach (Admin & Super Admin)
    if (action === "REMOVE_COACH") {
      const { coachId } = body;
      const updatedCoaches = removeCoach(coachId);
      return NextResponse.json({ success: true, message: `Coach removed.`, coaches: updatedCoaches });
    }

    // Configure Coach Login Data (Admin & Super Admin)
    if (action === "UPDATE_COACH") {
      const { coachId, updates } = body;
      const updatedCoach = updateCoach(coachId, updates);
      return NextResponse.json({ success: true, message: `Coach data updated.`, coach: updatedCoach });
    }

    // Update Team Profile (Super Admin Only)
    if (action === "UPDATE_TEAM") {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { success: false, error: "Only Super Admin can modify core team identity and branding." },
          { status: 403 }
        );
      }
      const { teamProfile } = body;
      const updated = updateTeamProfile(teamProfile);
      return NextResponse.json({ success: true, message: "Team profile updated.", teamProfile: updated });
    }

    return NextResponse.json({ success: false, error: `Unknown action ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
