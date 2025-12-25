/**
 * Hadiths Search API
 *
 * GET /api/hadiths/search
 * Query params:
 *   - q: Search query
 *   - limit: Max results (default: 100)
 */

import type { APIRoute } from "astro";
import { searchHadiths } from "../../../data/hadith/d1Service";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const url = new URL(request.url);

    const q = url.searchParams.get("q") || "";
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));

    if (!q.trim()) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const hadiths = await searchHadiths(db, q, limit);

    return new Response(JSON.stringify(hadiths), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Hadiths search API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search hadiths" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
