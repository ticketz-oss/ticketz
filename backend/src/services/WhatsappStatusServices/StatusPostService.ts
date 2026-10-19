// Stub created by the shared scaffold; Task 6 implements it.
import WhatsappStatusPost, {
  StatusAudienceMode,
  StatusKind
} from "../../models/WhatsappStatusPost";
import { StatusCapabilities } from "./providers/types";

export type CreateStatusPostInput = {
  whatsappId: number;
  kind: StatusKind;
  body?: string | null;
  backgroundColor?: string | null;
  font?: number | null;
  audienceMode: StatusAudienceMode;
  contactListId?: number | null;
  idempotencyKey: string;
  media?: { mediaPath: string; mediaMime: string } | null;
};

export type UpdateStatusPostInput = Partial<
  Omit<CreateStatusPostInput, "idempotencyKey">
>;

const notImplemented = (): never => {
  throw new Error("not implemented");
};

export const listPosts = async (
  _companyId: number,
  _filters: { whatsappId?: number; active?: boolean }
): Promise<WhatsappStatusPost[]> => notImplemented();

export const getCapabilities = async (
  _companyId: number,
  _whatsappId: number
): Promise<StatusCapabilities> => notImplemented();

export const createPost = async (
  _companyId: number,
  _userId: number,
  _input: CreateStatusPostInput
): Promise<WhatsappStatusPost> => notImplemented();

export const updatePost = async (
  _companyId: number,
  _id: number,
  _patch: UpdateStatusPostInput
): Promise<WhatsappStatusPost> => notImplemented();

export const publishPost = async (
  _companyId: number,
  _id: number,
  _options: { scheduledAt?: Date | null }
): Promise<WhatsappStatusPost> => notImplemented();

export const cancelPost = async (
  _companyId: number,
  _id: number
): Promise<WhatsappStatusPost> => notImplemented();

export const showPost = async (
  _companyId: number,
  _id: number
): Promise<WhatsappStatusPost> => notImplemented();

export const cancelPendingForCompany = async (
  _companyId: number
): Promise<void> => notImplemented();
