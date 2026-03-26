import * as cheerio from "cheerio"

export type CheerioDoc = cheerio.CheerioAPI

/**
 * Parse HTML once. Pass the returned $ to all parsers.
 * Eliminates 4 redundant cheerio.load() calls per request.
 */
export function parseHtml(html: string): CheerioDoc {
  return cheerio.load(html)
}
