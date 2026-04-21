import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = headers().get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planCode = session.metadata?.planCode;
        if (userId && planCode) {
          const now = new Date();
          const planDurationYears =
            planCode === "TWO_YEAR_UNLIMITED" ? 2 : planCode === "YEARLY_999" ? 1 : 0;
          if (planDurationYears > 0) {
            const expiresAt = new Date(now);
            expiresAt.setFullYear(expiresAt.getFullYear() + planDurationYears);
            await prisma.user.update({
              where: { id: userId },
              data: {
                tier: planCode === "TWO_YEAR_UNLIMITED" ? "TWO_YEAR_UNLIMITED" : "YEARLY_999",
                stripePriceId: planCode,
                stripeCurrentPeriodEnd: expiresAt,
                planStartAt: now,
                planExpiresAt: expiresAt,
              },
            });
          }
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
