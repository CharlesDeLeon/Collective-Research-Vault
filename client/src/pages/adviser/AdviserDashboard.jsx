import React, { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

const AdviserDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/coordinator/dashboard')
      setStats(res.data?.data || null)
    } catch (e) {
      console.error(e)
      setError('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const cards = stats ? [
    { label: 'Total Groups', value: stats.total_groups },
    { label: 'Total Submissions', value: stats.total_submissions },
    { label: 'Pending Review', value: stats.pending_review },
    { label: 'Published', value: stats.published },
  ] : []

  return (
    <div>
      <h1 style={styles.title}>Adviser Dashboard</h1>
      <p style={styles.subtitle}>Overview of your groups, submissions, and reviews.</p>

      {loading && <div style={styles.state}>Loading…</div>}
      {error && <div style={styles.state}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={styles.cardGrid}>
            {cards.map(c => (
              <div key={c.label} style={styles.card}>
                <div style={styles.cardValue}>{c.value ?? 0}</div>
                <div style={styles.cardLabel}>{c.label}</div>
              </div>
            ))}
          </div>

          {stats?.by_status?.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Submissions by Status</h2>
              <div style={styles.list}>
                {stats.by_status.map(s => (
                  <div key={s.status} style={styles.listRow}>
                    <span>{s.status}</span>
                    <span style={styles.badge}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.recent_activity?.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Recent Activity</h2>
              <div style={styles.list}>
                {stats.recent_activity.map(r => (
                  <div key={r.submission_id} style={styles.listRow}>
                    <div>
                      <div style={styles.rowTitle}>{r.title}</div>
                      <div style={styles.rowMeta}>{r.group_name} · {r.stage} · {r.status}</div>
                    </div>
                    <div style={styles.rowDate}>{new Date(r.updated_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  title: { fontSize: '1.6rem', fontWeight: 700, margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: '4px', marginBottom: '1.5rem' },
  state: { padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.25rem' },
  cardValue: { fontSize: '2rem', fontWeight: 700, color: '#FFBE4F' },
  cardLabel: { fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' },
  section: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  badge: { background: 'rgba(255,190,79,0.2)', color: '#FFBE4F', padding: '2px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 },
  rowTitle: { fontWeight: 600, fontSize: '0.95rem' },
  rowMeta: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' },
  rowDate: { fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' },
}

export default AdviserDashboard