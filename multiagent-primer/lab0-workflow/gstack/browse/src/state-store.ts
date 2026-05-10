/**
 * Shared state store for cross-skill communication.
 *
 * In-memory Map backed by a JSON file at {stateDir}/browse-state.json.
 * Skills use namespaced keys like "eng-review.test-plan" to share
 * decisions, constraints, and findings without relying on filesystem globs.
 *
 * Single-process (browse daemon), so no concurrency concerns.
 * Flushes to disk on every mutation for durability.
 */

import * as fs from 'fs';
import * as path from 'path';

export class StateStore {
  private data: Map<string, any> = new Map();
  readonly filePath: string;

  constructor(stateDir: string) {
    this.filePath = path.join(stateDir, 'browse-state.json');
    this.load();
  }

  get(key: string): any | undefined {
    return this.data.get(key);
  }

  set(key: string, value: any): void {
    this.data.set(key, value);
    this.flush();
  }

  delete(key: string): boolean {
    const existed = this.data.delete(key);
    if (existed) this.flush();
    return existed;
  }

  list(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, v] of this.data) {
      result[k] = v;
    }
    return result;
  }

  clear(): void {
    this.data.clear();
    this.flush();
  }

  /** Write current state to disk (atomic: tmp + rename). */
  flush(): void {
    const obj: Record<string, any> = {};
    for (const [k, v] of this.data) {
      obj[k] = v;
    }
    const tmpFile = this.filePath + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(obj, null, 2));
    fs.renameSync(tmpFile, this.filePath);
  }

  /** Load state from disk (if file exists). */
  load(): void {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const obj = JSON.parse(raw);
      this.data.clear();
      for (const [k, v] of Object.entries(obj)) {
        this.data.set(k, v);
      }
    } catch {
      // File doesn't exist or is invalid — start empty
    }
  }

  /** Remove the backing file from disk. */
  cleanup(): void {
    try { fs.unlinkSync(this.filePath); } catch {}
  }
}
