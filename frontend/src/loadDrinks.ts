import type { DrinkItem } from "./types"

type Manifest = { drinks: DrinkItem[] }

export async function loadDrinks(): Promise<DrinkItem[]> {
  const res = await fetch("/mango_drinks/manifest.json")
  if (!res.ok) throw new Error("Failed to load drink manifest")
  const data = (await res.json()) as Manifest
  return data.drinks ?? []
}
