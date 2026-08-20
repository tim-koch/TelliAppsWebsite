import type { APIRoute } from "astro";
import { SITES } from "../../config/sites";

const paths = [
  "/",
  "/beta/",
  "/kontakt/",
  "/datenschutz/",
  "/agb/",
  "/impressum/",
  "/ki-hinweise/",
  "/hinweise/",
  "/konto-loeschen/",
];
export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${new URL(path, SITES.planteller.origin)}</loc><changefreq>monthly</changefreq></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
