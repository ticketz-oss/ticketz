import { createCardToken } from '@mercadopago/sdk-react/coreMethods';
import { initMercadoPago } from "@mercadopago/sdk-react";

export async function generateMercadoPagoToken(
  {
    cardNumber,
    expirationDate,
    securityCode,
    cardholderName,
    identificationType,
    identificationNumber,
  },
  publicKey
) {
  initMercadoPago(publicKey);

  const [cardExpirationMonth, cardExpirationYear] = expirationDate.split("/");

  const cardToken = await createCardToken({
    cardNumber: cardNumber.replace(/\D/g, ""),
    cardholderName,
    cardExpirationMonth,
    cardExpirationYear,
    securityCode,
    identificationType,
    identificationNumber: identificationNumber.replace(/\D/g, "")
  });

  return cardToken;
}
