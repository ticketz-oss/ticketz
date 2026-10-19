declare namespace Express {
  export interface Request {
    user: { id: string; profile: string; isSuper: boolean; companyId: number };
    companyId: number | undefined;
    partner?: { id: number; name: string; email: string };
    platform?: { ok: true };
    mcpAuth?: {
      grantId: string;
      userId: number;
      companyId: number;
      clientId: string;
      scopes: string[];
      expiresAt: number;
    };
  }
}
