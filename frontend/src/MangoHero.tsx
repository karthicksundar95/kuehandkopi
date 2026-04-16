import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { daysUntilCampaignEnd, formatCampaignEndShort } from "./campaignDates"
import { siteConfig } from "./config"
import { MangoThemeBackground } from "./MangoThemeBackground"
import type { DrinkItem } from "./types"

gsap.registerPlugin(ScrollTrigger)

type Props = {
  drinks: DrinkItem[]
}

const defaultGradient =
  "linear-gradient(168deg, #fafcfe 0%, #f0f7ff 50%, #fff8f0 100%)"

const defaultBlurb =
  "Scroll to explore the seasonal mango lineup — then play the memory game for a chance to win a free treat in-store."

export function MangoHero({ drinks }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const bgWordRef = useRef<HTMLDivElement>(null)
  const prevActiveRef = useRef<number | null>(null)
  const [active, setActive] = useState(0)
  const total = Math.max(drinks.length, 1)
  const [daysLeft, setDaysLeft] = useState(() =>
    daysUntilCampaignEnd(siteConfig.campaignEndDate),
  )
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const pointerFineRef = useRef(false)

  useEffect(() => {
    pointerFineRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches
  }, [])

  useEffect(() => {
    const tick = () =>
      setDaysLeft(daysUntilCampaignEnd(siteConfig.campaignEndDate))
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      return
    }
    const section = sectionRef.current
    const pin = pinRef.current
    if (!section || !pin || drinks.length === 0) return

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      pin: pin,
      scrub: 0.6,
      onUpdate: (self: { progress: number }) => {
        const idx = Math.min(
          drinks.length - 1,
          Math.floor(self.progress * drinks.length),
        )
        setActive(idx)
      },
    })

    return () => {
      st.kill()
    }
  }, [drinks, reduceMotion])

  useEffect(() => {
    if (reduceMotion) return
    const img = imgRef.current
    const label = labelRef.current
    if (!img) return

    const prev = prevActiveRef.current
    prevActiveRef.current = active

    if (prev === null) {
      gsap.set(img, {
        rotateY: 0,
        x: 0,
        z: 0,
        opacity: 1,
        scale: 1,
        transformPerspective: 1600,
        transformOrigin: "50% 50%",
      })
      return
    }
    if (prev === active) return

    gsap.killTweensOf([img, label].filter(Boolean))

    const dir = active > prev ? 1 : -1
    const startY = 92 * dir

    gsap.set(img, {
      transformPerspective: 1600,
      transformOrigin: "50% 50%",
      rotateY: startY,
      rotateX: 0,
      x: 0,
      z: -240,
      opacity: 0.35,
      scale: 0.9,
    })

    gsap.to(img, {
      rotateY: 0,
      z: 0,
      opacity: 1,
      scale: 1,
      duration: 0.82,
      ease: "back.out(1.25)",
    })

    if (label) {
      gsap.fromTo(
        label,
        {
          y: 18,
          opacity: 0,
          rotateY: 22 * dir,
          transformPerspective: 900,
        },
        {
          y: 0,
          opacity: 1,
          rotateY: 0,
          duration: 0.55,
          delay: 0.1,
          ease: "back.out(1.1)",
          transformOrigin: "50% 50%",
        },
      )
    }
  }, [active, reduceMotion])

  useEffect(() => {
    if (reduceMotion || !pinRef.current) return

    const ctx = gsap.context(() => {
      gsap.from(".mango-hero-left > *", {
        opacity: 0,
        y: 22,
        stagger: 0.07,
        duration: 0.55,
        ease: "power2.out",
        delay: 0.12,
      })
      gsap.from(".mango-hero-center", {
        opacity: 0,
        scale: 0.94,
        duration: 0.75,
        ease: "back.out(1.15)",
        delay: 0.08,
      })
      gsap.from(".mango-hero-accordion-link", {
        opacity: 0,
        x: 18,
        stagger: 0.07,
        duration: 0.45,
        ease: "power2.out",
        delay: 0.32,
      })
      gsap.from(".mango-hero-counter", {
        opacity: 0,
        y: -8,
        duration: 0.4,
        ease: "power2.out",
      })

      const word = bgWordRef.current
      if (word) {
        gsap.to(word, {
          y: "+=14",
          duration: 5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        })
      }
    }, pinRef)

    return () => ctx.revert()
  }, [drinks.length, reduceMotion])

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || !pointerFineRef.current) return
    const el = tiltRef.current
    const pin = pinRef.current
    if (!el || !pin) return
    const r = pin.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    gsap.to(el, {
      rotateY: px * -14,
      rotateX: py * 10,
      duration: 0.45,
      ease: "power2.out",
      overwrite: "auto",
    })
  }

  const onPointerLeave = () => {
    const el = tiltRef.current
    if (!el || reduceMotion) return
    gsap.to(el, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.7,
      ease: "elastic.out(1, 0.6)",
    })
  }

  const current = drinks[active] ?? drinks[0]
  const bg = current?.bgGradient ?? defaultGradient
  const bgWord = current?.bgWord ?? "rgba(15, 61, 115, 0.07)"
  const heroWord = (current?.heroWord ?? "MANGO").toUpperCase()
  const heroBlurb = current?.heroBlurb ?? defaultBlurb
  const leftStrip = current?.leftStripBg ?? "rgba(8, 40, 80, 0.35)"
  const leftText = current?.leftTextColor ?? "#ffffff"
  const rightText = current?.rightTextColor ?? "#ffffff"
  const eyebrow = current?.eyebrowColor ?? "var(--color-brand-orange)"
  const counter = current?.counterColor ?? "rgba(255, 255, 255, 0.85)"
  const labelBg = current?.labelBg ?? "linear-gradient(135deg, #1a6fd4, #0f4a8c)"
  const labelFg = current?.labelColor ?? "#ffffff"
  const endShort = formatCampaignEndShort(siteConfig.campaignEndDate)

  return (
    <section
      ref={sectionRef}
      className="mango-hero-track"
      style={{
        minHeight: reduceMotion ? "auto" : `${total * 100}vh`,
        background: bg,
        transition: "background 0.45s ease",
      }}
      aria-label="Mango menu campaign"
    >
      <div
        ref={pinRef}
        className="mango-hero-pin"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <MangoThemeBackground reducedMotion={reduceMotion} />
        <div
          className="mango-hero-left-strip"
          aria-hidden
          style={{
            background: leftStrip,
            transition: "background 0.45s ease",
          }}
        />
        <div
          ref={bgWordRef}
          className="mango-hero-bg-word"
          aria-hidden
          style={{ color: bgWord, transition: "color 0.45s ease" }}
        >
          {heroWord}
        </div>
        <div
          className="mango-hero-counter"
          aria-live="polite"
          style={{ color: counter }}
        >
          <span className="mango-hero-counter-label">Mango menu</span>
          <span className="mango-hero-counter-num">
            {active + 1} / {total}
          </span>
        </div>
        <div className="mango-hero-shell">
          <div
            className="mango-hero-left"
            style={{ color: leftText, transition: "color 0.45s ease" }}
          >
            <div className="mango-hero-badges">
              <span className="mango-hero-pill mango-hero-pill--accent">
                {siteConfig.campaignSubtitle}
              </span>
              <span className="mango-hero-pill mango-hero-pill--glass">
                {daysLeft > 0
                  ? `${daysLeft} days left · ends ${endShort}`
                  : `Ended ${endShort}`}
              </span>
            </div>
            <p className="mango-hero-season-line">
              Two-month mango menu · In-store &amp; delivery
            </p>
            <hr className="mango-hero-rule" />
            <p
              className="mango-hero-eyebrow mango-hero-eyebrow--left"
              style={{ color: eyebrow }}
            >
              {siteConfig.campaignTitle}
            </p>
            <p className="mango-hero-blurb">{heroBlurb}</p>
            <div className="mango-hero-cta-row mango-hero-cta-row--left">
              <a className="btn btn-mango-cta" href="#memory-game">
                <span className="btn-mango-cta-shine" aria-hidden />
                Play &amp; win
              </a>
              <a className="btn btn-mango-ghost" href="#intro">
                Why mango season
              </a>
            </div>
          </div>

          <div className="mango-hero-center">
            <div className="mango-hero-img-perspective">
              <div ref={tiltRef} className="mango-hero-tilt">
                <div className="mango-hero-glow" aria-hidden />
                <div className="mango-hero-img-wrap">
                  {current && (
                    <img
                      ref={imgRef}
                      src={current.src}
                      alt=""
                      className="mango-hero-img"
                      width={560}
                      height={700}
                      loading="eager"
                      decoding="async"
                    />
                  )}
                </div>
              </div>
            </div>
            {current && (
              <p
                ref={labelRef}
                className="mango-hero-label"
                style={{
                  background: labelBg,
                  color: labelFg,
                  transition: "background 0.45s ease, color 0.45s ease",
                }}
              >
                {current.label}
              </p>
            )}
          </div>

          <nav
            className="mango-hero-accordion"
            aria-label="On this page"
            style={{ color: rightText, transition: "color 0.45s ease" }}
          >
            <a className="mango-hero-accordion-link" href="#memory-game">
              <span className="mango-hero-accordion-label">
                How to play &amp; win
              </span>
              <span className="mango-hero-accordion-plus" aria-hidden>
                +
              </span>
            </a>
            <a className="mango-hero-accordion-link" href="#claim">
              <span className="mango-hero-accordion-label">Claim your code</span>
              <span className="mango-hero-accordion-plus" aria-hidden>
                +
              </span>
            </a>
            <a className="mango-hero-accordion-link" href="#order">
              <span className="mango-hero-accordion-label">Order online</span>
              <span className="mango-hero-accordion-plus" aria-hidden>
                +
              </span>
            </a>
            <a className="mango-hero-accordion-link" href="#intro">
              <span className="mango-hero-accordion-label">Campaign story</span>
              <span className="mango-hero-accordion-plus" aria-hidden>
                +
              </span>
            </a>
          </nav>
        </div>
      </div>
    </section>
  )
}
