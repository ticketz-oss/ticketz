import { getIO } from "../../libs/socket";
import WhatsappStatusPost from "../../models/WhatsappStatusPost";
import { logger } from "../../utils/logger";

export type SerializedStatusPost = Record<string, unknown>;

// What the browser may see of a post. The stored media path, the remote
// message id, the idempotency key and any recipient JID stay on the server.
export const serializeStatusPost = (
  post: WhatsappStatusPost
): SerializedStatusPost => {
  const serialized: SerializedStatusPost = {
    id: post.id,
    whatsappId: post.whatsappId,
    kind: post.kind,
    body: post.body ?? null,
    mediaMime: post.mediaMime ?? null,
    hasMedia: !!post.mediaPath,
    backgroundColor: post.backgroundColor ?? null,
    font: post.font ?? null,
    audienceMode: post.audienceMode,
    contactListId: post.contactListId ?? null,
    audienceCount: post.audienceCount ?? null,
    scheduledAt: post.scheduledAt ?? null,
    state: post.state,
    publishedAt: post.publishedAt ?? null,
    expiresAt: post.expiresAt ?? null,
    failureCode: post.failureCode ?? null,
    createdAt: post.createdAt ?? null,
    updatedAt: post.updatedAt ?? null
  };
  if (post.createdBy) {
    serialized.createdBy = { id: post.createdBy.id, name: post.createdBy.name };
  }
  return serialized;
};

// Never throws: a socket problem must not turn a stored state change (for
// example a post already handed to the session) into an error path.
export const emitStatusPost = (
  companyId: number,
  action: "create" | "update" | "delete",
  post: WhatsappStatusPost
): void => {
  try {
    getIO()
      .to(`company-${companyId}-mainchannel`)
      .emit(`company-${companyId}-whatsapp-status-post`, {
        action,
        post: serializeStatusPost(post)
      });
  } catch (error) {
    logger.warn(
      { error: error?.message, companyId, postId: post?.id },
      "Could not emit whatsapp status post event"
    );
  }
};
