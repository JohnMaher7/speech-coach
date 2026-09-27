import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-14 sm:py-20">
      <SignIn />
    </main>
  );
}
