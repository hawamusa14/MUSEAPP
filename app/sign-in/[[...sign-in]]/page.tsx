import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#f8e7e4,_#fffaf8_50%)] px-4 py-10">
      <Link href="/" className="mb-8 font-heading text-3xl tracking-[0.22em]">
        MUSE
      </Link>
      <SignIn />
    </div>
  );
}
