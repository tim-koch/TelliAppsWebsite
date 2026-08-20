import type { APIRoute } from "astro";
import { SITES } from "../../config/sites";
export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /recipe-share/\nDisallow: /collection-share/\nDisallow: /invite/\nDisallow: /reset-password/\n\nSitemap: ${SITES.planteller.origin}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
