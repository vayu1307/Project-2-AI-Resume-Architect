import { DefaultSession } from "next-auth";

type Tier = "FREE" | "YEARLY_999" | "TWO_YEAR_UNLIMITED";

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
