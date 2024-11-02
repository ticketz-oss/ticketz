import axios from "axios";

export async function getFilenameFromUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.head(url);
    const contentDisposition = response.headers["content-disposition"];

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        return filenameMatch[1];
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching headers:", error);
    return null;
  }
}

export default getFilenameFromUrl;
