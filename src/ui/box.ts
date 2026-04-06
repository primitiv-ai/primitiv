import chalk from "chalk";

export interface BoxOptions {
  title?: string;
  content: string;
  padding?: number;
}

export function renderBox({ title, content, padding = 1 }: BoxOptions): string {
  const noColor = process.env["NO_COLOR"] !== undefined;
  const lines = content.split("\n");
  const pad = " ".repeat(padding);

  const allLines = title ? [title, "", ...lines] : lines;
  const maxLen = Math.max(...allLines.map((l) => stripAnsi(l).length));
  const width = maxLen + padding * 2;

  const top = `┌${"─".repeat(width)}┐`;
  const bottom = `└${"─".repeat(width)}┘`;
  const empty = `│${" ".repeat(width)}│`;

  const body = allLines.map((line) => {
    const visible = stripAnsi(line).length;
    const rightPad = " ".repeat(Math.max(0, maxLen - visible));
    return `│${pad}${line}${rightPad}${pad}│`;
  });

  const result = [top, empty, ...body, empty, bottom].join("\n");

  if (noColor) return result;
  return chalk.dim(result);
}

function stripAnsi(str: string): string {
  return str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  );
}
