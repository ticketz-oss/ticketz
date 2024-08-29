import React from "react";
import { generateMercadoPagoToken } from "../../helpers/mercadopago";
import { CreditCardForm } from "../CreditCardForm";

const MP_PUBLIC_KEY = "APP_USR-4e658725-1e50-49ef-976f-f866ca2a041c";
// const MP_PUBLIC_KEY = "TEST-7b3070b9-c99c-459b-8c35-79a50579a3af";

export default function MercadoPagoCreditCard({ callback }) {
  const handleFormSubmit = async (formData) => {
    const token = await generateMercadoPagoToken(formData, MP_PUBLIC_KEY);
    callback(token);
  };

  return <CreditCardForm onSubmit={handleFormSubmit} />;
}