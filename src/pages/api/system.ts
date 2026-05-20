import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return Response.json({ ok: true, service: "custom-cms", status: "ready" });
};

export const POST: APIRoute = async ({ request }) => {
  const text = await request.text();
  return Response.json({ echo: text, length: text.length });
};
