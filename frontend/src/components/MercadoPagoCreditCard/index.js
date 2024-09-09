import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { generateMercadoPagoToken } from "../../helpers/mercadopago";
import { CreditCardForm } from "../CreditCardForm";

export const MercadoPagoCreditCard = forwardRef(({ callback, clientKey, renderSubmit = true }, ref) => {
  const creditCardFormRef = useRef(null);

  useImperativeHandle(ref, () => ({
    async submitPayment() {
      return await creditCardFormRef.current.submitPayment();
    }
  }));

  const handleFormSubmit = async (formData) => {
    const token = await generateMercadoPagoToken(formData, clientKey);
    callback(token);
  };

  return <CreditCardForm
    ref={creditCardFormRef}
    onSubmit={handleFormSubmit}
    forceBR={true}
    renderSubmit={renderSubmit}
  />;
});

export default MercadoPagoCreditCard;
