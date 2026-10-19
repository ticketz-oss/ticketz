import Compressor from "compressorjs";

const compressImage = file =>
  new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.7,
      success: compressed => resolve(compressed),
      error: reject
    });
  });

// Images are compressed before the request is started. The old implementation
// fired compression in the background and guessed that two seconds was enough,
// which could submit an incomplete FormData on slower devices.
export const prepareMediaUpload = async files =>
  Promise.all(
    files.filter(Boolean).map(async file => ({
      file: file.type?.startsWith("image/")
        ? await compressImage(file)
        : file,
      filename: file.name
    }))
  );

