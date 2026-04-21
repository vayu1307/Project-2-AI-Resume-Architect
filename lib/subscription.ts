import type { SubscriptionTier } from "@prisma/client";
import { prisma } from "./prisma";

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });
  return u?.tier ?? "FREE";
}

export async function canCreateResume(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, _count: { select: { resumes: true } } },
  });
  if (!user) return false;
  if (user.tier !== "FREE") return true;
  return user._count.resumes < 1;
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

export async function getAnalysisAllowance(userId: string): Promise<AnalysisAllowance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, planStartAt: true, planExpiresAt: true },
  });
  if (!user) {
    return {
      allowed: false,
      limit: 0,
      used: 0,
      remaining: 0,
      windowLabel: "N/A",
      message: "User not found",
    };
  }

  const now = new Date();
  const planExpired = !!user.planExpiresAt && user.planExpiresAt <= now;
  const effectiveTier: SubscriptionTier = planExpired ? "FREE" : user.tier;

  if (effectiveTier === "TWO_YEAR_UNLIMITED") {
    return {
      allowed: true,
      limit: null,
      used: 0,
      remaining: null,
      windowLabel: "2 years (unlimited)",
    };
  }

  if (effectiveTier === "YEARLY_999") {
    const windowStart = user.planStartAt ?? now;
    const windowEnd = user.planExpiresAt ?? addYears(windowStart, 1);
    const used = await prisma.analysisUsage.count({
      where: {
        userId,
        createdAt: { gte: windowStart, lt: windowEnd },
      },
    });
    const limit = 100;
    const remaining = Math.max(0, limit - used);
    return {
      allowed: used < limit,
      limit,
      used,
      remaining,
      windowLabel: "1 year",
      message:
        used >= limit
          ? "Yearly Starter plan limit reached (100 analyses). Upgrade to 2-year Unlimited."
          : undefined,
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const used = await prisma.analysisUsage.count({
    where: {
      userId,
      createdAt: { gte: monthStart, lt: nextMonthStart },
    },
  });
  const limit = 5;
  const remaining = Math.max(0, limit - used);
  return {
    allowed: used < limit,
    limit,
    used,
    remaining,
    windowLabel: "per month",
    message:
      used >= limit
        ? "Free plan limit reached (5 analyses this month). Upgrade to continue."
        : undefined,
  };
}

export async function consumeAnalysisQuota(userId: string): Promise<AnalysisAllowance> {
  const allowance = await getAnalysisAllowance(userId);
  if (!allowance.allowed) return allowance;
  if (allowance.limit === null) return allowance;

  await prisma.analysisUsage.create({ data: { userId } });

  const nextUsed = allowance.used + 1;
  return {
    ...allowance,
    used: nextUsed,
    remaining: Math.max(0, allowance.limit - nextUsed),
    allowed: nextUsed < allowance.limit,
  };
}

function addYears(date: Date, years: number): Date {
  const copy = new Date(date);
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
}
