import { memo, useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { Plus, Pencil, Trash2, X, Check, ExternalLink, Settings2, Globe, Zap } from 'lucide-react'

const protocolOptions = [
  { value: 'http', label: 'HTTP' },
  { value: 'tcp', label: 'TCP' },
]

const iconOptions = [
  '\u{1F310}', '\u{1F418}', '\u26A1', '\u{1F433}', '\u{1F3AC}', '\u{1F4E6}',
  '\u{1F4CA}', '\u{1F525}', '\u{1F3E0}', '\u{1F512}', '\u{1F500}', '\u{1F50C}',
  '\u{1F4BB}', '\u{1F4E1}', '\u{1F4F0}', '\u{1F680}', '\u{1F3AF}', '\u{1F527}',
  '\u{1F4F1}', '\u{1F4BD}', '\u{1F3D7}\uFE0F', '\u{1F6E1}\uFE0F', '\u{1F4DD}',
]

function ServiceForm({ initial, onSubmit, onCancel }) {
  const { dark } = useTheme()
  const [form, setForm] = useState(initial || {
    id: '', name: '', icon: '\u{1F50C}', type: 'Custom',
    protocol: 'http', url: 'http://localhost:8080', timeout: 5000,
  })
  const [errors, setErrors] = useState({})

  const validate = useCallback(() => {
    const e = {}
    if (!form.id.trim()) e.id = 'Required'
    if (!form.name.trim()) e.name = 'Required'
    if (!form.url.trim()) e.url = 'Required'
    if (form.protocol === 'http' && !form.url.match(/^https?:\/\//)) e.url = 'Must start with http:// or https://'
    if (form.protocol === 'tcp' && !form.url.includes(':')) e.url = 'Format: host:port'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  const inputCls = clsx(
    'w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all',
    dark ? 'bg-[#252837] border-[#363a4f] text-[#e0e6ff] placeholder-[#5a6180] focus:border-[#6c8cff]' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400'
  )
  const labelCls = clsx('block text-[11px] font-semibold uppercase tracking-wider mb-1.5', dark ? 'text-[#5a6180]' : 'text-gray-400')
  const errCls = 'text-[11px] text-[#f87171] mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Service ID *</label>
          <input className={inputCls} placeholder="my-service" value={form.id}
            onChange={e => setForm(f => ({ ...f, id: e.target.value.replace(/[^a-z0-9-]/g, '') }))}
            disabled={!!initial} />
          {errors.id && <p className={errCls}>{errors.id}</p>}
        </div>
        <div>
          <label className={labelCls}>Display Name *</label>
          <input className={inputCls} placeholder="My Service" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          {errors.name && <p className={errCls}>{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <input className={inputCls} placeholder="Web Server" value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Icon</label>
          <div className="flex items-center gap-2">
            <select className={clsx(inputCls, 'flex-1')} value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
              {iconOptions.map(ic => <option key={ic} value={ic}>{ic} {ic}</option>)}
            </select>
            <span className="text-2xl">{form.icon}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Protocol</label>
          <select className={inputCls} value={form.protocol}
            onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}>
            {protocolOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>URL / Host:Port *</label>
          <input className={inputCls} placeholder={form.protocol === 'http' ? 'http://localhost:8080' : 'localhost:8080'}
            value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          {errors.url && <p className={errCls}>{errors.url}</p>}
        </div>
      </div>

      <div>
        <label className={labelCls}>Timeout (ms)</label>
        <input className={clsx(inputCls, 'w-32')} type="number" min={1000} max={30000} step={1000}
          value={form.timeout} onChange={e => setForm(f => ({ ...f, timeout: parseInt(e.target.value) || 5000 }))} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all', 'bg-gradient-to-r from-[#6c8cff] to-[#a78bfa] hover:from-[#5a7aee] hover:to-[#9680e8] shadow-lg shadow-blue-500/20 active:scale-[0.98]')}>
          <Check size={14} /> {initial ? 'Update' : 'Add Service'}
        </button>
        <button type="button" onClick={onCancel} className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-all', dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default memo(function ServiceManager({ onClose }) {
  const { dark } = useTheme()
  const [configured, setConfigured] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')
  const [token] = useState(() => localStorage.getItem('dashboard_token'))

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services/config', { headers: authHeaders })
      const data = await res.json()
      setConfigured(data)
    } catch { setError('Failed to load services') }
    setLoading(false)
  }, [token])

  useEffect(() => { fetchServices() }, [fetchServices])

  const handleAdd = async (form) => {
    setError('')
    try {
      const res = await fetch('/api/services', { method: 'POST', headers: authHeaders, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setMode('list')
      fetchServices()
    } catch { setError('Failed to add service') }
  }

  const handleUpdate = async (form) => {
    setError('')
    try {
      const res = await fetch(`/api/services/${editing.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setMode('list')
      setEditing(null)
      fetchServices()
    } catch { setError('Failed to update service') }
  }

  const handleDelete = async (id) => {
    setError('')
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE', headers: authHeaders })
      if (!res.ok) { const d = await res.json(); setError(d.error); return }
      setDeleting(null)
      fetchServices()
    } catch { setError('Failed to remove service') }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={clsx('relative w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col animate-scale-in',
        dark ? 'bg-[#111318] border-[#252837]' : 'bg-white border-gray-200'
      )} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b shrink-0', dark ? 'border-[#252837]' : 'border-gray-200')}>
          <div className="flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', dark ? 'bg-[#6c8cff]/12 text-[#6c8cff]' : 'bg-blue-50 text-blue-500')}>
              <Settings2 size={18} />
            </div>
            <div>
              <h2 className={clsx('font-bold', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>Manage Services</h2>
              <p className={clsx('text-xs', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{configured.length} configured</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'list' && (
              <button onClick={() => setMode('add')} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', 'bg-[#6c8cff] text-white hover:bg-[#5a7aee]')}>
                <Plus size={14} /> Add Service
              </button>
            )}
            <button onClick={onClose} className={clsx('p-2 rounded-xl transition-colors', dark ? 'text-[#5a6180] hover:text-[#a0a8c8] hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-sm">
              {error}
            </div>
          )}

          {mode === 'add' && (
            <ServiceForm onSubmit={handleAdd} onCancel={() => { setMode('list'); setError('') }} />
          )}

          {mode === 'edit' && editing && (
            <ServiceForm initial={editing} onSubmit={handleUpdate} onCancel={() => { setMode('list'); setEditing(null); setError('') }} />
          )}

          {mode === 'list' && (
            <div className="space-y-2">
              {loading && <p className={clsx('text-sm text-center py-8', dark ? 'text-[#5a6180]' : 'text-gray-400')}>Loading...</p>}
              {!loading && configured.length === 0 && (
                <div className="text-center py-12">
                  <Globe size={40} className={clsx('mx-auto mb-3', dark ? 'text-[#5a6180]' : 'text-gray-300')} />
                  <p className={clsx('text-sm', dark ? 'text-[#5a6180]' : 'text-gray-400')}>No services configured</p>
                  <p className={clsx('text-xs mt-1', dark ? 'text-[#5a6180]/60' : 'text-gray-300')}>Click "Add Service" to monitor your first service</p>
                </div>
              )}
              {configured.map(svc => (
                <div key={svc.id} className={clsx('flex items-center gap-3 p-3 rounded-xl border transition-colors group',
                  dark ? 'border-[#252837] hover:border-[#363a4f] hover:bg-white/[0.02]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50',
                  deleting === svc.id && 'border-[#f87171]/40 bg-[#f87171]/5'
                )}>
                  <span className="text-xl shrink-0">{svc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx('font-semibold text-sm', dark ? 'text-[#e0e6ff]' : 'text-gray-900')}>{svc.name}</span>
                      <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', dark ? 'bg-[#252837] text-[#5a6180]' : 'bg-gray-100 text-gray-400')}>{svc.type}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={clsx('text-[11px] font-mono', dark ? 'text-[#5a6180]' : 'text-gray-400')}>{svc.url}</span>
                      <span className={clsx('text-[10px] px-1 py-0.5 rounded uppercase font-bold', svc.protocol === 'http' ? 'bg-[#6c8cff]/12 text-[#6c8cff]' : 'bg-[#a78bfa]/12 text-[#a78bfa]')}>{svc.protocol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={svc.url} target="_blank" rel="noopener noreferrer" className={clsx('p-1.5 rounded-lg transition-colors', dark ? 'text-[#5a6180] hover:text-[#6c8cff] hover:bg-[#6c8cff]/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50')}>
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => { setEditing(svc); setMode('edit') }} className={clsx('p-1.5 rounded-lg transition-colors', dark ? 'text-[#5a6180] hover:text-[#fb923c] hover:bg-[#fb923c]/10' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50')}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleting(deleting === svc.id ? null : svc.id)} className={clsx('p-1.5 rounded-lg transition-colors', dark ? 'text-[#5a6180] hover:text-[#f87171] hover:bg-[#f87171]/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {deleting === svc.id && (
                    <div className="flex items-center gap-1 shrink-0 animate-fade-in">
                      <span className={clsx('text-[11px] mr-1', dark ? 'text-[#f87171]' : 'text-red-500')}>Remove?</span>
                      <button onClick={() => handleDelete(svc.id)} className={clsx('p-1 rounded-lg', 'bg-[#f87171]/15 text-[#f87171] hover:bg-[#f87171]/25')}>
                        <Check size={12} />
                      </button>
                      <button onClick={() => setDeleting(null)} className={clsx('p-1 rounded-lg', dark ? 'text-[#5a6180] hover:bg-white/[0.05]' : 'text-gray-400 hover:bg-gray-100')}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
