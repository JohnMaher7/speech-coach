import { existsSync } from "node:fs";

// OpenNext bundles every .env file it finds into the Worker. Only the
// committed .env.production belongs in a production build; anything else
// here is a local file (dev Clerk keys, a localhost API URL).
const localEnvFiles = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production.local",
  ".env.test",
  ".env.test.local",
].filter((file) => existsSync(file));

if (localEnvFiles.length > 0) {
  console.error(
    `Refusing to deploy: ${localEnvFiles.join(", ")} would be bundled into the production Worker.\n` +
      "Production deploys run on Cloudflare Workers Builds when you push to main.",
  );
  process.exit(1);
}
