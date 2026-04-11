"use client";

// Live reload is currently a no-op. The custom server + WebSocket approach
// didn't survive Next.js 16's standalone output (webpack-lib resolution
// issues with a custom server), so this component is stubbed out and the
// viewer relies on manual browser refresh for now. Routes are all
// force-dynamic so a refresh picks up every filesystem change immediately.
//
// A follow-up spec will re-introduce live reload via a Server Sent Events
// Route Handler, which is compatible with Next.js's default standalone
// server.js.

export function LiveReloadClient() {
  return null;
}
