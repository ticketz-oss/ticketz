import AppError from "../../errors/AppError";
import { requireVoiceResourceId } from "../VoiceController";

describe("requireVoiceResourceId", () => {
  it.each(["1", "42", "9007199254740991"])(
    "accepts a positive safe integer: %s",
    value => {
      expect(requireVoiceResourceId(value)).toBe(Number(value));
    }
  );

  it.each(["undefined", "NaN", "0", "-1", "1.5", "9007199254740992"])(
    "rejects an invalid identifier before it reaches Sequelize: %s",
    value => {
      try {
        requireVoiceResourceId(value);
        throw new Error("expected validation error");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(422);
      }
    }
  );
});
