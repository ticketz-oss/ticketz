declare namespace Express {
  export interface Request {
    user: { id: string; profile: string; isSuper: boolean, companyId: number };
    companyId: number | undefined,
    tokenData: {
      id: string;
      username: string;
      profile: string;
      super: boolean;
      companyId: number;
      iat: number;
      exp: number;
    } | undefined
  }
}
