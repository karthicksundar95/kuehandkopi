/**
 * Decorative layer using assets from `data/media/images/mango_theme`
 * (copied to `/mango_theme/` in public). Roles:
 * — splash-ribbon: vertical juice swirl, anchors the left “pour”
 * — mango-leaves-pair: tropical frame (two fresh leaves)
 * — whole-a / whole-b: ripe whole fruit in opposite corners
 * — hedgehog-half: large soft layer behind the drink column (depth)
 * — cross-section: flat cut visual for mid-ground depth
 * — cubes-cluster / cubes-scattered: cut-fruit energy around the frame
 * — half-cut / slice: hero-side accents
 * — leaf single ×2: corner foliage (rotated differently)
 * — ice-cubes: cold refresh near drinks (contrasts warm mango)
 */
type Piece = {
  id: string
  src: string
}

const PIECES: Piece[] = [
  { id: "splash", src: "/mango_theme/splash-ribbon.png" },
  { id: "leaves-pair", src: "/mango_theme/mango-leaves-pair.png" },
  { id: "whole-a", src: "/mango_theme/mango-whole-a.png" },
  { id: "whole-b", src: "/mango_theme/mango-whole-b.png" },
  { id: "hedgehog", src: "/mango_theme/mango-hedgehog-half.png" },
  { id: "cross-section", src: "/mango_theme/mango-cross-section.png" },
  { id: "cubes-cluster", src: "/mango_theme/mango-cubes-cluster.png" },
  { id: "cubes-scattered", src: "/mango_theme/mango-cubes-scattered.png" },
  { id: "half-cut", src: "/mango_theme/mango-half-cut.png" },
  { id: "slice", src: "/mango_theme/mango-slice-wedge.png" },
  { id: "leaf-a", src: "/mango_theme/mango-leaf-single.png" },
  { id: "leaf-b", src: "/mango_theme/mango-leaf-single.png" },
  { id: "ice", src: "/mango_theme/ice-cubes.png" },
]

type Props = {
  reducedMotion: boolean
}

export function MangoThemeBackground({ reducedMotion }: Props) {
  return (
    <div
      className={`mango-hero-theme ${reducedMotion ? "mango-hero-theme--static" : ""}`}
      aria-hidden
    >
      {PIECES.map((p) => (
        <span
          key={`${p.id}`}
          className={`mango-theme-slot mango-theme-slot--${p.id}`}
        >
          <img
            src={p.src}
            alt=""
            className="mango-theme-slot-img"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </span>
      ))}
    </div>
  )
}
