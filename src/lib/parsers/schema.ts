import { SchemaData } from "@/types"
import { CheerioDoc } from "./parse-html"

function findTypes(obj: unknown, target: string): boolean {
  if (!obj || typeof obj !== "object") return false
  if (Array.isArray(obj)) return obj.some((item) => findTypes(item, target))
  const record = obj as Record<string, unknown>
  if (record["@type"] === target) return true
  if (
    Array.isArray(record["@type"]) &&
    (record["@type"] as string[]).includes(target)
  )
    return true
  if (record["@graph"] && Array.isArray(record["@graph"])) {
    return (record["@graph"] as unknown[]).some((item) =>
      findTypes(item, target)
    )
  }
  return false
}

function countFaqItems(obj: unknown): number {
  if (!obj || typeof obj !== "object") return 0
  if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + countFaqItems(item), 0)
  const record = obj as Record<string, unknown>

  if (record["@graph"] && Array.isArray(record["@graph"])) {
    return (record["@graph"] as unknown[]).reduce(
      (sum: number, item) => sum + countFaqItems(item),
      0
    )
  }

  if (record["@type"] === "FAQPage" && Array.isArray(record.mainEntity)) {
    return (record.mainEntity as unknown[]).length
  }

  return 0
}

export function extractSchemaData($: CheerioDoc): SchemaData {
  const jsonLdBlocks: Record<string, unknown>[] = []
  let hasFaq = false
  let hasSpeakable = false
  let hasSoftwareApp = false
  let faqCount = 0

  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).text().trim()
    if (!text) return
    try {
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        jsonLdBlocks.push(item)
        if (findTypes(item, "FAQPage")) {
          hasFaq = true
          faqCount += countFaqItems(item)
        }
        if (findTypes(item, "Speakable")) hasSpeakable = true
        if (item.speakable) hasSpeakable = true
        if (findTypes(item, "SoftwareApplication")) hasSoftwareApp = true
      }
    } catch {
      // malformed JSON-LD, skip
    }
  })

  if (faqCount === 0) {
    const faqSections = $('[itemtype*="FAQPage"], .faq, #faq, [data-faq]')
    if (faqSections.length > 0) {
      faqCount = faqSections.find("details, .faq-item, [itemprop='mainEntity']").length
    }
  }

  return { jsonLdBlocks, hasFaq, hasSpeakable, hasSoftwareApp, faqCount }
}
