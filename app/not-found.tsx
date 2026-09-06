import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-full place-items-center px-6 text-center">
      <div>
        <p className="font-heading text-5xl">MUSE</p>
        <h1 className="mt-4 font-heading text-3xl">This page is not here</h1>
        <Button className="mt-6" render={<Link href="/dashboard" />}>
          Return home
        </Button>
      </div>
    </div>
  );
}
