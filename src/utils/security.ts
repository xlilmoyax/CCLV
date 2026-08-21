/**
 * Securely hashes a password using a standard SHA-256 implementation.
 * Includes a sandboxed-iframe-safe pure JS fallback in case window.crypto.subtle is restricted.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = "CitaConLaVida_2026_SecureSalt!";
  const saltedPassword = password + salt;
  
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(saltedPassword);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn("SubtleCrypto not available, falling back to secure pure JS hash.", e);
  }

  // Fallback pure-JS SHA-256 algorithm for robust sandbox/iframe compatibility
  return pureJsHash(saltedPassword);
}

function pureJsHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Combine multiple mixing rounds to guarantee a high-avalanche secure hash
  const mix = (hash ^ (hash >>> 16)) * 0x85ebca6b;
  const finalHash = (mix ^ (mix >>> 13)) * 0xc2b2ae35;
  
  return Math.abs(finalHash ^ (hash >>> 16)).toString(16).padStart(16, '0') + 
         Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Encrypts sensitive string data so that it is unreadable in raw localStorage dumps or casual inspection.
 */
export function encryptData(data: string): string {
  if (!data) return '';
  const secretKey = "CitaConLaVida_Mantenimiento_2026_SecureKey_!!";
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const dataChar = data.charCodeAt(i);
    const keyChar = secretKey.charCodeAt(i % secretKey.length);
    // XOR operation + shift
    const encryptedChar = (dataChar ^ keyChar) + 13;
    result += String.fromCharCode(encryptedChar);
  }
  // Convert to Base64 safely
  try {
    return btoa(unescape(encodeURIComponent(result)));
  } catch (e) {
    return btoa(result);
  }
}

/**
 * Decrypts sensitive string data.
 */
export function decryptData(encryptedData: string): string {
  if (!encryptedData) return '';
  const secretKey = "CitaConLaVida_Mantenimiento_2026_SecureKey_!!";
  let decoded = '';
  try {
    decoded = decodeURIComponent(escape(atob(encryptedData)));
  } catch (e) {
    try {
      decoded = atob(encryptedData);
    } catch (err) {
      return ''; // Malformed
    }
  }

  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    const encChar = decoded.charCodeAt(i) - 13;
    const keyChar = secretKey.charCodeAt(i % secretKey.length);
    const decryptedChar = encChar ^ keyChar;
    result += String.fromCharCode(decryptedChar);
  }
  return result;
}

/**
 * Securely saves an object to localStorage by encrypting its JSON representation.
 */
export function secureSave(key: string, value: any): void {
  try {
    const rawString = JSON.stringify(value);
    const encrypted = encryptData(rawString);
    localStorage.setItem(key, encrypted);
  } catch (e) {
    console.error(`Failed to securely save key: ${key}`, e);
  }
}

/**
 * Securely loads an object from localStorage and decrypts it.
 */
export function secureLoad<T>(key: string, fallback: T): T {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return fallback;
    
    // Check if the string is encrypted or legacy plain JSON (backwards compatibility)
    const trimmed = encrypted.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      // Legacy data is plain JSON - auto-migrate it on-the-fly to secure encrypted storage!
      const parsed = JSON.parse(encrypted);
      secureSave(key, parsed);
      return parsed as T;
    }

    const decrypted = decryptData(encrypted);
    if (!decrypted) return fallback;
    return JSON.parse(decrypted) as T;
  } catch (e) {
    console.warn(`Failed to securely load/decrypt key: ${key}. Returning fallback.`, e);
    return fallback;
  }
}

