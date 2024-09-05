import React from "react";
import { generateMercadoPagoToken } from "../../helpers/mercadopago";
import { CreditCardForm } from "../CreditCardForm";

export default function MercadoPagoCreditCard({ callback, clientKey }) {
  const handleFormSubmit = async (formData) => {
    const token = await generateMercadoPagoToken(formData, clientKey);
    callback(token);
  };

  return <CreditCardForm onSubmit={handleFormSubmit} forceBR={true} />;
}