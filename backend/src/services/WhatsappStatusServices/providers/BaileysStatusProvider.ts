import { promises as fs } from "fs";
import { jidNormalizedUser } from "libzapitu-rf";
import { getWbot } from "../../../libs/wbot";
import Whatsapp from "../../../models/Whatsapp";
import WhatsappStatusPost, {
  StatusKind
} from "../../../models/WhatsappStatusPost";
import { resolveStatusMediaPath } from "../StatusMediaService";
import { logger } from "../../../utils/logger";
import OfficialStatusProvider from "./OfficialStatusProvider";
import {
  StatusCapabilities,
  StatusProvider,
  StatusPublishError
} from "./types";

// Only versions proven to appear on a recipient's phone belong here.
// 1.0.0-alpha.16 returned a message id but the story did not appear in the
// owner's phone test. Dev can opt in with WHATSAPP_STATUS_VERIFIED_LIBS.
export const VERIFIED_LIBZAPITU_VERSIONS: string[] = [];

// Kinds that did not show up on the phone in the experiment.
export const UNVERIFIED_KINDS: StatusKind[] = [];

const ALL_KINDS: StatusKind[] = ["text", "image", "video"];
const STATUS_ACK_EVENT = "CB:ack,class:message";
const STATUS_ACK_TIMEOUT_MS = 15000;

// Read once: the installed fork only changes with a new deployment.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const INSTALLED_VERSION: string = require("libzapitu-rf/package.json").version;

const verifiedVersions = (): string[] => [
  ...VERIFIED_LIBZAPITU_VERSIONS,
  ...(process.env.WHATSAPP_STATUS_VERIFIED_LIBS || "")
    .split(",")
    .map(version => version.trim())
    .filter(Boolean)
];

const capabilities = (connection: Whatsapp): StatusCapabilities => {
  if (connection.apiMode === "official") {
    return OfficialStatusProvider.capabilities(connection);
  }
  if (!verifiedVersions().includes(INSTALLED_VERSION)) {
    return {
      publishStatus: false,
      kinds: [],
      reason: "LIB_NOT_VERIFIED",
      manualExport: true,
      ownPostsSync: false
    };
  }
  const kinds = ALL_KINDS.filter(kind => !UNVERIFIED_KINDS.includes(kind));
  if (connection.status !== "CONNECTED") {
    return {
      publishStatus: false,
      kinds,
      reason: "DISCONNECTED",
      manualExport: false,
      ownPostsSync: false
    };
  }
  return {
    publishStatus: true,
    kinds,
    reason: null,
    manualExport: false,
    ownPostsSync: false
  };
};

// Everything that can fail without sending is checked before sendMessage, so
// a transient error here always means nothing reached the session.
const buildContent = async (
  post: WhatsappStatusPost
): Promise<Record<string, unknown>> => {
  if (post.kind === "text") return { text: post.body };

  let absPath: string;
  try {
    if (!post.mediaPath) throw new Error("missing media");
    absPath = resolveStatusMediaPath(post.companyId, post.mediaPath);
    await fs.access(absPath);
  } catch {
    throw new StatusPublishError("ERR_STATUS_MEDIA_INVALID", true);
  }
  const media =
    post.kind === "image"
      ? { image: { url: absPath } }
      : { video: { url: absPath } };
  return post.body ? { ...media, caption: post.body } : media;
};

const publish = async (
  post: WhatsappStatusPost,
  connection: Whatsapp,
  audience: string[]
): Promise<{ remoteMessageId: string }> => {
  if (connection.apiMode === "official") {
    return OfficialStatusProvider.publish(post, connection, audience);
  }
  const content = await buildContent(post);

  let wbot: ReturnType<typeof getWbot>;
  try {
    wbot = getWbot(connection.id);
  } catch (error) {
    if (error?.message === "ERR_WAPP_NOT_INITIALIZED") {
      throw new StatusPublishError("ERR_STATUS_CONNECTION_UNAVAILABLE", false);
    }
    throw error;
  }
  if (!wbot?.user?.id) {
    throw new StatusPublishError("ERR_STATUS_CONNECTION_UNAVAILABLE", false);
  }

  const ownJid = jidNormalizedUser(wbot.user.id);
  const statusJidList = [
    ownJid,
    ...Array.from(new Set(audience)).filter(jid => jid !== ownJid)
  ];
  const options: Record<string, unknown> = { broadcast: true, statusJidList };
  if (post.kind === "text") {
    if (post.backgroundColor) options.backgroundColor = post.backgroundColor;
    if (post.font !== null && post.font !== undefined) options.font = post.font;
  }

  // sendMessage resolves after writing the stanza, before the server ACK.
  // Register first because the ACK can arrive before sendMessage resolves.
  const observed = new Map<string, string | null>();
  let expectedId: string | null = null;
  let acceptAck: ((code: string | null) => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const onAck = (node: {
    attrs?: { id?: string; from?: string; error?: string };
  }): void => {
    const attrs = node?.attrs;
    if (attrs?.from !== "status@broadcast" || !attrs.id) return;
    const code = attrs.error || null;
    observed.set(attrs.id, code);
    if (attrs.id === expectedId && acceptAck) acceptAck(code);
  };
  const socket = wbot.ws;
  socket.on(STATUS_ACK_EVENT, onAck);
  try {
    const sent = await wbot.sendMessage(
      "status@broadcast",
      content as never,
      options as never
    );
    const remoteMessageId = sent?.key?.id;
    if (!remoteMessageId) {
      throw new StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true);
    }

    const ackCode = await new Promise<string | null | undefined>(resolve => {
      expectedId = remoteMessageId;
      acceptAck = resolve;
      if (observed.has(remoteMessageId)) {
        resolve(observed.get(remoteMessageId));
      } else {
        timer = setTimeout(() => resolve(undefined), STATUS_ACK_TIMEOUT_MS);
      }
    });
    if (ackCode === undefined) {
      throw new StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true);
    }
    if (ackCode) {
      logger.warn(
        { postId: post.id, ackError: ackCode },
        "Whatsapp status rejected by server"
      );
      throw new StatusPublishError("ERR_STATUS_SERVER_REJECTED", true);
    }
    return { remoteMessageId };
  } finally {
    if (timer) clearTimeout(timer);
    socket.off(STATUS_ACK_EVENT, onAck);
  }
};

const BaileysStatusProvider: StatusProvider = { capabilities, publish };

export default BaileysStatusProvider;
