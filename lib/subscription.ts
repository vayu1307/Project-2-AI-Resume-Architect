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
  if (user.tier === "PRO") return true;
  return user._count.resumes < 1;
}

export function canUseTemplate(tier: SubscriptionTier, templateId: string): boolean {
  if (templateId === "premium" || templateId === "executive") {
    return tier === "PRO";
  }
  return true;
}

export function canGenerateCoverLetter(tier: SubscriptionTier): boolean {
  return tier === "PRO";
}
