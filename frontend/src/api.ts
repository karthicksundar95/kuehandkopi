import { apiBase } from "./config"

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export class ApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = options
  const url = `${apiBase()}${path}`
  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  const data = (await parseJson(res)) as Record<string, unknown> | null
  if (!res.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.message === "string"
          ? data.message
          : res.statusText
    throw new ApiError(res.status, detail || "Request failed")
  }
  return data as T
}

export type GameStartResponse = { session_id: string }

export type GameCompleteResponse = { win_token: string }

export type ClaimResponse = { code: string; message: string }

export const api = {
  gameStart: () =>
    request<GameStartResponse>("/api/game/start", { method: "POST" }),

  gameComplete: (session_id: string) =>
    request<GameCompleteResponse>("/api/game/complete", {
      method: "POST",
      json: { session_id },
    }),

  claim: (body: {
    win_token: string
    name: string
    email: string
    phone?: string
    consent: boolean
  }) =>
    request<ClaimResponse>("/api/claim", { method: "POST", json: body }),
}
