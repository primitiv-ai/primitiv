import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

const BANNER = [
  "  ██████╗ ██████╗ ██╗███╗   ███╗██╗████████╗██╗██╗   ██╗",
  "  ██╔══██╗██╔══██╗██║████╗ ████║██║╚══██╔══╝██║██║   ██║",
  "  ██████╔╝██████╔╝██║██╔████╔██║██║   ██║   ██║╚██╗ ██╔╝",
  "  ██╔═══╝ ██╔══██╗██║██║╚██╔╝██║██║   ██║   ██║ ╚████╔╝ ",
  "  ██║     ██║  ██║██║██║ ╚═╝ ██║██║   ██║   ██║  ╚██╔╝  ",
  "  ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚═╝   ╚═╝  ",
].join("\n");

const TAGLINE = "spec-driven development";

export function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    // From src/ui/banner.ts → ../../package.json (dev)
    // From dist/src/ui/banner.js → ../../../package.json (published)
    let pkgPath = resolve(__dirname, "..", "..", "package.json");
    if (!existsSync(pkgPath)) {
      pkgPath = resolve(__dirname, "..", "..", "..", "package.json");
    }
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function renderBanner(): Promise<string> {
  const version = getVersion();
  const noColor = process.env["NO_COLOR"] !== undefined;

  if (noColor) {
    return `${BANNER}\n              ${TAGLINE}  v${version}\n`;
  }

  try {
    const gradient = (await import("gradient-string")).default;
    const colored = gradient.pastel.multiline(BANNER);
    return `${colored}\n              ${chalk.dim(TAGLINE)}  ${chalk.dim(`v${version}`)}\n`;
  } catch {
    return `${chalk.bold.cyan(BANNER)}\n              ${chalk.dim(TAGLINE)}  ${chalk.dim(`v${version}`)}\n`;
  }
}

export function renderCompactBanner(): string {
  const version = getVersion();
  const noColor = process.env["NO_COLOR"] !== undefined;

  if (noColor) {
    return `◆ Primitiv v${version}`;
  }

  return `${chalk.bold.cyan("◆")} ${chalk.bold("Primitiv")} ${chalk.dim(`v${version}`)}`;
}
