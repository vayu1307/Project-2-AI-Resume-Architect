import { DefaultSession } from "next-auth";

type Tier = "FREE" | "PRO";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tier: Tier;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tier?: Tier;
  }
}
