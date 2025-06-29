
// Simple encryption utility (in production, use a proper encryption library)
export const generateSalt = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateUserKey = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Simple XOR encryption (for demo purposes - use proper encryption in production)
export const encrypt = (text: string, key: string, salt: string): string => {
  const combinedKey = key + salt;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length));
  }
  return btoa(result);
};

export const decrypt = (encryptedText: string, key: string, salt: string): string => {
  try {
    const combinedKey = key + salt;
    const text = atob(encryptedText);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length));
    }
    return result;
  } catch {
    return encryptedText; // Return original if decryption fails
  }
};
