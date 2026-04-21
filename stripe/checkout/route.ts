import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const PLAN_PRICE_ENV: Record<string, { priceId?: string; envNames: string[] }> = {
  YEARLY_999: {
    // Keep STRIPE_PRICE_PRO as backwards-compatible fallback for existing setups.
    priceId: process.env.STRIPE_PRICE_YEARLY_999 ?? process.env.STRIPE_PRICE_PRO,
    envNames: ["STRIPE_PRICE_YEARLY_999", "STRIPE_PRICE_PRO (fallback)"],
  },
  TWO_YEAR_UNLIMITED: {
    priceId: process.env.STRIPE_PRICE_TWO_YEAR_UNLIMITED,
    envNames: ["STRIPE_PRICE_TWO_YEAR_UNLIMITED"],
  },
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const planCode = typeof body.planCode === "string" ? body.planCode : "";
  if (!(planCode in PLAN_PRICE_ENV)) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }

  const selectedPlan = PLAN_PRICE_ENV[planCode];
  const priceId = selectedPlan.priceId;
  if (!priceId) {
    return NextResponse.json(
      {
        error: `Stripe price is not configured for selected plan. Expected: ${selectedPlan.envNames.join(" or ")}`,
      },
      { status: 500 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const stripe = getStripe();
  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancel`,
    metadata: { userId: user.id, planCode },
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.url });
}
