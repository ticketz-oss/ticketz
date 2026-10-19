import { parsePhoneNumberWithError } from "libphonenumber-js";

import { i18n } from "../translate/i18n";

function countryCodeToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return "";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function getCurrentLanguage() {
  return i18n.language || "en";
}

function shouldUseBrazilianDisplayFormat(language) {
  return language === "pt" || language === "pt_BR";
}

function normalizeWhatsappDigits(rawValue) {
  const digits = (rawValue || "").replace(/\D/g, "");

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
  const shouldKeepNinthDigitInWphone = ["1", "2"].includes(dddFirstDigit);

  return {
    phone,
    wphone: shouldKeepNinthDigitInWphone
      ? phone
      : `${phone.slice(0, 4)}${phone.slice(5)}`
  };
}

function areEquivalentDigitStrings(leftValue, rightValue) {
  if (!leftValue || !rightValue) {
    return false;
  }

  const leftDigits = leftValue.replace(/\D/g, "");
  const rightDigits = rightValue.replace(/\D/g, "");
  const leftNormalized = normalizeWhatsappDigits(leftDigits);
  const rightNormalized = normalizeWhatsappDigits(rightDigits);

  return (
    leftDigits === rightDigits ||
    leftNormalized.phone === rightNormalized.phone ||
    leftNormalized.phone === rightNormalized.wphone ||
    leftNormalized.wphone === rightNormalized.phone ||
    leftNormalized.wphone === rightNormalized.wphone ||
    leftDigits.endsWith(rightDigits) ||
    rightDigits.endsWith(leftDigits)
  );
}

export function formatWhatsappDigits(rawValue) {
  if (!rawValue || !/^\d+$/.test(rawValue)) {
    return rawValue;
  }

  try {
    const normalizedDigits = normalizeWhatsappDigits(rawValue).phone;
    const phoneNumber = parsePhoneNumberWithError("+" + normalizedDigits);
    const countryCode = phoneNumber.country;
    const isPortuguese = shouldUseBrazilianDisplayFormat(getCurrentLanguage());
    const shouldOmitFlag = countryCode === "BR" && isPortuguese;
    const formattedNumber = shouldOmitFlag
      ? phoneNumber.formatNational()
      : phoneNumber.formatInternational();
    const flag = countryCodeToFlag(countryCode);

    if (shouldOmitFlag) {
      return formattedNumber;
    }

    return flag ? `${flag} ${formattedNumber}` : formattedNumber;
  } catch {
    return rawValue;
  }
}

export function formatWhatsappContactName(contact, ticket) {
  if (
    ticket?.channel === "whatsapp" &&
    !contact?.isGroup &&
    /^\d+$/.test(contact?.name || "") &&
    areEquivalentDigitStrings(contact?.name, contact?.number)
  ) {
    return formatWhatsappDigits(contact.name);
  }

  return contact?.name;
}

export function formatWhatsappContactNumber(contact) {
  if (!contact?.isGroup && /^\d+$/.test(contact?.number || "")) {
    return formatWhatsappDigits(contact.number);
  }

  return contact?.number;
}
