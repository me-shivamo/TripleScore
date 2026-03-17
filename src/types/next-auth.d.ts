import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      onboardingCompleted: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    onboardingCompleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    onboardingCompleted: boolean;
  }
}
