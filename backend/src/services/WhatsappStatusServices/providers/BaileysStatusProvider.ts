import { promises as fs } from "fs";
import { jidNormalizedUser } from "libzapitu-rf";
import { getWbot } from "../../../libs/wbot";
import Whatsapp from "../../../models/Whatsapp";
import WhatsappStatusPost, {
  StatusKind
} from "../../../models/WhatsappStatusPost";
import { resolveStatusMediaPath } from "../StatusMediaService";
import OfficialStatusProvider from "./OfficialStatusProvider";
import {
  StatusCapabilities,
  StatusProvider,
  StatusPublishError
} from "./types";

// libzapitu-rf versions allowed to publish Status. 1.0.0-alpha.16 was enabled
// by the owner for testing in the dev environment before the phone proof.
// WHATSAPP_STATUS_VERIFIED_LIBS (comma separated) extends it per deployment.
export const VERIFIED_LIBZAPITU_VERSIONS: string[] = ["1.0.0-alpha.16"];

// Kinds that did not show up on the phone in the experiment.
export const UNVERIFIED_KINDS: StatusKind[] = [];

const ALL_KINDS: StatusKind[] = ["text", "image", "video"];

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
      manualExport: false,
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

  const sent = await wbot.sendMessage(
    "status@broadcast",
    content as never,
    options as never
  );
  const remoteMessageId = sent?.key?.id;
  if (!remoteMessageId) {
    throw new StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true);
  }
  return { remoteMessageId };
};

const BaileysStatusProvider: StatusProvider = { capabilities, publish };

export default BaileysStatusProvider;
