import { createHmac, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

export const sessionCookieName = "dimovtax_session";

const scryptAsync = promisify(scrypt);

type SessionPayload = {
  exp: number;
  name: string;
};

const defaultUser = {
  passwordHash:
    "scrypt$nl9GT1cUTXBUX9ZDRa2WhQ$zwuB3iaiu93ecWs2Taf_n3ZwCwWpw7Z452OlzS8WDv5OLlSIy4xtG2d1ZE-VZTUxZ937ABOGdA5QnyyqAw9Pig",
  name: "Demo User",
  username: "admin@dimovtax.local",
};

export function getDemoUser() {
  return {
    name: process.env.DEMO_USER_NAME ?? defaultUser.name,
    passwordHash: process.env.DEMO_PASSWORD_HASH ?? defaultUser.passwordHash,
    username: process.env.DEMO_USERNAME ?? defaultUser.username,
  };
}

export async function validateCredentials(username: string, password: string) {
  const user = getDemoUser();

  return username === user.username && verifyPasswordHash(password, user.passwordHash);
}

export function createSessionToken(name = getDemoUser().name) {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
    name,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromCookieHeader(cookieHeader: string | null) {
  const token = cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${sessionCookieName}=`))
    ?.split("=")[1];

  return verifySessionToken(token);
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
}

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "local-development-session-secret-change-me";
}

async function verifyPasswordHash(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const storedHashBuffer = Buffer.from(hash, "base64url");
  const passwordHashBuffer = (await scryptAsync(
    password,
    salt,
    storedHashBuffer.length,
  )) as Buffer;

  return (
    storedHashBuffer.length === passwordHashBuffer.length &&
    timingSafeEqual(storedHashBuffer, passwordHashBuffer)
  );
}
