export function MissingConfig({ names }: { names: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-sm leading-7">
      <p className="font-medium">MUSE needs environment variables before auth and data can run.</p>
      <p className="mt-2 text-muted-foreground">
        Copy <code>.env.example</code> to <code>.env.local</code> and add:{" "}
        {names.join(", ")}. Then run <code>npx prisma migrate dev</code> and{" "}
        <code>npx prisma db seed</code>.
      </p>
    </div>
  );
}
