import type { RestaurantProvider } from "./types";

/**
 * Placeholder for future official Dianping API integration.
 *
 * NOT IMPLEMENTED: This is reserved for when Dianping provides
 * an official API (e.g., via Meituan Open Platform).
 *
 * DO NOT implement web scraping or reverse-engineer Dianping's
 * private APIs — that violates their ToS.
 */
export class DianpingOfficialProvider implements RestaurantProvider {
  name = "dianping";

  async searchNearby(): Promise<never> {
    throw new Error(
      "DianpingOfficialProvider is not implemented. " +
      "Waiting for official Dianping/Meituan API availability."
    );
  }
}
