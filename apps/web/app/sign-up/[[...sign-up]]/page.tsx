import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[radial-gradient(50%_50%_at_50%_30%,#ffffff_0%,transparent_100%)] px-4 py-16 sm:py-24">
      <SignUp />
    </main>
  );
}
