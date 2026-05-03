import { UploadForm } from "@/components/upload-form";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">
            Toastmasters Speech Coach
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload a recorded speech and get an evaluator-style report —
            fillers, pacing, vocal variety, structure, and your top three
            actions.
          </p>
        </div>
        <UploadForm />
      </div>
    </main>
  );
}
