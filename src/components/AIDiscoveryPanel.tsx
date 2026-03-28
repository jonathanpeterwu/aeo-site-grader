"use client"

import { AnalysisReport } from "@/types"

export function AIDiscoveryPanel({
  discovery,
}: {
  discovery: NonNullable<AnalysisReport["aiDiscovery"]>
}) {
  const totalBots = discovery.aiBotRules.length
  const allowedCount = discovery.allowedBots.length
  const blockedCount = discovery.blockedBots.length

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        AI Discovery Files
      </h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* llms.txt */}
        <div
          className={`rounded-lg border p-3 ${
            discovery.hasLlmsTxt
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={discovery.hasLlmsTxt ? "text-green-600 dark:text-green-400" : "text-gray-400"}>
              {discovery.hasLlmsTxt ? "\u2713" : "\u2717"}
            </span>
            <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
              /llms.txt
            </span>
          </div>
          {discovery.hasLlmsTxt ? (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {discovery.llmsTxtLength.toLocaleString()} chars
              {discovery.llmsTxtSections.length > 0 && (
                <span>
                  {" \u00B7 "}
                  {discovery.llmsTxtSections.length} section(s)
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Not found. Add to tell LLMs what your site does.
            </p>
          )}
        </div>

        {/* llms-full.txt */}
        <div
          className={`rounded-lg border p-3 ${
            discovery.hasLlmsFullTxt
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={discovery.hasLlmsFullTxt ? "text-green-600 dark:text-green-400" : "text-gray-400"}>
              {discovery.hasLlmsFullTxt ? "\u2713" : "\u2717"}
            </span>
            <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
              /llms-full.txt
            </span>
          </div>
          {discovery.hasLlmsFullTxt ? (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {discovery.llmsFullTxtLength.toLocaleString()} chars — extended LLM context
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Optional. Provides full content for LLM consumption.
            </p>
          )}
        </div>

        {/* ai-plugin.json */}
        <div
          className={`rounded-lg border p-3 ${
            discovery.hasAiPlugin
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={discovery.hasAiPlugin ? "text-green-600 dark:text-green-400" : "text-gray-400"}>
              {discovery.hasAiPlugin ? "\u2713" : "\u2717"}
            </span>
            <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
              ai-plugin.json
            </span>
          </div>
          {discovery.hasAiPlugin ? (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {discovery.aiPluginName || "Plugin detected"}
              {discovery.aiPluginDescription && (
                <span className="block mt-0.5 opacity-75">
                  {discovery.aiPluginDescription.slice(0, 80)}
                  {(discovery.aiPluginDescription.length ?? 0) > 80 ? "..." : ""}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Optional. ChatGPT plugin manifest.
            </p>
          )}
        </div>
      </div>

      {/* AI Bot Access */}
      <div className="mt-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          AI Bot Access ({allowedCount}/{totalBots} allowed)
        </h4>
        <div className="flex flex-wrap gap-2">
          {discovery.aiBotRules.map((rule) => (
            <span
              key={rule.bot}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                rule.allowed
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {rule.allowed ? "\u2713" : "\u2717"} {rule.bot}
            </span>
          ))}
        </div>
        {blockedCount > 0 && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {blockedCount} AI bot(s) blocked. These engines cannot index your site for AI-generated answers.
          </p>
        )}
      </div>

      {/* Sitemap Freshness */}
      {discovery.sitemapUrlCount > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Sitemap Freshness
          </h4>
          <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>{discovery.sitemapUrlCount} URLs indexed</span>
            {discovery.sitemapFreshPages > 0 && (
              <span className="text-green-600 dark:text-green-400">
                {discovery.sitemapFreshPages} fresh (&lt;90d)
              </span>
            )}
            {discovery.sitemapStalePages > 0 && (
              <span className="text-red-500 dark:text-red-400">
                {discovery.sitemapStalePages} stale (&gt;1yr)
              </span>
            )}
          </div>
          {discovery.newestLastmod && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Newest: {discovery.newestLastmod.split("T")[0]}
              {discovery.oldestLastmod && discovery.oldestLastmod !== discovery.newestLastmod && (
                <span> · Oldest: {discovery.oldestLastmod.split("T")[0]}</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
