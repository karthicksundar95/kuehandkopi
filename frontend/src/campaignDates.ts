/** Days remaining until campaign end (local midnight). */
export function daysUntilCampaignEnd(isoDate: string, nowMs = Date.now()): number {
  const end = new Date(isoDate).getTime()
  if (Number.isNaN(end)) return 0
  const dayMs = 86_400_000
  return Math.max(0, Math.ceil((end - nowMs) / dayMs))
}

export function formatCampaignEndShort(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}
