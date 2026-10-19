export interface NormalizedWhatsAppPhone {
  phone: string;
  wphone: string;
}

export default function normalizePhone(
  phoneNumber: string
): NormalizedWhatsAppPhone {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits.startsWith("55")) {
    return {
      phone: digits,
      wphone: digits
    };
  }

  let phone = digits;

  if (phone.length === 12 && /[6-9]/.test(phone[4])) {
    phone = `${phone.slice(0, 4)}9${phone.slice(4)}`;
  }

  const isBrazilianCellNumber =
    phone.startsWith("55") && phone.length === 13 && phone[4] === "9";

  if (!isBrazilianCellNumber) {
    return {
      phone,
      wphone: phone
    };
  }

  const dddFirstDigit = phone[2];
  const digitAfterNinth = Number(phone[5]);
  const shouldKeepNinthDigitInWphone =
    ["1", "2"].includes(dddFirstDigit) || digitAfterNinth < 6;

  return {
    phone,
    wphone: shouldKeepNinthDigitInWphone
      ? phone
      : `${phone.slice(0, 4)}${phone.slice(5)}`
  };
}
