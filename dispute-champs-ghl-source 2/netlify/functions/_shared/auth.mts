import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function passwordMatches(candidate: string, expected: string) {
  const candidateHash = createHmac("sha256", "dc-admin-password")
    .update(candidate)
    .digest();
  const expectedHash = createHmac("sha256", "dc-admin-password")
    .update(expected)
    .digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export function getAdminSessionSecret(password: string) {
  return createHmac("sha256", "dc-admin-session")
    .update(password)
    .digest("hex");
}

export function createAdminToken(secret: string) {
  const payload = encode(
    JSON.stringify({
      exp: Date.now() + 1000 * 60 * 60 * 8,
      nonce: randomBytes(16).toString("hex"),
    }),
  );
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyAdminToken(token: string, secret: string) {
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return false;

  const expectedSignature = signature(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}
