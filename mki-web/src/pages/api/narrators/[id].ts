/**
 * Single Narrator API
 *
 * GET /api/narrators/:id
 * Returns narrator with teacher/student relationships
 *
 * Query params:
 *   - withRelationships: Include full teacher/student details (default: true)
 */

import type { APIRoute } from "astro";
import {
  getNarratorByIndex,
  getNarratorTeachers,
  getNarratorStudents,
} from "../../../data/hadith/d1Service";

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const id = params.id;
    const url = new URL(request.url);

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing narrator ID" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const scholarIndx = parseInt(id, 10);

    if (isNaN(scholarIndx)) {
      return new Response(
        JSON.stringify({ error: "Invalid narrator ID" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const narrator = await getNarratorByIndex(db, scholarIndx);

    if (!narrator) {
      return new Response(
        JSON.stringify({ error: "Narrator not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if we should include full relationship details
    const withRelationships = url.searchParams.get("withRelationships") !== "false";

    if (withRelationships) {
      const [teachers, students] = await Promise.all([
        getNarratorTeachers(db, scholarIndx),
        getNarratorStudents(db, scholarIndx),
      ]);

      return new Response(
        JSON.stringify({
          narrator,
          teachers,
          students,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ narrator }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Narrator API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch narrator" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
