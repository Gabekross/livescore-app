'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast        from 'react-hot-toast'

type RequestStatus = 'open' | 'in_review' | 'resolved'

interface SupportRequest {
  id:              string
  organization_id: string
  requester_id:    string | null
  requester_email: string | null
  subject:         string
  message:         string
  status:          RequestStatus
  created_at:      string
  organization?:   { name: string; slug: string; public_site_enabled: boolean } | null
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  open:      'Open',
  in_review: 'In Review',
  resolved:  'Resolved',
}

export default function PlatformSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('support_requests')
      .select(`
        id, organization_id, requester_id, requester_email, subject, message, status, created_at,
        organization:organization_id(name, slug, public_site_enabled)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(`Could not load support requests: ${error.message}`)
      setRequests([])
    } else {
      setRequests(((data || []) as unknown as SupportRequest[]).map((req) => ({
        ...req,
        organization: Array.isArray(req.organization) ? req.organization[0] : req.organization,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function updateStatus(id: string, status: RequestStatus) {
    setSavingId(id)
    const { error } = await supabase
      .from('support_requests')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast.error(`Could not update request: ${error.message}`)
    } else {
      toast.success('Support request updated')
      fetchRequests()
    }
    setSavingId(null)
  }

  const cardStyle: React.CSSProperties = {
    background: '#141420',
    border: '1px solid #1e1e2e',
    borderRadius: 10,
    padding: '1rem 1.25rem',
  }

  const counts = {
    open: requests.filter((r) => r.status === 'open').length,
    in_review: requests.filter((r) => r.status === 'in_review').length,
    resolved: requests.filter((r) => r.status === 'resolved').length,
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0ff', marginBottom: '0.25rem' }}>
        Support Requests
      </h1>
      <p style={{ fontSize: '0.85rem', color: '#8888aa', marginBottom: '1.5rem' }}>
        Messages submitted by organization admins when their workspace is paused.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <Metric label="Open" value={counts.open} tone="#fbbf24" />
        <Metric label="In Review" value={counts.in_review} tone="#60a5fa" />
        <Metric label="Resolved" value={counts.resolved} tone="#34d399" />
      </div>

      {loading ? (
        <p style={{ color: '#8888aa' }}>Loading...</p>
      ) : requests.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ margin: 0, color: '#8888aa', fontSize: '0.86rem' }}>
            No support requests yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map((req) => {
            const org = req.organization
            return (
              <article key={req.id} style={cardStyle}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{ minWidth: 220, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <StatusBadge status={req.status} />
                      {org && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: org.public_site_enabled ? '#86efac' : '#fbbf24',
                        }}>
                          {org.public_site_enabled ? 'Site On' : 'Site Paused'}
                        </span>
                      )}
                    </div>
                    <h2 style={{ margin: 0, color: '#f0f0ff', fontSize: '0.98rem', fontWeight: 800 }}>
                      {req.subject}
                    </h2>
                    <p style={{ margin: '0.25rem 0 0', color: '#777799', fontSize: '0.76rem' }}>
                      {org ? `${org.name} / ${org.slug}` : 'Unknown organization'}
                      {req.requester_email ? ` · ${req.requester_email}` : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                      value={req.status}
                      disabled={savingId === req.id}
                      onChange={(e) => updateStatus(req.id, e.target.value as RequestStatus)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        background: '#0a0a14',
                        border: '1px solid #2a2a3e',
                        borderRadius: 6,
                        color: '#c8c8e0',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <span style={{ color: '#555566', fontSize: '0.72rem' }}>
                      {new Date(req.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div style={{
                  whiteSpace: 'pre-wrap',
                  color: '#c8c8e0',
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  background: '#0f0f19',
                  border: '1px solid #24243a',
                  borderRadius: 8,
                  padding: '0.85rem',
                }}>
                  {req.message}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{
      background: '#141420',
      border: '1px solid #1e1e2e',
      borderRadius: 10,
      padding: '0.85rem 1rem',
    }}>
      <div style={{ color: '#777799', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ color: tone, fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const colors: Record<RequestStatus, { bg: string; fg: string }> = {
    open:      { bg: 'rgba(251,191,36,0.12)', fg: '#fbbf24' },
    in_review: { bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
    resolved:  { bg: 'rgba(52,211,153,0.12)', fg: '#34d399' },
  }
  const color = colors[status]

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      background: color.bg,
      color: color.fg,
      fontSize: '0.68rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
