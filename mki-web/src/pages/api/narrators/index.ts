/**
 * Narrators API - Search
 *
 * GET /api/narrators
 * Query params:
 *   - search: Search query for name/grade
 *   - limit: Max results (default: 50, max: 100)
 */

import type { APIRoute } from "astro";
import { searchNarrators } from "../../../data/hadith/d1Service";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const url = new URL(request.url);

    const search = url.searchParams.get("search");
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

    if (!search) {
      return new Response(
        JSON.stringify({ error: "Search query required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const narrators = await searchNarrators(db, search, limit);

    return new Response(
      JSON.stringify({
        narrators,
        count: narrators.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Narrators API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search narrators" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
