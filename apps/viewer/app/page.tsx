import { getEngine } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default function Home() {
  let status = "scaffold OK";
  try {
    const engine = getEngine();
    status = `Engine loaded for ${engine.projectRoot} (initialized=${engine.initialized})`;
  } catch (err) {
    status = err instanceof Error ? err.message : String(err);
  }
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Primitiv Viewer</h1>
      <p className="mt-2 text-muted-foreground">{status}</p>
    </main>
  );
}
