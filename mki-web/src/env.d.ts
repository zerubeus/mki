/// <reference types="astro/client" />

/**
 * Cloudflare Runtime Environment Types
 *
 * Extends Astro's App.Locals with Cloudflare-specific bindings.
 * Access in Astro pages via: Astro.locals.runtime.env.DB
 */

type Runtime = import("@astrojs/cloudflare").Runtime<{
  /** D1 Database for hadith, narrator, and seerah data */
  DB: D1Database;
  /** Site URL */
  SITE_URL: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
