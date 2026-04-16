/** Site & campaign config — edit URLs before launch */
export const siteConfig = {
  brandName: "Kueh & Kopi",
  /** ~8-week mango menu push — update when the kitchen sets a firm end date */
  campaignTitle: "Mango menu",
  campaignSubtitle: "Limited seasonal run",
  /** ISO end for countdown badge (hero + footer messaging) */
  campaignEndDate: "2026-06-16T23:59:59",
  tagline: "Small batches. Big flavour.",
  /** Brand logo (from data/media/images/brand/logo.jpg, copied to public) */
  logoSrc: "/brand/logo.jpg",
  swiggyUrl: "https://www.swiggy.com",
  zomatoUrl: "https://www.zomato.com",
  instagramUrl: "https://www.instagram.com",
} as const

/** API base: empty uses same origin (Vite proxy in dev, FastAPI in prod) */
export function apiBase(): string {
  const v = import.meta.env.VITE_API_BASE
  return typeof v === "string" ? v.replace(/\/$/, "") : ""
}
