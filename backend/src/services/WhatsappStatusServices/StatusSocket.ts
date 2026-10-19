// Stub created by the shared scaffold; Task 6 implements it.
import WhatsappStatusPost from "../../models/WhatsappStatusPost";

export type SerializedStatusPost = Record<string, unknown>;

export const serializeStatusPost = (
  _post: WhatsappStatusPost
): SerializedStatusPost => {
  throw new Error("not implemented");
};

export const emitStatusPost = (
  _companyId: number,
  _action: "create" | "update" | "delete",
  _post: WhatsappStatusPost
): void => {
  throw new Error("not implemented");
};
