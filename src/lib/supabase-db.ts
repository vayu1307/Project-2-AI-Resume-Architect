import { supabaseServer } from "./supabase";

export type SubscriptionTier = "FREE" | "YEARLY_999" | "TWO_YEAR_UNLIMITED";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tier: SubscriptionTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
  planStartAt: string | null;
  planExpiresAt: string | null;
};

export type Resume = {
  id: string;
  userId: string;
  title: string;
  rawText: string;
  jdText: string;
  jdUrl: string | null;
  keywords: string;
  atsScore: number;
  contentJson: string;
  coverLetter: string | null;
  templateId: string;
  createdAt: string;
  updatedAt: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_current_period_end: string | null;
  plan_start_at: string | null;
  plan_expires_at: string | null;
};

type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  raw_text: string;
  jd_text: string;
  jd_url: string | null;
  keywords: string;
  ats_score: number;
  content_json: string;
  cover_letter: string | null;
  template_id: string;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    tier: row.tier,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    stripeCurrentPeriodEnd: row.stripe_current_period_end,
    planStartAt: row.plan_start_at,
    planExpiresAt: row.plan_expires_at,
  };
}

function mapResume(row: ResumeRow): Resume {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    rawText: row.raw_text,
    jdText: row.jd_text,
    jdUrl: row.jd_url,
    keywords: row.keywords,
    atsScore: row.ats_score,
    contentJson: row.content_json,
    coverLetter: row.cover_letter,
    templateId: row.template_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function requireRow<T>(row: T | null, message = "Database row was not returned"): T {
  if (!row) throw new Error(message);
  return row;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle<UserRow>();
  throwIfError(error);
  return data ? mapUser(data) : null;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle<UserRow>();
  throwIfError(error);
  return data ? mapUser(data) : null;
}

export async function createUser(input: {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<AppUser> {
  const { data, error } = await supabaseServer
    .from("users")
    .insert({
      id: input.id,
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
    })
    .select("*")
    .single<UserRow>();
  throwIfError(error);
  return mapUser(requireRow(data));
}

export async function updateUser(
  id: string,
  data: Partial<{
    tier: SubscriptionTier;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    stripeCurrentPeriodEnd: string | null;
    planStartAt: string | null;
    planExpiresAt: string | null;
  }>,
): Promise<AppUser> {
  const update = {
    tier: data.tier,
    stripe_customer_id: data.stripeCustomerId,
    stripe_subscription_id: data.stripeSubscriptionId,
    stripe_price_id: data.stripePriceId,
    stripe_current_period_end: data.stripeCurrentPeriodEnd,
    plan_start_at: data.planStartAt,
    plan_expires_at: data.planExpiresAt,
  };
  const { data: row, error } = await supabaseServer
    .from("users")
    .update(Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)))
    .eq("id", id)
    .select("*")
    .single<UserRow>();
  throwIfError(error);
  return mapUser(requireRow(row));
}

export async function countResumesByUser(userId: string): Promise<number> {
  const { count, error } = await supabaseServer
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  throwIfError(error);
  return count ?? 0;
}

export async function listResumeSummaries(userId: string) {
  const { data, error } = await supabaseServer
    .from("resumes")
    .select("id,title,ats_score,template_id,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  throwIfError(error);
  return ((data ?? []) as Pick<ResumeRow, "id" | "title" | "ats_score" | "template_id" | "updated_at">[]).map(
    (row) => ({
      id: row.id,
      title: row.title,
      atsScore: row.ats_score,
      templateId: row.template_id,
      updatedAt: row.updated_at,
    }),
  );
}

export async function getResumeForUser(id: string, userId: string): Promise<Resume | null> {
  const { data, error } = await supabaseServer
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<ResumeRow>();
  throwIfError(error);
  return data ? mapResume(data) : null;
}

export async function createResume(input: {
  userId: string;
  title: string;
  rawText: string;
  jdText: string;
  jdUrl?: string | null;
  keywords: string;
  atsScore: number;
  contentJson: string;
  coverLetter?: string | null;
  templateId: string;
}): Promise<Resume> {
  const { data, error } = await supabaseServer
    .from("resumes")
    .insert({
      user_id: input.userId,
      title: input.title,
      raw_text: input.rawText,
      jd_text: input.jdText,
      jd_url: input.jdUrl ?? null,
      keywords: input.keywords,
      ats_score: input.atsScore,
      content_json: input.contentJson,
      cover_letter: input.coverLetter ?? null,
      template_id: input.templateId,
    })
    .select("*")
    .single<ResumeRow>();
  throwIfError(error);
  return mapResume(requireRow(data));
}

export async function updateResume(
  id: string,
  input: Partial<{
    title: string;
    rawText: string;
    jdText: string;
    jdUrl: string | null;
    keywords: string;
    atsScore: number;
    contentJson: string;
    coverLetter: string | null;
    templateId: string;
  }>,
): Promise<Resume> {
  const update = {
    title: input.title,
    raw_text: input.rawText,
    jd_text: input.jdText,
    jd_url: input.jdUrl,
    keywords: input.keywords,
    ats_score: input.atsScore,
    content_json: input.contentJson,
    cover_letter: input.coverLetter,
    template_id: input.templateId,
  };
  const { data, error } = await supabaseServer
    .from("resumes")
    .update(Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)))
    .eq("id", id)
    .select("*")
    .single<ResumeRow>();
  throwIfError(error);
  return mapResume(requireRow(data));
}

export async function deleteResume(id: string): Promise<void> {
  const { error } = await supabaseServer.from("resumes").delete().eq("id", id);
  throwIfError(error);
}

export async function countAnalysisUsageSince(userId: string, since: Date): Promise<number> {
  const { count, error } = await supabaseServer
    .from("analysis_usages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  throwIfError(error);
  return count ?? 0;
}

export async function createAnalysisUsage(userId: string): Promise<void> {
  const { error } = await supabaseServer.from("analysis_usages").insert({ user_id: userId });
  throwIfError(error);
}
