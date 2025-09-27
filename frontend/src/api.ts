import type { ExtractResponse, RequestForm, RequestStatus } from './types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>
  }
  // @ts-expect-error generic non-json
  return res.text()
}

export async function extractFromPdf(file: File): Promise<ExtractResponse> {
  const form = new FormData()
  form.append('file', file)
  return http<ExtractResponse>('/api/requests/extract', {
    method: 'POST',
    body: form,
  })
}

export async function extractFromText(text: string): Promise<ExtractResponse> {
  return http<ExtractResponse>('/api/requests/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

export async function createRequest(data: RequestForm): Promise<RequestForm> {
  return http<RequestForm>('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function listRequests(): Promise<RequestForm[]> {
  return http<RequestForm[]>('/api/requests')
}

export async function getRequest(id: string): Promise<RequestForm> {
  return http<RequestForm>(`/api/requests/${id}`)
}

export async function updateRequest(
  id: string,
  data: Partial<RequestForm>
): Promise<RequestForm> {
  return http<RequestForm>(`/api/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function changeStatus(
  id: string,
  status: RequestStatus
): Promise<RequestForm> {
  return updateRequest(id, { status })
}

export async function deleteRequest(id: string): Promise<RequestForm> {
  return http<RequestForm>(`/api/requests/${id}`, {
    method: 'DELETE',
  })
}

const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function listCommodityGroups() {
  const r = await fetch(`${base}/api/commodity-groups`)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

// Requests endpoints already return commodityGroup nested (no change needed)
