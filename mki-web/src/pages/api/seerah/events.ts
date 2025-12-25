/**
 * Seerah Events API
 *
 * GET /api/seerah/events
 * Query params:
 *   - locale: Language (ar, en, fr) - default: ar
 *   - era: Filter by era (Pre-Prophethood, Meccan, Medinan)
 */

import type { APIRoute } from "astro";
import { getSeerahEvents, getSeerahEventsByEra } from "../../../data/d1Service";
import type { EventEra } from "../../../types";

const validLocales = ["ar", "en", "fr"] as const;
const validEras: EventEra[] = ["Pre-Prophethood", "Meccan", "Medinan"];

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const url = new URL(request.url);

    const localeParam = url.searchParams.get("locale") || "ar";
    const eraParam = url.searchParams.get("era");

    // Validate locale
    if (!validLocales.includes(localeParam as typeof validLocales[number])) {
      return new Response(
        JSON.stringify({ error: "Invalid locale. Use: ar, en, or fr" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const locale = localeParam as "ar" | "en" | "fr";

    // Validate era if provided
    if (eraParam && !validEras.includes(eraParam as EventEra)) {
      return new Response(
        JSON.stringify({ error: "Invalid era. Use: Pre-Prophethood, Meccan, or Medinan" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let events;
    if (eraParam) {
      events = await getSeerahEventsByEra(db, locale, eraParam as EventEra);
    } else {
      events = await getSeerahEvents(db, locale);
    }

    return new Response(
      JSON.stringify({
        events,
        count: events.length,
        locale,
        era: eraParam || null,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Seerah API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch seerah events" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
