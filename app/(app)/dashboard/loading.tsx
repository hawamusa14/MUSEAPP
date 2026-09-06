export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
