import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/lib/supabase-db";
import { supabaseServer } from "@/lib/supabase";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(80).optional(),
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function logRegistrationError(requestId: string, stage: string, error: unknown) {
  console.error("[register]", {
    requestId,
    stage,
    message: getErrorMessage(error),
    error,
  });
}

function registrationErrorResponse(requestId: string, stage: string, error: unknown, status = 500) {
  logRegistrationError(requestId, stage, error);

  const message = getErrorMessage(error);
  return NextResponse.json(
    {
      error:
        process.env.NODE_ENV === "production"
          ? "Registration failed. Check the server logs with this request id."
          : message,
      requestId,
      stage,
    },
    { status },
  );
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues.map((issue) => issue.message).join(", "),
          requestId,
          stage: "validate_input",
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    let existing;
    try {
      existing = await getUserByEmail(email);
    } catch (error) {
      return registrationErrorResponse(requestId, "check_existing_user", error);
    }

    if (existing) {
      return NextResponse.json({ error: "Email already registered", requestId, stage: "existing_user" }, { status: 409 });
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password: parsed.data.password,
      user_metadata: { name: parsed.data.name?.trim() || undefined },
      email_confirm: true,
    });

    if (error || !data.user) {
      return registrationErrorResponse(
        requestId,
        "create_auth_user",
        error || new Error("Supabase auth user was not returned"),
      );
    }

    try {
      await createUser({
        id: data.user.id,
        email,
        name: parsed.data.name?.trim() || null,
      });
    } catch (error) {
      await supabaseServer.auth.admin.deleteUser(data.user.id).catch((deleteError) => {
        logRegistrationError(requestId, "rollback_auth_user", deleteError);
      });
      return registrationErrorResponse(requestId, "create_profile", error);
    }

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    return registrationErrorResponse(requestId, "unexpected", error);
  }
}
