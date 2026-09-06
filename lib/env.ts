export function getMissingEnv() {
  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ] as const;

  return required.filter((key) => !process.env[key]);
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}
