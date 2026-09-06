export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function toActionError(error: unknown, fallback: string) {
  if (error instanceof ActionError) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray((error as { issues: { message?: string }[] }).issues)
  ) {
    return (
      (error as { issues: { message?: string }[] }).issues[0]?.message ??
      fallback
    );
  }

  console.error(error);
  return fallback;
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
