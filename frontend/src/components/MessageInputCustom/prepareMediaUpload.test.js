import Compressor from "compressorjs";
import { prepareMediaUpload } from "./prepareMediaUpload";

jest.mock("compressorjs", () => jest.fn());

describe("prepareMediaUpload", () => {
  beforeEach(() => jest.clearAllMocks());

  it("waits for image compression and preserves videos unchanged", async () => {
    const image = { name: "foto.jpg", type: "image/jpeg" };
    const compressed = { type: "image/jpeg", size: 10 };
    const video = { name: "video.mp4", type: "video/mp4", size: 20 };

    Compressor.mockImplementation((_file, options) => options.success(compressed));

    await expect(prepareMediaUpload([image, video])).resolves.toEqual([
      { file: compressed, filename: "foto.jpg" },
      { file: video, filename: "video.mp4" }
    ]);
    expect(Compressor).toHaveBeenCalledWith(
      image,
      expect.objectContaining({ quality: 0.7 })
    );
  });

  it("rejects instead of posting a partial payload when compression fails", async () => {
    const image = { name: "foto.jpg", type: "image/jpeg" };
    const error = new Error("compression failed");

    Compressor.mockImplementation((_file, options) => options.error(error));

    await expect(prepareMediaUpload([image])).rejects.toThrow(error);
  });
});
