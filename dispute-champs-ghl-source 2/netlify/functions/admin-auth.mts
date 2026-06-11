import {
  createAdminToken,
  passwordMatches,
} from "./_shared/auth.mts";

export default async (request: Request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !sessionSecret) {
    return Response.json(
      { error: "Administrator access has not been configured yet." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;
  if (
    !body?.password ||
    body.password.length > 200 ||
    !passwordMatches(body.password, password)
  ) {
    return Response.json(
      { error: "Incorrect administrator password." },
      { status: 401 },
    );
  }

  return Response.json({
    token: createAdminToken(sessionSecret),
  });
};
