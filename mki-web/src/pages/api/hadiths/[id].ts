/**
 * Single Hadith API
 *
 * GET /api/hadiths/:id
 * Returns hadith with full chain of narrators
 *
 * The id can be:
 *   - A numeric hadith_id (e.g., "123")
 *   - A source:hadithNo format (e.g., "bukhari:1")
 */

import type { APIRoute } from "astro";
import { getHadithById, resolveChain } from "../../../data/hadith/d1Service";

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const id = params.id;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing hadith ID" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get hadith by string ID (e.g., "hadith_123")
    const hadith = await getHadithById(db, id.startsWith("hadith_") ? id : `hadith_${id}`);

    if (!hadith) {
      return new Response(
        JSON.stringify({ error: "Hadith not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Resolve chain if there are chain indices
    const chain = hadith.chainIndices.length > 0
      ? await resolveChain(db, hadith.chainIndices)
      : [];

    return new Response(
      JSON.stringify({
        ...hadith,
        chain,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hadith API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch hadith" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
