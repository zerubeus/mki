/**
 * Hadiths API - List and Search
 *
 * GET /api/hadiths
 * Query params:
 *   - source: Filter by hadith source (e.g., "Sahih Bukhari")
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20, max: 100)
 *   - search: Search query for text/chapter
 */

import type { APIRoute } from "astro";
import { getHadithsPaginated, getHadithSources, searchHadiths } from "../../../data/hadith/d1Service";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const url = new URL(request.url);

    const source = url.searchParams.get("source") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "20", 10)));

    const result = await getHadithsPaginated(db, page, perPage, source);

    return new Response(
      JSON.stringify({
        hadiths: result.hadiths,
        total: result.total,
        pages: result.pages,
        page,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hadiths API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch hadiths" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
