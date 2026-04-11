export function getProjectRoot(): string {
  const root = process.env.PRIMITIV_PROJECT_ROOT;
  if (!root) {
    throw new Error(
      "PRIMITIV_PROJECT_ROOT env var is not set. Launch the viewer via `primitiv view`.",
    );
  }
  return root;
}
