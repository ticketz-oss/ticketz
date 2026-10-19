import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Transaction } from "sequelize";
import uploadConfig from "../../config/upload";
import Setting from "../../models/Setting";
import AppError from "../../errors/AppError";

const keys = {
  logo: ["appLogoFavicon", "linkPreviewImage"],
  banner: ["appLogoLight", "appLogoDark"],
  sideImage: ["loginSidePanelImage"]
};
const prefixes = {
  appLogoLight: "logo_light",
  appLogoDark: "logo_dark",
  appLogoFavicon: "favicon",
  linkPreviewImage: "link_preview",
  loginSidePanelImage: "login_side"
};
export type SignupFiles = Record<string, Express.Multer.File[]>;

export const prepareSignupImages = async (files: SignupFiles = {}) => {
  const images = await Promise.all(
    Object.keys(keys).map(async field => {
      const file = files[field]?.[0];
      if (!file) return null;
      try {
        const input = sharp(file.buffer, {
          limitInputPixels: 24000000,
          animated: false
        });
        const metadata = await input.metadata();
        if (!["png", "jpeg", "webp"].includes(metadata.format))
          throw new Error("format");
        const buffer = await input
          .rotate()
          .resize({
            width: 1920,
            height: 1920,
            fit: "inside",
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toBuffer();
        return { field, buffer };
      } catch {
        throw new AppError("ERR_SIGNUP_INVALID_IMAGE", 400);
      }
    })
  );
  return images.filter(
    (image): image is { field: string; buffer: Buffer } => !!image
  );
};

export const saveSignupBranding = async (
  companyId: number,
  name: string,
  color: string,
  images: Awaited<ReturnType<typeof prepareSignupImages>>,
  transaction: Transaction,
  writtenFiles: string[]
) => {
  const values: Record<string, string> = {
    appName: name,
    primaryColorLight: color,
    primaryColorDark: color,
    loginTemplate: "aurora"
  };
  const directory = path.join(
    uploadConfig.directory,
    "branding",
    String(companyId)
  );
  const logo = images.find(image => image.field === "logo");
  const effectiveImages =
    !images.some(image => image.field === "banner") && logo
      ? [...images, { ...logo, field: "banner" }]
      : images;
  if (images.length) await fs.mkdir(directory, { recursive: true });
  const writes = await Promise.allSettled(
    effectiveImages.flatMap(image =>
      keys[image.field].map(async key => {
        const filename = `${prefixes[key]}-${randomUUID()}.webp`;
        const filepath = path.join(directory, filename);
        writtenFiles.push(filepath);
        await fs.writeFile(filepath, Uint8Array.from(image.buffer));
        values[key] = `branding/${companyId}/${filename}`;
      })
    )
  );
  const failed = writes.find(result => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
  await Setting.bulkCreate(
    Object.entries(values).map(([key, value]) => ({ companyId, key, value })),
    { transaction }
  );
};
