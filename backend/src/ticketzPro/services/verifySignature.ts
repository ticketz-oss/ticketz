// verifySignature.ts
import * as crypto from "crypto";

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA/Y1UucXU7E69vmJ5RvsE
wpj3C/5QMuORhZHOIaXoXk2kMZqGw2jn2qxvavdMe8iXKPn03l8pXBFbiElLfTFR
tsOLPgh9QqVTHxV8tcEhD8TuwXYQQcKmblMkA7ZqKyOxo1ejFahLE226P031gOt7
2Uag6CTkOzOw9/j0CERXLy5B/eWqZXwQ4Xkhb3jcWtrMPLN4GH0yP3G+MiOKcrc7
rOWQK/vOELG8wJW8BFdtZadl+5dqxZxSUd2a+x06PKoOs+Q9DjPgflsmsSKUsnr0
m75VFMh7d89Vp4OpeNkng31YXwiAYhwlXRtx15TKoCF5NNee/irjkG37sqZVwwx5
2wIDAQAB
-----END PUBLIC KEY-----`;

// Function to verify a signature
export function verifySignature(response: any, challenge: string): boolean {
  try {
    const { signature } = response;
    delete response.signature;
    const data = JSON.stringify({ ...response, challenge });
    const verifier = crypto.createVerify("SHA256");
    verifier.update(data);
    verifier.end();

    const isValid = verifier.verify(PUBLIC_KEY, signature, "base64");
    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}
