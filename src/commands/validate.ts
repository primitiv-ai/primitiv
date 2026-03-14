import { PrimitivEngine } from "../engine/PrimitivEngine.js";
import { validateGate } from "../validation/gateValidator.js";
import { validateConstitution } from "../validation/constitutionValidator.js";
import { validateSpecAlignment } from "../validation/specAlignment.js";
import chalk from "chalk";

export async function runValidate(
  targetDir: string,
  specId: string,
  options: { gate?: string }
): Promise<void> {
  const engine = PrimitivEngine.load(targetDir);
  const spec = engine.getSpec(specId);

  if (options.gate) {
    const gateNum = parseInt(options.gate, 10);
    if (gateNum === 1) {
      const result = validateGate(targetDir, "company");
      printResult(result);
    } else if (gateNum === 2) {
      const result = validateGate(targetDir, "security");
      printResult(result);
    } else if (gateNum === 3) {
      for (const type of ["product", "dev", "architecture"] as const) {
        const result = validateConstitution(targetDir, type);
        printResult(result);
      }
    } else {
      console.log(chalk.red(`Invalid gate number: ${gateNum}. Use 1, 2, or 3.`));
    }
    return;
  }

  // Validate all gates
  const report = validateSpecAlignment(targetDir, spec);
  console.log(chalk.bold(`\nSpec ${specId} — Gate Validation Report\n`));
  for (const result of report.gates) {
    printResult(result);
  }
  console.log(
    report.allPassed
      ? chalk.green("\n✓ All gates passed")
      : chalk.red("\n✗ Some gates failed")
  );
}

function printResult(result: { passed: boolean; gate: string; violations: string[]; warnings: string[] }): void {
  const icon = result.passed ? chalk.green("✓") : chalk.red("✗");
  console.log(`${icon} ${result.gate}`);
  for (const v of result.violations) {
    console.log(chalk.red(`    ✗ ${v}`));
  }
  for (const w of result.warnings) {
    console.log(chalk.yellow(`    ⚠ ${w}`));
  }
}
