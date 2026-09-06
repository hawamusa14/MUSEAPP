import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Next</p>
        <CardTitle className="text-3xl">{title}</CardTitle>
        <CardDescription className="text-base leading-7">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
