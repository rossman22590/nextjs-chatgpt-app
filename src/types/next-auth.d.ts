import "next-auth";

declare module "next-auth" {
  /**
   * Extending the built-in User type with our own properties
   */
  interface User {
    id: string;
  }

  /**
   * Extending the built-in Session type with our own properties
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }

  /**
   * Extending the built-in JWT type with our own properties
   */
  interface JWT {
    id: string;
  }
}
