/*
 * Controlled experiment for WhatsApp Status publishing (plan Task 1).
 *
 * Links a SEPARATE device with its own credentials in a temporary folder, so it
 * never touches the sessions stored by the backend. Use only a test account
 * and test recipients.
 *
 * Inside the local backend container (after a build):
 *   docker compose -f docker-compose-local.yaml -f docker-compose.localruntime.yaml \
 *     exec -e STATUS_SPIKE_CONFIRM=yes \
 *     backend node dist/scripts/whatsappStatusSpike.js \
 *     --auth /tmp/ew-status-spike --to 5568999990000[,5568...] \
 *     --kind text|image|video [--file path] [--text "..."] [--no-self]
 */
import fs from "fs";
import path from "path";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import makeWASocket, {
  DisconnectReason,
  jidNormalizedUser,
  useMultiFileAuthState,
  WASocket
} from "libzapitu-rf";
import waVersion from "../waversion.json";

type Args = {
  auth: string;
  to: string[];
  kind: "text" | "image" | "video";
  file?: string;
  text: string;
  self: boolean;
};

const parseArgs = (argv: string[]): Args => {
  const value = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const kind = (value("--kind") || "text") as Args["kind"];
  if (!["text", "image", "video"].includes(kind)) {
    throw new Error("--kind must be text, image or video");
  }
  const to = (value("--to") || "")
    .split(",")
    .map(n => n.replace(/\D/g, ""))
    .filter(Boolean);
  if (!to.length) throw new Error("--to needs at least one test number");
  const file = value("--file");
  if (kind !== "text" && (!file || !fs.existsSync(file))) {
    throw new Error("--file must point to an existing image/video");
  }
  return {
    auth: value("--auth") || "/tmp/ew-status-spike",
    to,
    kind,
    file: file && path.resolve(file),
    text:
      value("--text") ||
      `Teste de Status Espaço Whats ${new Date().toISOString()}`,
    self: !argv.includes("--no-self")
  };
};

const libVersion = (): string =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("libzapitu-rf/package.json").version;

const connect = async (authDir: string): Promise<WASocket> => {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  return new Promise((resolve, reject) => {
    const sock = makeWASocket({
      auth: state,
      version: waVersion as [number, number, number],
      printQRInTerminal: false,
      emitOwnEvents: true
    });
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", update => {
      if (update.qr) qrcode.generate(update.qr, { small: true });
      if (update.connection === "open") resolve(sock);
      if (update.connection === "close") {
        const code = (update.lastDisconnect?.error as Boom)?.output?.statusCode;
        // Pairing ends with a restart request; reconnect with the saved creds.
        if (code === DisconnectReason.restartRequired) {
          connect(authDir).then(resolve, reject);
        } else {
          reject(update.lastDisconnect?.error || new Error(`closed ${code}`));
        }
      }
    });
  });
};

const main = async (): Promise<void> => {
  // The local Docker image runs with NODE_ENV=production, so the guard is an
  // explicit opt-in instead of an environment check.
  if (process.env.STATUS_SPIKE_CONFIRM !== "yes") {
    throw new Error("Set STATUS_SPIKE_CONFIRM=yes to run the status spike");
  }
  const args = parseArgs(process.argv.slice(2));
  console.log(
    `libzapitu-rf ${libVersion()}, WA version ${waVersion.join(".")}`
  );
  const sock = await connect(args.auth);
  const ownJid = jidNormalizedUser(sock.user?.id);
  const recipients = args.to.map(n => `${n}@s.whatsapp.net`);
  const statusJidList = args.self ? [ownJid, ...recipients] : recipients;

  const log = (event: string) => (payload: unknown) => {
    const text = JSON.stringify(payload);
    if (text.includes("status@broadcast")) {
      console.log(`[${new Date().toISOString()}] ${event} ${text}`);
    }
  };
  sock.ev.on("messages.upsert", log("messages.upsert"));
  sock.ev.on("messages.update", log("messages.update"));
  sock.ev.on("message-receipt.update", log("message-receipt.update"));

  const content =
    args.kind === "text"
      ? { text: args.text }
      : args.kind === "image"
        ? { image: { url: args.file }, caption: args.text }
        : { video: { url: args.file }, caption: args.text };
  const options = {
    broadcast: true,
    statusJidList,
    ...(args.kind === "text" ? { backgroundColor: "#024BF4", font: 1 } : {})
  };
  console.log("sendMessage options:", JSON.stringify(options));
  const sent = await sock.sendMessage("status@broadcast", content, options);
  console.log(`sent key.id=${sent?.key?.id} remoteJid=${sent?.key?.remoteJid}`);

  console.log("Watching status events for 60s; check both phones now.");
  await new Promise(resolve => setTimeout(resolve, 60000));
  sock.end(undefined);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
