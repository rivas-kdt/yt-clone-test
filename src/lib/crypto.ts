import CryptoJS from "crypto-js";

const SECRET_KEY = "secretKey";

function base64UrlEncode(base64: string) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(base64Url: string) {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return base64;
}

export function encrypt(text: string) {
  try {
    const ciphertext = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    return base64UrlEncode(ciphertext);
  } catch {
    return text;
  }
}

export function decrypt(encrypted: string | null) {
  if (!encrypted) return "";
  try {
    const safe = encrypted.replace(/ /g, "+");
    const base64 = base64UrlDecode(safe);
    const bytes = CryptoJS.AES.decrypt(base64, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encrypted;
  } catch {
    return encrypted;
  }
}
