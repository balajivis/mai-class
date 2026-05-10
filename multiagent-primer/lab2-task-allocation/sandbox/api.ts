// sandbox/api.ts — companion file with its own bugs.

import { login, validateSession } from './auth';

export async function handleLogin(req: any, res: any) {
  const { username, password } = req.body;            // no validation — review should flag
  const token = login(username, password);
  res.json({ token });                                // returns null token without 401 — review should flag
}

export async function handleProtected(req: any, res: any) {
  const token = req.headers.authorization;            // no Bearer prefix handling — review should flag
  if (!validateSession(token)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  // TODO: rate-limit
  res.json({ data: getProtectedData(req.headers['x-user']) });
}

function getProtectedData(user: string) {
  return { secret: `secret data for ${user}` };       // x-user header is forgeable — qa+review should flag
}
