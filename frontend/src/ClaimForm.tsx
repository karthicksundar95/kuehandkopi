import { useState, type FormEvent } from "react"
import { api, ApiError } from "./api"

type Props = {
  winToken: string | null
}

export function ClaimForm({ winToken }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!winToken) {
      setError("Win the memory game first.")
      return
    }
    if (!consent) {
      setError("Please agree to be contacted about this reward.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.claim({
        win_token: winToken,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        consent,
      })
      setCode(res.code)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Claim failed")
    } finally {
      setLoading(false)
    }
  }

  if (code) {
    return (
      <section id="claim" className="section claim-section">
        <div className="claim-success card-elevated">
          <h2>Your redemption code</h2>
          <p className="muted">
            Show this screen at the counter (or screenshot it) to redeem your
            free seasonal item. One use per code.
          </p>
          <div className="code-box" aria-live="polite">
            {code}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void navigator.clipboard.writeText(code)}
          >
            Copy code
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="claim" className="section claim-section">
      <div className="section-head">
        <h2>Claim your freebie</h2>
        <p className="muted">
          After winning, share your details. We will send nothing spammy — only
          what is needed for this reward.
        </p>
      </div>
      {!winToken && (
        <p className="alert alert-warn">
          Complete the memory game above to unlock this form.
        </p>
      )}
      <form className="claim-form card-elevated" onSubmit={onSubmit}>
        {error && <p className="alert alert-error">{error}</p>}
        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Phone (optional)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>I agree to be contacted about this promotion and my reward.</span>
        </label>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !winToken}
        >
          {loading ? "Submitting…" : "Get my code"}
        </button>
      </form>
    </section>
  )
}
