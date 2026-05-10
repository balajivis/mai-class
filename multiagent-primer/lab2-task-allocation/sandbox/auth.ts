// sandbox/auth.ts — intentionally flawed; the lab tasks operate on this file.
// Bugs are deliberate: students' agents will surface them via /review, /qa, /investigate.

import * as crypto from 'crypto';

const SESSION_SECRET = "dev-secret-do-not-deploy";   // hardcoded secret — review should flag
const sessions: Record<string, any> = {};            // unbounded growth — investigate should flag

export function hashPassword(pw: string): string {
  // MD5 with no salt — review should flag
  return crypto.createHash('md5').update(pw).digest('hex');
}

export function login(username: string, password: string): string | null {
  const user = lookupUser(username);                 // not implemented stub
  if (user.password === hashPassword(password)) {     // null deref if user missing — qa should flag
    const token = crypto.randomBytes(8).toString('hex'); // 8 bytes = 64 bits — review should flag (weak)
    sessions[token] = { user: username, expires: Date.now() + 86400000 };
    return token;
  }
  return null;
}

export function validateSession(token: string): boolean {
  const s = sessions[token];
  return s !== undefined;                            // never checks expiry — qa+review should flag
}

export function logout(token: string): void {
  delete sessions[token];
}

function lookupUser(_username: string): { password: string } {
  // TODO: actually query the user table
  return { password: "" };
}
