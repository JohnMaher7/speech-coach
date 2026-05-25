import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next.js 16 renamed the `middleware` file convention to `proxy`. Clerk's
// `clerkMiddleware()` is the handler either way — exported as the default.

// Routes that always require a signed-in user.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/analyzing(.*)",
]);

// A real report (`/report/<id>`) needs auth; the sample reports
// (`/report/sample`, `/report/sample/...`) stay public as the demo.
const isReportRoute = createRouteMatcher(["/report/:id"]);
const isSampleRoute = createRouteMatcher(["/report/sample(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const needsAuth =
    isProtectedRoute(req) || (isReportRoute(req) && !isSampleRoute(req));
  if (needsAuth) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static files...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...and always on API routes.
    "/(api|trpc)(.*)",
  ],
};
