/**
 * generate-icons.mjs
 * Converts public/icon.svg into icon-192.png and icon-512.png
 * Run once: node scripts/generate-icons.mjs
 */
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");
const publicDir = path.join(root, "public");

// Check if sharp is available, if not install it temporarily
let sharp;
try {
    sharp = (await import("sharp")).default;
} catch {
    console.log("Installing sharp...");
    execSync("npm install sharp --no-save", { cwd: root, stdio: "inherit" });
    sharp = (await import("sharp")).default;
}

const sizes = [192, 512];

for (const size of sizes) {
    const out = path.join(publicDir, `icon-${size}.png`);
    await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(out);
    console.log(`✅ Generated icon-${size}.png`);
}

console.log("Done! PWA icons are ready.");
