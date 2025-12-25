/**
 * Resolve Narrator Chain API
 *
 * GET /api/narrators/resolve
 * Query params:
 *   - ids: Comma-separated narrator IDs
 */

import type { APIRoute } from "astro";
import { resolveChain } from "../../../data/hadith/d1Service";

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const url = new URL(request.url);

    const idsParam = url.searchParams.get("ids");
    if (!idsParam) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const narrators = await resolveChain(db, ids);

    return new Response(JSON.stringify(narrators), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Resolve chain API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to resolve chain" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
