import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiError } from "./api"
import type { DrinkItem } from "./types"

type Card = {
  id: number
  pairId: string
  src: string
  label: string
  flipped: boolean
  matched: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Props = {
  drinks: DrinkItem[]
  onWin: (token: string) => void
}

/** Match all drinks in the manifest (each appears as one pair). */
const MIN_PAIRS = 2

export function MemoryGame({ drinks, onWin }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const completeSent = useRef(false)

  useEffect(() => {
    if (drinks.length < MIN_PAIRS) return
    let id = 0
    const deck: Card[] = []
    drinks.forEach((d) => {
      deck.push({
        id: id++,
        pairId: d.id,
        src: d.src,
        label: d.label,
        flipped: false,
        matched: false,
      })
      deck.push({
        id: id++,
        pairId: d.id,
        src: d.src,
        label: d.label,
        flipped: false,
        matched: false,
      })
    })
    setCards(shuffle(deck))
    setWon(false)
    completeSent.current = false
    setError(null)

    let cancelled = false
    ;(async () => {
      try {
        const { session_id } = await api.gameStart()
        if (!cancelled) setSessionId(session_id)
      } catch (e) {
        if (!cancelled)
          setError(e instanceof ApiError ? e.detail : "Could not start game")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [drinks])

  const flip = useCallback(
    (index: number) => {
      if (busy || won) return
      setCards((prev) => {
        const c = prev[index]
        if (!c || c.matched || c.flipped) return prev
        const next = prev.map((x, i) =>
          i === index ? { ...x, flipped: true } : x,
        )
        const open = next
          .map((x, i) => ({ x, i }))
          .filter(({ x }) => x.flipped && !x.matched)
        if (open.length === 2) {
          setBusy(true)
          const [a, b] = open
          if (a.x.pairId === b.x.pairId) {
            setTimeout(() => {
              setCards((p) =>
                p.map((x) =>
                  x.pairId === a.x.pairId ? { ...x, matched: true } : x,
                ),
              )
              setBusy(false)
            }, 450)
          } else {
            setTimeout(() => {
              setCards((p) =>
                p.map((x, i) =>
                  i === a.i || i === b.i ? { ...x, flipped: false } : x,
                ),
              )
              setBusy(false)
            }, 900)
          }
        }
        return next
      })
    },
    [busy, won],
  )

  useEffect(() => {
    if (cards.length === 0) return
    const all = cards.every((c) => c.matched)
    if (!all || won) return
    if (completeSent.current) return
    completeSent.current = true
    setWon(true)
    ;(async () => {
      if (!sessionId) {
        setError("No session — refresh the page.")
        return
      }
      try {
        const { win_token } = await api.gameComplete(sessionId)
        onWin(win_token)
      } catch (e) {
        setError(e instanceof ApiError ? e.detail : "Could not verify win")
      }
    })()
  }, [cards, won, sessionId, onWin])

  if (drinks.length < MIN_PAIRS) {
    return (
      <section id="memory-game" className="section memory-section">
        <h2>Memory game</h2>
        <p className="muted">
          Add at least {MIN_PAIRS} drinks to{" "}
          <code>public/mango_drinks/manifest.json</code> to enable the game.
        </p>
      </section>
    )
  }

  return (
    <section id="memory-game" className="section memory-section">
      <div className="section-head">
        <p className="intro-eyebrow">Mango menu</p>
        <h2 className="section-title">Match the mango drinks</h2>
        <p className="muted">
          Flip two cards at a time. Match every pair on the seasonal menu to
          unlock your prize claim.
        </p>
      </div>
      {error && <p className="alert alert-error">{error}</p>}
      {won && (
        <p className="alert alert-success">
          You matched every pair — scroll down to claim your treat.
        </p>
      )}
      <div
        className="memory-grid"
        role="grid"
        aria-label="Memory cards"
      >
        {cards.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`memory-card ${c.flipped || c.matched ? "is-face" : "is-back"} ${c.matched ? "is-matched" : ""}`}
            onClick={() => flip(i)}
            disabled={busy || c.matched || c.flipped}
            aria-label={
              c.matched
                ? `Matched ${c.label}`
                : c.flipped
                  ? c.label
                  : "Hidden card"
            }
          >
            <span className="memory-card-inner">
              {c.flipped || c.matched ? (
                <img src={c.src} alt="" className="memory-card-img" />
              ) : (
                <span className="memory-back">K&amp;K</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
