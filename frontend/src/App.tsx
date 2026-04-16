import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { ClaimForm } from "./ClaimForm"
import { loadDrinks } from "./loadDrinks"
import { MangoHero } from "./MangoHero"
import { MemoryGame } from "./MemoryGame"
import { siteConfig } from "./config"
import type { DrinkItem } from "./types"
import "./index.css"

function App() {
  const [drinks, setDrinks] = useState<DrinkItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [winToken, setWinToken] = useState<string | null>(null)
  const [headerSolid, setHeaderSolid] = useState(true)

  const onWin = useCallback((token: string) => {
    setWinToken(token)
  }, [])

  useEffect(() => {
    let cancelled = false
    loadDrinks()
      .then((d) => {
        if (!cancelled) setDrinks(d)
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load drink images.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  useLayoutEffect(() => {
    const updateHeader = () => {
      const hero = document.querySelector(".mango-hero-track")
      if (!hero || drinks.length === 0) {
        setHeaderSolid(true)
        return
      }
      const rect = hero.getBoundingClientRect()
      const edge = 80
      const heroCovers =
        rect.bottom > edge && rect.top < window.innerHeight - edge
      setHeaderSolid(!heroCovers)
    }
    updateHeader()
    window.addEventListener("scroll", updateHeader, { passive: true })
    window.addEventListener("resize", updateHeader)
    return () => {
      window.removeEventListener("scroll", updateHeader)
      window.removeEventListener("resize", updateHeader)
    }
  }, [drinks.length])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header
        className={
          headerSolid ? "site-header site-header--solid" : "site-header site-header--hero"
        }
      >
        <div className="site-header-inner">
          <a href="/" className="brand">
            <img
              src={siteConfig.logoSrc}
              width={200}
              height={80}
              alt={siteConfig.brandName}
              className="brand-logo"
            />
          </a>
          <nav className="nav" aria-label="Primary">
            <a href="#memory-game">Game</a>
            <a href="#claim">Claim</a>
            <a href="#order">Order</a>
          </nav>
        </div>
      </header>

      <main id="main" className="campaign-page">
        {loadError && (
          <p className="alert alert-error section">{loadError}</p>
        )}
        {drinks.length > 0 && <MangoHero drinks={drinks} />}

        <section id="intro" className="section intro-section">
          <div className="intro-grid">
            <div>
              <p className="intro-eyebrow">Limited · ~8 weeks</p>
              <h2 className="section-title">The mango menu campaign</h2>
              <p className="muted">
                For the next two months, {siteConfig.brandName} is all-in on mango —
                a dedicated seasonal menu built around ripe fruit, Nanyang comfort,
                and a little play before you pick up. Scroll the hero for the full
                lineup, then try the game for an in-store treat code.
              </p>
            </div>
            <div className="card-elevated card-elevated--campaign">
              <h3>How it works</h3>
              <ol className="steps">
                <li>Scroll through every mango drink in the hero.</li>
                <li>Flip cards in the memory game until every pair matches.</li>
                <li>Claim your code and show it when you order the mango menu.</li>
              </ol>
            </div>
          </div>
        </section>

        {drinks.length > 0 && (
          <MemoryGame drinks={drinks} onWin={onWin} />
        )}

        <ClaimForm winToken={winToken} />

        <section id="order" className="section order-section">
          <h2 className="section-title">Order for delivery</h2>
          <p className="muted">
            Prefer Swiggy or Zomato? Same kitchen — your usual apps.
          </p>
          <div className="order-buttons">
            <a
              className="btn btn-primary"
              href={siteConfig.swiggyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Swiggy
            </a>
            <a
              className="btn btn-ghost"
              href={siteConfig.zomatoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Zomato
            </a>
            <a
              className="btn btn-ghost"
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          © {new Date().getFullYear()} {siteConfig.brandName}. Mango menu
          campaign — limited seasonal run; not affiliated with third-party
          delivery brands.
        </p>
      </footer>
    </>
  )
}

export default App
