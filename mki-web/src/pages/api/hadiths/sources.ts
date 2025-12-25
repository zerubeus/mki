/**
 * Hadith Sources API
 *
 * GET /api/hadiths/sources
 * Returns list of all hadith sources with counts
 */

import type { APIRoute } from "astro";
import { getHadithSources } from "../../../data/hadith/d1Service";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const sources = await getHadithSources(db);

    return new Response(JSON.stringify(sources), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Hadith sources API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to get sources" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
