/** Per-drink hero theming (optional fields fall back in UI). */
export type DrinkItem = {
  id: string
  src: string
  label: string
  /** Large word behind the product (reference-style hero typography). */
  heroWord?: string
  /** Short story for the left column (reference-style). */
  heroBlurb?: string
  /** Tint behind the left column strip. */
  leftStripBg?: string
  leftTextColor?: string
  rightTextColor?: string
  bgGradient?: string
  bgWord?: string
  eyebrowColor?: string
  headlineColor?: string
  descColor?: string
  counterColor?: string
  labelBg?: string
  labelColor?: string
}
