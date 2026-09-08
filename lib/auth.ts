import crypto from "crypto";
import { UserAccount, SessionRecord, UserRole } from "@/lib/types";
import { getDatabase, saveDatabase } from "@/lib/db";

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";
const SESSION_DURATION_HOURS = 48;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Generate cryptographic random salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Hash password with salt using PBKDF2 with 100,000 rounds of SHA-512
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || generateSalt();
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { hash, salt };
}

/**
 * Timing-safe password verification to mitigate timing analysis attacks
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
    const bufferA = Buffer.from(computedHash, "hex");
    const bufferB = Buffer.from(storedHash, "hex");

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch (err) {
    return false;
  }
}

/**
 * Validates password strength adhering to cybersecurity guidelines
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number; // 0 to 4
  errors: string[];
  checks: {
    hasLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} {
  const checks = {
    hasLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const errors: string[] = [];
  if (!checks.hasLength) errors.push("Password must be at least 8 characters long.");
  if (!checks.hasUpper) errors.push("Include at least one uppercase letter (A-Z).");
  if (!checks.hasLower) errors.push("Include at least one lowercase letter (a-z).");
  if (!checks.hasNumber) errors.push("Include at least one number (0-9).");
  if (!checks.hasSpecial) errors.push("Include at least one special character (!@#$%...).");

  let score = 0;
  if (checks.hasLength) score++;
  if (checks.hasUpper && checks.hasLower) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSpecial) score++;

  return {
    valid: errors.length === 0,
    score,
    errors,
    checks,
  };
}

/**
 * Sanitize username against XSS and injection
 */
export function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_\-\.]/g, "").trim().slice(0, 32);
}

/**
 * Generate cryptographically secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Seed initial administrative accounts with secure salted hashes if not already seeded
 */
export function ensureDefaultAccountsSeeded(): void {
  const db = getDatabase();
  if (!db.users) {
    db.users = [];
  }

  // Pre-seed Super Admin (Morfit)
  const superAdminExists = db.users.some(
    (u) => u.username.toLowerCase() === "morfit" || u.role === "SUPER_ADMIN"
  );
  if (!superAdminExists) {
    // Initial seeded credential securely hashed
    const superSalt = generateSalt();
    const superHash = crypto.pbkdf2Sync("M@rfit", superSalt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

    db.users.push({
      id: "user-super-admin",
      username: "morfit",
      email: "morfit@intellectual.gg",
      displayName: "Morfit (Platform Architect)",
      role: "SUPER_ADMIN",
      passwordHash: superHash,
      salt: superSalt,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      failedAttempts: 0,
      lockedUntil: null,
    });
  }

  // Pre-seed Coach Admin (Coach)
  const adminExists = db.users.some(
    (u) => u.username.toLowerCase() === "coach" || (u.role === "ADMIN" && u.username !== "morfit")
  );
  if (!adminExists) {
    // Initial seeded credential securely hashed
    const adminSalt = generateSalt();
    const adminHash = crypto.pbkdf2Sync("co@ch", adminSalt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");

    db.users.push({
      id: "user-coach-admin",
      username: "coach",
      email: "coach@intellectual.gg",
      displayName: "Head Coach",
      role: "ADMIN",
      passwordHash: adminHash,
      salt: adminSalt,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      failedAttempts: 0,
      lockedUntil: null,
    });
  }

  saveDatabase(db);
}

/**
 * Authenticate user with brute force lockout prevention
 */
export function authenticateUser(
  identifier: string, // username or email
  password: string
): {
  success: boolean;
  error?: string;
  user?: UserAccount;
  session?: SessionRecord;
} {
  ensureDefaultAccountsSeeded();
  const db = getDatabase();
  const users = db.users || [];

  const cleanId = identifier.trim().toLowerCase();
  const user = users.find(
    (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
  );

  if (!user) {
    return { success: false, error: "Invalid username, email, or password." };
  }

  // Check account lockout
  if (user.lockedUntil) {
    const lockedUntilTime = new Date(user.lockedUntil).getTime();
    if (Date.now() < lockedUntilTime) {
      const remainingMinutes = Math.ceil((lockedUntilTime - Date.now()) / (60 * 1000));
      return {
        success: false,
        error: `Account temporarily locked due to consecutive failed attempts. Try again in ${remainingMinutes} minute(s).`,
      };
    } else {
      // Lock expired
      user.lockedUntil = null;
      user.failedAttempts = 0;
    }
  }

  const isPasswordValid = verifyPassword(password, user.passwordHash, user.salt);

  if (!isPasswordValid) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
      saveDatabase(db);
      return {
        success: false,
        error: `Account locked for 15 minutes due to ${MAX_FAILED_ATTEMPTS} failed attempts.`,
      };
    }
    saveDatabase(db);
    return { success: false, error: "Invalid username, email, or password." };
  }

  // Authentication succeeded - reset failed attempts
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.lastLogin = new Date().toISOString();

  // Create session
  if (!db.sessions) {
    db.sessions = [];
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString();

  const session: SessionRecord = {
    token,
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  // Clean old expired sessions
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());
  db.sessions.push(session);

  saveDatabase(db);

  return {
    success: true,
    user,
    session,
  };
}

/**
 * Register a new user account with cybersecurity guidelines
 */
export function registerUser(
  username: string,
  email: string,
  password: string,
  displayName?: string
): {
  success: boolean;
  error?: string;
  user?: UserAccount;
  session?: SessionRecord;
} {
  ensureDefaultAccountsSeeded();
  const db = getDatabase();
  const users = db.users || [];

  const cleanUsername = sanitizeUsername(username);
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    return { success: false, error: "Username must be at least 3 characters alphanumeric." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: "Please provide a valid email address." };
  }

  // Check uniqueness
  const existingUser = users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
  );
  if (existingUser) {
    return { success: false, error: "Username or email is already registered." };
  }

  // Validate password strength
  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    return { success: false, error: validation.errors[0] };
  }

  const { hash, salt } = hashPassword(password);
  const newUser: UserAccount = {
    id: `user-${crypto.randomBytes(8).toString("hex")}`,
    username: cleanUsername,
    email: cleanEmail,
    displayName: displayName?.trim() || cleanUsername,
    role: "USER", // Standard role for registrations
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    failedAttempts: 0,
    lockedUntil: null,
  };

  if (!db.users) db.users = [];
  db.users.push(newUser);

  // Auto create session upon registration
  if (!db.sessions) db.sessions = [];
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString();

  const session: SessionRecord = {
    token,
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  db.sessions.push(session);
  saveDatabase(db);

  return {
    success: true,
    user: newUser,
    session,
  };
}

/**
 * Validate active session token
 */
export function validateSession(token: string): {
  valid: boolean;
  session?: SessionRecord;
  user?: UserAccount;
} {
  if (!token) return { valid: false };

  ensureDefaultAccountsSeeded();
  const db = getDatabase();
  const sessions = db.sessions || [];

  const session = sessions.find((s) => s.token === token);
  if (!session) return { valid: false };

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // Expired
    return { valid: false };
  }

  const users = db.users || [];
  const user = users.find((u) => u.id === session.userId);

  return {
    valid: true,
    session,
    user,
  };
}

/**
 * Invalidate session token (logout)
 */
export function logoutSession(token: string): boolean {
  const db = getDatabase();
  if (!db.sessions) return true;

  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase(db);
  return true;
}
