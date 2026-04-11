export async function fetchText(url: string): Promise<string> {
  try {
    const direct = await fetch(url)
    if (direct.ok) return await direct.text()
  } catch {
    // Fall back to a lightweight proxy when direct fetch is blocked.
  }

  const proxied = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  if (!proxied.ok) throw new Error(`Request failed for ${url}`)
  return await proxied.text()
}

export async function fetchJson<T>(url: string): Promise<T> {
  try {
    const direct = await fetch(url)
    if (direct.ok) return await direct.json()
  } catch {
    // Fall back to a lightweight proxy when direct fetch is blocked.
  }

  const proxied = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  if (!proxied.ok) throw new Error(`Request failed for ${url}`)
  return await proxied.json()
}
