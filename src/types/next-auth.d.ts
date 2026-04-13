import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      partnerId: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    partnerId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    partnerId: string | null;
  }
}
