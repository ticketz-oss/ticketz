import axios from 'axios';
const { hkdf } = require('@panva/hkdf')

const DEF_BASE_URL = 'https://mmg.whatsapp.net'

function hkdfInfoKey(type) {
  return `WhatsApp ${type} Keys`;
}

async function getMediaKeys(mediaKey, mediaType) {
  // convert base64 to Uint8Array
  const buffer = new Uint8Array(atob(mediaKey).split('').map(c => c.charCodeAt(0)));
  
  const derivedKey = await hkdf('sha256', buffer, new Uint8Array(16), hkdfInfoKey(mediaType), 112);
  
  return {
    iv: derivedKey.slice(0, 16),
    cipherKey: derivedKey.slice(16, 48),
    macKey: derivedKey.slice(48, 80),
    buffer
  };
}

// Function to decrypt the media content

async function decryptMedia(encryptedMedia, { iv, cipherKey }) {
  try {
    // Ensure iv and cipherKey are Uint8Array
    if (!(iv instanceof Uint8Array) || !(cipherKey instanceof Uint8Array)) {
      throw new Error('IV and cipherKey must be Uint8Array');
    }

    // Import the AES key
    const aes = await crypto.subtle.importKey(
      'raw',
      cipherKey,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    // Decrypt the media content
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv
      },
      aes,
      encryptedMedia
    );

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}

// Function to fetch the media and decrypt it
export async function downloadAndDecryptMedia({ directPath, mediaKey, mediaType, baseUrl }, progressCallback = null) {
  // Derive the AES key
  const mediaKeys = await getMediaKeys(mediaKey, mediaType);

  // Fetch the encrypted media content
  const response = await axios.get(
    `${baseUrl || DEF_BASE_URL}${directPath}`,
    {
      responseType: 'arraybuffer',
      onDownloadProgress: (progressEvent) => {
        if (progressCallback) {
          const progress = Math.round((progressEvent.loaded * 95) / progressEvent.total);
          progressCallback(progress);
        }
      }
    }
  );
  const encryptedMedia = new Uint8Array(response.data);
  const mediaWithoutMac = encryptedMedia.slice(0, encryptedMedia.length - 10);
  
  // Decrypt the media content
  const decryptedMedia = await decryptMedia(mediaWithoutMac, mediaKeys);

  if (progressCallback) {
    progressCallback(100);
  }

  // Handle the decrypted media (e.g., display it, save it, etc.)
  return new Uint8Array(decryptedMedia);
}
