import {
  countAnalysisUsageSince,
  countResumesByUser,
  createAnalysisUsage,
  getUserById,
  type SubscriptionTier,
} from "./supabase-db";

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const u = await getUserById(userId);
  if (u?.planExpiresAt && new Date(u.planExpiresAt) <= new Date()) return "FREE";
  return u?.tier ?? "FREE";
}

export async function canCreateResume(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;
  const tier = await getUserTier(userId);
  if (tier !== "FREE") return true;
  return (await countResumesByUser(userId)) < 1;
}

export function canUseTemplate(tier: SubscriptionTier, templateId: string): boolean {
  if (templateId === "premium" || templateId === "executive") {
    return tier !== "FREE";
  }
  return true;
}

export function canGenerateCoverLetter(tier: SubscriptionTier): boolean {
  return tier !== "FREE";
}

type AnalysisAllowance = {
  allowed: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  windowLabel: string;
  message?: string;
};

function startOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function startOfPlanYear(planStartAt: string | null): Date {
  const start = planStartAt ? new Date(planStartAt) : new Date();
  const now = new Date();
  const windowStart = new Date(start);
  while (windowStart <= now) {
    const next = new Date(windowStart);
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    if (next > now) break;
    windowStart.setTime(next.getTime());
  }
  return windowStart;
}

export async function getAnalysisAllowance(userId: string): Promise<AnalysisAllowance> {
  const user = await getUserById(userId);
  const tier = await getUserTier(userId);
  if (!user || tier === "FREE") {
    const since = startOfMonth();
    const used = await countAnalysisUsageSince(userId, since);
    const limit = 5;
    return {
      allowed: used < limit,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      windowLabel: "this month",
      message: used >= limit ? "Free plan analysis limit reached." : undefined,
    };
  }

  if (tier === "TWO_YEAR_UNLIMITED") {
    return {
      allowed: true,
      limit: null,
      used: 0,
      remaining: null,
      windowLabel: "active plan",
    };
  }

  const since = startOfPlanYear(user.planStartAt);
  const used = await countAnalysisUsageSince(userId, since);
  const limit = 100;
  return {
    allowed: used < limit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    windowLabel: "this plan year",
    message: used >= limit ? "Starter plan analysis limit reached." : undefined,
  };
}

export async function consumeAnalysisQuota(userId: string): Promise<AnalysisAllowance> {
  const allowance = await getAnalysisAllowance(userId);
  if (!allowance.allowed) return allowance;
  await createAnalysisUsage(userId);
  if (allowance.limit === null) return allowance;
  return {
    ...allowance,
    used: allowance.used + 1,
    remaining: Math.max(0, (allowance.remaining ?? 0) - 1),
  };
}
