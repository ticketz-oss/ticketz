import Partner from "../models/Partner";

export interface SerializedPartner {
  id: number;
  name: string;
  email: string;
  phone: string;
  discountPct: number;
  pixKey: string;
  pixKeyType: string;
  payoutMode: string;
  payoutDay: number;
  status: boolean;
}

/**
 * Forma publica do parceiro. Nunca expoe passwordHash, tokenVersion ou o
 * token de convite.
 */
export const SerializePartner = (partner: Partner): SerializedPartner => ({
  id: partner.id,
  name: partner.name,
  email: partner.email,
  phone: partner.phone,
  discountPct: partner.discountPct,
  pixKey: partner.pixKey,
  pixKeyType: partner.pixKeyType,
  payoutMode: partner.payoutMode,
  payoutDay: partner.payoutDay,
  status: partner.status
});

export default SerializePartner;
