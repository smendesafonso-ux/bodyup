/** @type {import('next').NextConfig} */

// Sur GitHub Pages le site est servi sous https://<user>.github.io/<repo>/
// Le workflow CI passe GITHUB_PAGES=true pour activer basePath/assetPrefix.
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "bodyup";

const nextConfig = {
  reactStrictMode: true,
  output: "export", // génère un dossier `out/` 100% statique (aucun serveur requis)
  images: { unoptimized: true },
  trailingSlash: true, // /onboarding/ -> onboarding/index.html (compatible Pages)
  basePath: isPages ? `/${repo}` : undefined,
  assetPrefix: isPages ? `/${repo}/` : undefined,
};

export default nextConfig;
