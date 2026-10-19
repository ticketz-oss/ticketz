import AppError from "../errors/AppError";

const limits: Record<string, number> = {
  loginHeadline: 120,
  loginDescription: 240
};

export default function validateLoginBranding(
  key: string,
  value: unknown
): void {
  if (Object.prototype.hasOwnProperty.call(limits, key)) {
    if (typeof value !== "string" || value.length > limits[key]) {
      throw new AppError("ERR_INVALID_LOGIN_BRANDING", 400);
    }
  }
  if (
    key === "loginTemplate" &&
    !["", "aurora", "minimal"].includes(value as string)
  ) {
    throw new AppError("ERR_INVALID_LOGIN_BRANDING", 400);
  }
}
