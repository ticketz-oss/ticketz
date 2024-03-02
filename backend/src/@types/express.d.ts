declare namespace Express {
  export interface Request {
    user: { id: string; profile: string; companyId: number };
    companyId: number | undefined,
    tokenData: {
      id: string;
      username: string;
      profile: string;
      companyId: number;
      iat: number;
      exp: number;
    } | undefined
  }
}
