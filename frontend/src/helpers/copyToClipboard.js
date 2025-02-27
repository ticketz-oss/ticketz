const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.debug('Text copied to clipboard');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

export { copyToClipboard };
