/**
 * Wire protocol types for the browse command HTTP interface.
 */

export interface CommandRequest {
  command: string;
  args?: string[];
}

export interface CommandErrorResponse {
  error: string;
  hint?: string;
}
