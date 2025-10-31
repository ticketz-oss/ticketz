import axios from "axios";

export async function downloadFile(fileurl) {
  const url = new URL(fileurl);
  const filename = url.pathname.substring(url.pathname.lastIndexOf("/") + 1);

  url.searchParams.append("_cb", Date.now()); // cache busting
  
  const link = document.createElement('a');
  link.download = filename;
  link.style.display = 'none';
  let downloadUrl = null;

  try {
    const response = await axios.get(url.toString(), {
      responseType: "blob"
    });
    const blob = new Blob([response.data]);
    downloadUrl = window.URL.createObjectURL(blob);
    link.href = downloadUrl;
  } catch (err) {
    // Fallback to direct download if CORS or other issues occur
    url.searchParams.delete("_cb");
    link.href = url;
    link.target = '_blank';
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (downloadUrl) {
    window.URL.revokeObjectURL(downloadUrl);
  }
}
