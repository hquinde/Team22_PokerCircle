const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateSessionCode(length: number = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ALPHANUM.length);
    code += ALPHANUM.charAt(idx);
  }
  return code;
}
