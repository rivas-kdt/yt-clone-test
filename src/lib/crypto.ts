import CryptoJs from "crypto-js";

const SECRET_KEY = "secretKey";

export function encrypt(text: string) {
  try {
    return CryptoJs.AES.encrypt(text, SECRET_KEY).toString();
  } catch {
    return text;
  }
}

export function decrypt(encrypted: string | null) {
  if (!encrypted) return "";
  try {
    const bytes = CryptoJs.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJs.enc.Utf8);
    return decrypted || encrypted;
  } catch {
    return encrypted;
  }
}
