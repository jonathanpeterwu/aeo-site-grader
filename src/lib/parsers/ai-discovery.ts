/**
 * AI discovery file analysis.
 *
 * Checks for emerging AI-specific standards:
 * - /llms.txt — tells LLMs what the site does, how to use it
 * - /llms-full.txt — extended version with full content for LLM consumption
 * - /.well-known/ai-plugin.json — OpenAI ChatGPT plugin manifest
 * - robots.txt AI bot directives — GPTBot, PerplexityBot, ClaudeBot, etc.
 * - Sitemap <lastmod> freshness — are pages being kept current?
 */

export interface AIDiscoverySignals {
  // llms.txt
  hasLlmsTxt: boolean
  llmsTxtLength: number
  llmsTxtSections: string[] // detected section headings

  // llms-full.txt
  hasLlmsFullTxt: boolean
  llmsFullTxtLength: number

  // ai-plugin.json
  hasAiPlugin: boolean
  aiPluginName: string | null
  aiPluginDescription: string | null

  // robots.txt AI bot rules
  aiBotRules: {
    bot: string
    allowed: boolean
  }[]
  blockedBots: string[]
  allowedBots: string[]

  // Sitemap freshness
  sitemapUrlCount: number
  sitemapFreshPages: number // lastmod within 90 days
  sitemapStalePages: number // lastmod > 1 year
  oldestLastmod: string | null
  newestLastmod: string | null
}

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "Anthropic-ai",
  "Bytespider",
  "CCBot",
  "FacebookBot",
  "Applebot-Extended",
]

function parseRobotsAIBots(robotsTxt: string | null): {
  rules: { bot: string; allowed: boolean }[]
  blocked: string[]
  allowed: string[]
} {
  const rules: { bot: string; allowed: boolean }[] = []
  const blocked: string[] = []
  const allowed: string[] = []

  if (!robotsTxt) {
    return { rules, blocked, allowed }
  }

  const lines = robotsTxt.split("\n")

  // Build a map of user-agent blocks
  let currentAgent = ""
  const agentDisallow = new Map<string, boolean>()

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase()
    if (trimmed.startsWith("user-agent:")) {
      currentAgent = trimmed.replace("user-agent:", "").trim()
    } else if (currentAgent && trimmed === "disallow: /") {
      agentDisallow.set(currentAgent, true)
    } else if (currentAgent && trimmed === "allow: /") {
      agentDisallow.set(currentAgent, false)
    }
  }

  const wildcardBlocked = agentDisallow.get("*") === true

  for (const bot of AI_BOTS) {
    const botLower = bot.toLowerCase()
    const hasSpecificRule = agentDisallow.has(botLower)

    let isAllowed: boolean
    if (hasSpecificRule) {
      isAllowed = !agentDisallow.get(botLower)
    } else {
      isAllowed = !wildcardBlocked
    }

    rules.push({ bot, allowed: isAllowed })
    if (isAllowed) {
      allowed.push(bot)
    } else {
      blocked.push(bot)
    }
  }

  return { rules, blocked, allowed }
}

function parseLlmsTxt(content: string | null): {
  length: number
  sections: string[]
} {
  if (!content) return { length: 0, sections: [] }

  const sections: string[] = []
  const lines = content.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    // Detect markdown headings or UPPERCASE section labels
    if (trimmed.startsWith("#") || /^[A-Z][A-Z\s]{3,}:?$/.test(trimmed)) {
      sections.push(trimmed.replace(/^#+\s*/, ""))
    }
  }

  return { length: content.length, sections }
}

function parseSitemapFreshness(sitemapXml: string | null): {
  urlCount: number
  freshPages: number
  stalePages: number
  oldest: string | null
  newest: string | null
} {
  if (!sitemapXml) return { urlCount: 0, freshPages: 0, stalePages: 0, oldest: null, newest: null }

  const lastmods = [...sitemapXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/gi)]
    .map((m) => m[1].trim())
    .filter((d) => d.length > 0)

  const urlMatches = sitemapXml.match(/<loc>/gi)
  const urlCount = urlMatches ? urlMatches.length : 0

  if (lastmods.length === 0) {
    return { urlCount, freshPages: 0, stalePages: 0, oldest: null, newest: null }
  }

  const now = Date.now()
  const NINETY_DAYS = 90 * 86_400_000
  const ONE_YEAR = 365 * 86_400_000

  let freshPages = 0
  let stalePages = 0
  let oldest = lastmods[0]
  let newest = lastmods[0]

  for (const d of lastmods) {
    try {
      const ts = new Date(d).getTime()
      const age = now - ts
      if (age <= NINETY_DAYS) freshPages++
      if (age > ONE_YEAR) stalePages++

      if (d < oldest) oldest = d
      if (d > newest) newest = d
    } catch { /* skip */ }
  }

  return { urlCount, freshPages, stalePages, oldest, newest }
}

export function analyzeAIDiscovery(
  robotsTxt: string | null,
  sitemapXml: string | null,
  llmsTxt: string | null,
  llmsFullTxt: string | null,
  aiPluginJson: Record<string, unknown> | null
): AIDiscoverySignals {
  const botAnalysis = parseRobotsAIBots(robotsTxt)
  const llmsAnalysis = parseLlmsTxt(llmsTxt)
  const sitemapAnalysis = parseSitemapFreshness(sitemapXml)

  return {
    hasLlmsTxt: !!llmsTxt,
    llmsTxtLength: llmsAnalysis.length,
    llmsTxtSections: llmsAnalysis.sections,

    hasLlmsFullTxt: !!llmsFullTxt,
    llmsFullTxtLength: llmsFullTxt ? llmsFullTxt.length : 0,

    hasAiPlugin: !!aiPluginJson,
    aiPluginName: aiPluginJson?.name_for_human as string ?? aiPluginJson?.name_for_model as string ?? null,
    aiPluginDescription: aiPluginJson?.description_for_human as string ?? null,

    aiBotRules: botAnalysis.rules,
    blockedBots: botAnalysis.blocked,
    allowedBots: botAnalysis.allowed,

    sitemapUrlCount: sitemapAnalysis.urlCount,
    sitemapFreshPages: sitemapAnalysis.freshPages,
    sitemapStalePages: sitemapAnalysis.stalePages,
    oldestLastmod: sitemapAnalysis.oldest,
    newestLastmod: sitemapAnalysis.newest,
  }
}
