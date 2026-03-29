import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'music-tracker-v1'
const SECTIONS = ['Hook', 'Verse', 'Bridge', 'Outro', 'Intro', 'Other']
const STATUS_ORDER = ['todo', 'in-progress', 'done']

const STATUS_LABELS = { todo: 'Todo', 'in-progress': 'In Progress', done: 'Done' }
const STATUS_COLORS = { todo: '#94a3b8', 'in-progress': '#facc15', done: '#4ade80' }

const COLUMN_COLORS = {
  todo: 'rgba(148,163,184,0.15)',
  'in-progress': 'rgba(250,204,21,0.12)',
  done: 'rgba(74,222,128,0.12)',
}

const DEFAULT_INSTRUMENTS = {
  Drums: ['Kick', 'Snare', 'Closed Hat', 'Open Hat', 'Clap', 'Crash', 'Tom'],
  Bass: ['808', 'Sub Bass', 'Acoustic Bass'],
  Keys: ['Piano', 'Rhodes', 'Synth Pad', 'Organ'],
  Melody: ['Lead Synth', 'Strings', 'Flute', 'Guitar'],
  Vocals: ['Lead', 'Harmony', 'Ad-lib', 'Sample'],
  FX: ['Riser', 'Downlifter', 'Atmosphere'],
}

const INST_COLOR = '#2dd4bf'

const ROLES = [
  'Lead', 'Counter-Melody', 'Harmony', 'Pad',
  'Call', 'Response',
  'Pulse', 'Groove', 'Ostinato', 'Accent',
  'Foundation', 'Melodic Bass', 'Sub Layer',
  'Atmosphere', 'Texture', 'Drone', 'Ear Candy',
  'Riff', 'Hook', 'Transition', 'Fill',
  'Foreground', 'Midground', 'Background',
]

function buildInitial() {
  return { projects: [], tasks: {}, instruments: {} }
}

function deepCopyInstruments(src) {
  const out = {}
  for (const [cat, subs] of Object.entries(src)) out[cat] = [...subs]
  return out
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block', color: '#64748b', fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 6,
}

const sectionLabelStyle = {
  color: '#64748b', fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
}

const inputStyle = {
  display: 'block', width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '8px 12px', color: '#e2e8f0',
  fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none',
}

const badgeBase = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20,
  fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
  border: '1px solid',
}

const sectionBadgeStyle = {
  ...badgeBase, color: '#a78bfa',
  borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.1)',
}

const instBadgeStyle = {
  ...badgeBase, color: INST_COLOR,
  borderColor: `${INST_COLOR}44`, background: `${INST_COLOR}15`,
}

const primaryBtnStyle = {
  padding: '7px 18px', borderRadius: 6, fontSize: 13,
  fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, cursor: 'pointer',
  background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
  border: 'none', color: '#0c0e14',
}

const cancelBtnStyle = {
  padding: '7px 18px', borderRadius: 6, fontSize: 13,
  fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
  background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8',
}

const ghostBtnStyle = {
  background: 'none', border: '1px solid rgba(255,255,255,0.08)',
  color: '#64748b', cursor: 'pointer', borderRadius: 6,
  padding: '4px 10px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
}

// ─── ManageInstrumentsModal ──────────────────────────────────────────────────

function ManageInstrumentsModal({ instruments, onClose, onSave }) {
  const [draft, setDraft] = useState(() => deepCopyInstruments(instruments))
  const [newCat, setNewCat] = useState('')
  const [newSubs, setNewSubs] = useState({}) // { catName: inputValue }

  const addCategory = () => {
    const name = newCat.trim()
    if (!name || draft[name]) return
    setDraft((d) => ({ ...d, [name]: [] }))
    setNewCat('')
  }

  const removeCategory = (cat) => {
    setDraft((d) => {
      const next = { ...d }
      delete next[cat]
      return next
    })
  }

  const addSub = (cat) => {
    const sub = (newSubs[cat] || '').trim()
    if (!sub || draft[cat].includes(sub)) return
    setDraft((d) => ({ ...d, [cat]: [...d[cat], sub] }))
    setNewSubs((s) => ({ ...s, [cat]: '' }))
  }

  const removeSub = (cat, sub) => {
    setDraft((d) => ({ ...d, [cat]: d[cat].filter((s) => s !== sub) }))
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#13151f', borderRadius: 12, padding: '28px 32px', width: 560, maxWidth: '92vw', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 17, fontFamily: 'JetBrains Mono, monospace' }}>Manage Instruments</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {Object.entries(draft).map(([cat, subs]) => (
          <div key={cat} style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: INST_COLOR, fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
                {cat.toUpperCase()}
              </span>
              <button
                onClick={() => removeCategory(cat)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '2px 6px' }}
              >
                Remove category
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {subs.map((sub) => (
                <span key={sub} style={{ ...instBadgeStyle, gap: 5 }}>
                  {sub}
                  <button
                    onClick={() => removeSub(cat, sub)}
                    style={{ background: 'none', border: 'none', color: `${INST_COLOR}99`, cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}
                  >×</button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newSubs[cat] || ''}
                onChange={(e) => setNewSubs((s) => ({ ...s, [cat]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addSub(cat)}
                placeholder={`Add sound to ${cat}…`}
                style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '6px 10px' }}
              />
              <button onClick={() => addSub(cat)} style={{ ...primaryBtnStyle, padding: '6px 14px', fontSize: 12 }}>Add</button>
            </div>
          </div>
        ))}

        {/* Add new category */}
        <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ ...sectionLabelStyle, marginBottom: 8 }}>NEW CATEGORY</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="e.g. Synth, Perc, Sample…"
              style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '6px 10px' }}
            />
            <button onClick={addCategory} style={{ ...primaryBtnStyle, padding: '6px 14px', fontSize: 12 }}>Add</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button onClick={() => { onSave(draft); onClose() }} style={primaryBtnStyle}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── InstrumentPicker ────────────────────────────────────────────────────────

function InstrumentPicker({ instruments, sounds, onChange }) {
  const [activeCategory, setActiveCategory] = useState(null)
  const categories = Object.keys(instruments)

  const isSelected = (cat, sub) => sounds.some((s) => s.category === cat && s.sub === sub)

  const toggle = (cat, sub) => {
    if (isSelected(cat, sub)) {
      onChange(sounds.filter((s) => !(s.category === cat && s.sub === sub)))
    } else {
      onChange([...sounds, { category: cat, sub, role: '' }])
    }
  }

  const remove = (cat, sub) => onChange(sounds.filter((s) => !(s.category === cat && s.sub === sub)))

  const setRole = (cat, sub, role) =>
    onChange(sounds.map((s) => s.category === cat && s.sub === sub ? { ...s, role } : s))

  return (
    <div>
      {/* Selected sounds */}
      {sounds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {sounds.map((s) => (
            <span key={`${s.category}-${s.sub}`} style={{ ...instBadgeStyle, gap: 5, alignItems: 'center' }}>
              <span>{s.category}: {s.sub}</span>
              <select
                value={s.role || ''}
                onChange={(e) => { e.stopPropagation(); setRole(s.category, s.sub, e.target.value) }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'transparent', border: 'none', color: s.role ? INST_COLOR : `${INST_COLOR}66`, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, cursor: 'pointer', outline: 'none', padding: '0 2px', maxWidth: 110 }}
              >
                <option value="">role…</option>
                {ROLES.map((r) => <option key={r} value={r} style={{ background: '#13151f', color: '#e2e8f0' }}>{r}</option>)}
              </select>
              <button
                onClick={(e) => { e.stopPropagation(); remove(s.category, s.sub) }}
                style={{ background: 'none', border: 'none', color: `${INST_COLOR}99`, cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}
              >×</button>
            </span>
          ))}
        </div>
      )}

      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: activeCategory ? 8 : 0 }}>
        {categories.map((cat) => {
          const selectedInCat = sounds.filter((s) => s.category === cat).length
          return (
            <button
              key={cat}
              onClick={(e) => { e.stopPropagation(); setActiveCategory(activeCategory === cat ? null : cat) }}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', border: '1px solid',
                borderColor: activeCategory === cat ? INST_COLOR : 'rgba(255,255,255,0.1)',
                background: activeCategory === cat ? `${INST_COLOR}18` : 'transparent',
                color: activeCategory === cat ? INST_COLOR : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {cat}{selectedInCat > 0 ? ` (${selectedInCat})` : ''}
            </button>
          )
        })}
      </div>

      {/* Sub-category pills */}
      {activeCategory && instruments[activeCategory] && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {instruments[activeCategory].map((sub) => {
            const selected = isSelected(activeCategory, sub)
            return (
              <button
                key={sub}
                onClick={(e) => { e.stopPropagation(); toggle(activeCategory, sub) }}
                style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', border: '1px solid',
                  borderColor: selected ? INST_COLOR : 'rgba(255,255,255,0.12)',
                  background: selected ? `${INST_COLOR}22` : 'transparent',
                  color: selected ? INST_COLOR : '#94a3b8',
                  transition: 'all 0.15s',
                }}
              >
                {selected ? '✓ ' : ''}{sub}
              </button>
            )
          })}
          {instruments[activeCategory].length === 0 && (
            <span style={{ color: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>No sounds yet — add them in Manage Instruments</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SoundPalette ────────────────────────────────────────────────────────────

function SoundPalette({ tasks, instruments }) {
  const [open, setOpen] = useState(false)

  // Aggregate all sounds used across tasks, keyed by "cat::sub::role"
  const counts = {} // "cat::sub::role" -> count
  for (const task of tasks) {
    for (const s of (task.sounds || [])) {
      const key = `${s.category}::${s.sub}::${s.role || ''}`
      counts[key] = (counts[key] || 0) + 1
    }
  }

  const usedCategories = Object.keys(instruments).filter((cat) =>
    (instruments[cat] || []).some((sub) =>
      Object.keys(counts).some((k) => k.startsWith(`${cat}::${sub}::`))
    )
  )

  if (usedCategories.length === 0 && !open) return null

  return (
    <div style={{ marginBottom: 18, borderRadius: 8, border: '1px solid rgba(45,212,191,0.15)', background: 'rgba(45,212,191,0.04)' }}>
      <button
        onClick={() => setOpen((x) => !x)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: INST_COLOR, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', fontWeight: 700 }}>
          SOUND PALETTE
        </span>
        <span style={{ color: '#475569', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {usedCategories.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
              No instruments tagged on tasks yet.
            </p>
          ) : (
            usedCategories.map((cat) => {
              // Collect unique sub+role combos for this category
              const entries = Object.entries(counts)
                .filter(([k]) => k.startsWith(`${cat}::`))
                .map(([k, n]) => { const [, sub, role] = k.split('::'); return { sub, role, n } })
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: INST_COLOR, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, minWidth: 60, paddingTop: 3 }}>
                    {cat}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {entries.map(({ sub, role, n }) => (
                      <span key={`${sub}-${role}`} style={{ ...instBadgeStyle, gap: 4 }}>
                        {sub}{role ? <span style={{ color: `${INST_COLOR}88` }}> · {role}</span> : null}
                        <span style={{ color: `${INST_COLOR}66`, fontSize: 9 }}>×{n}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── AddTaskModal ────────────────────────────────────────────────────────────

function AddTaskModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [why, setWhy] = useState('')
  const [section, setSection] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), why: why.trim(), section })
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#13151f', borderRadius: 12, padding: '28px 32px', width: 480, maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, fontFamily: 'JetBrains Mono, monospace' }}>New Task</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>TITLE</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Create drum pattern for Hook #1"
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 16 }}>WHY / INSPIRATION</label>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="What's the creative spark or intention behind this step?"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
          />

          <label style={{ ...labelStyle, marginTop: 16 }}>SECTION TAG</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {['', ...SECTIONS].map((s) => (
              <button
                key={s || 'none'}
                type="button"
                onClick={() => setSection(s)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', border: '1px solid',
                  borderColor: section === s ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                  background: section === s ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: section === s ? '#a78bfa' : '#94a3b8', transition: 'all 0.15s',
                }}
              >
                {s || 'None'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={!title.trim()} style={{ ...primaryBtnStyle, opacity: title.trim() ? 1 : 0.4, cursor: title.trim() ? 'pointer' : 'not-allowed' }}>
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── TaskCard ────────────────────────────────────────────────────────────────

function TaskCard({ task, instruments, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [reflection, setReflection] = useState(task.reflection || '')
  const [dragging, setDragging] = useState(false)

  const handleReflectionBlur = () => {
    if (reflection !== task.reflection) onUpdate(task.id, { reflection })
  }

  const cycleStatus = (e, newStatus) => {
    e.stopPropagation()
    onUpdate(task.id, { status: newStatus })
  }

  const sounds = task.sounds || []

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); setDragging(true) }}
      onDragEnd={() => setDragging(false)}
      onClick={() => setExpanded((x) => !x)}
      style={{ background: '#13151f', borderRadius: 8, padding: '14px 16px', marginBottom: 8, cursor: 'grab', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.15s, opacity 0.15s', opacity: dragging ? 0.4 : 1 }}
      onMouseEnter={(e) => { if (!dragging) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
          {task.title}
        </span>
        <span style={{ color: '#94a3b8', fontSize: 11, flexShrink: 0, marginTop: 1 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {task.section && <span style={sectionBadgeStyle}>{task.section}</span>}
        <span style={{ ...badgeBase, color: STATUS_COLORS[task.status], borderColor: STATUS_COLORS[task.status] + '44', background: STATUS_COLORS[task.status] + '18' }}>
          {STATUS_LABELS[task.status]}
        </span>
        {sounds.map((s) => (
          <span key={`${s.category}-${s.sub}`} style={instBadgeStyle}>
            {s.category}: {s.sub}{s.role ? <span style={{ color: `${INST_COLOR}88` }}> · {s.role}</span> : null}
          </span>
        ))}
      </div>

      {/* Why preview (collapsed) */}
      {!expanded && task.why && (
        <p style={{ color: '#64748b', fontSize: 12, margin: '8px 0 0', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5 }}>
          {task.why.length > 90 ? task.why.slice(0, 90) + '…' : task.why}
        </p>
      )}

      {/* Expanded body */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 14 }}>
          {task.why && (
            <>
              <div style={sectionLabelStyle}>WHY / INSPIRATION</div>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '6px 0 14px', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
                {task.why}
              </p>
            </>
          )}

          {/* Instruments */}
          <div style={sectionLabelStyle}>INSTRUMENTS</div>
          <div style={{ marginTop: 8, marginBottom: 14 }}>
            <InstrumentPicker
              instruments={instruments}
              sounds={sounds}
              onChange={(newSounds) => onUpdate(task.id, { sounds: newSounds })}
            />
          </div>

          <div style={sectionLabelStyle}>REFLECTION</div>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            onBlur={handleReflectionBlur}
            placeholder="How did it go? What did you learn or discover?"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 72, marginTop: 6, fontSize: 12 }}
          />

          {/* Status buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={(e) => cycleStatus(e, s)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', border: '1px solid',
                  borderColor: task.status === s ? STATUS_COLORS[s] : 'rgba(255,255,255,0.1)',
                  background: task.status === s ? STATUS_COLORS[s] + '22' : 'transparent',
                  color: task.status === s ? STATUS_COLORS[s] : '#64748b', transition: 'all 0.15s',
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TaskColumn ──────────────────────────────────────────────────────────────

function TaskColumn({ status, tasks, instruments, onUpdateTask }) {
  const [dragOver, setDragOver] = useState(false)
  const color = STATUS_COLORS[status]

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onUpdateTask(taskId, { status })
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragEnter={() => setDragOver(true)}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
      onDrop={handleDrop}
      style={{ flex: 1, minWidth: 0, background: COLUMN_COLORS[status], borderRadius: 10, padding: '14px 12px', border: `1px solid ${dragOver ? color + '66' : 'rgba(255,255,255,0.05)'}`, transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: dragOver ? `0 0 0 2px ${color}22` : 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color, fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          {STATUS_LABELS[status].toUpperCase()}
        </span>
        <span style={{ background: color + '33', color, borderRadius: 10, padding: '1px 8px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p style={{ color: dragOver ? color + 'aa' : 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', marginTop: 32, transition: 'color 0.15s' }}>
          {dragOver ? 'Drop here' : 'No tasks yet'}
        </p>
      ) : (
        tasks.map((t) => <TaskCard key={t.id} task={t} instruments={instruments} onUpdate={onUpdateTask} />)
      )}
    </div>
  )
}

// ─── ProjectDetail ───────────────────────────────────────────────────────────

function ProjectDetail({ project, tasks, instruments, onAddTask, onUpdateTask, onUpdateInstruments, onBack }) {
  const [sectionFilter, setSectionFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  const filtered = sectionFilter ? tasks.filter((t) => t.section === sectionFilter) : tasks
  const byStatus = (s) => filtered.filter((t) => t.status === s)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', cursor: 'pointer', borderRadius: 6, padding: '6px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, flex: 1 }}>
          {project.name}
        </h2>
        <button
          onClick={() => setManageOpen(true)}
          style={{ ...ghostBtnStyle, color: INST_COLOR, borderColor: `${INST_COLOR}33` }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${INST_COLOR}66` }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${INST_COLOR}33` }}
        >
          Instruments ⚙
        </button>
        <span style={{ ...badgeBase, color: project.status === 'active' ? '#4ade80' : '#64748b', borderColor: project.status === 'active' ? '#4ade8044' : '#64748b44', background: project.status === 'active' ? '#4ade8018' : '#64748b18', fontSize: 11, fontWeight: 700 }}>
          {project.status.toUpperCase()}
        </span>
      </div>

      {/* Sound palette */}
      <SoundPalette tasks={tasks} instruments={instruments} />

      {/* Filter row + add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', ...SECTIONS].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setSectionFilter(s)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', border: '1px solid',
                borderColor: sectionFilter === s ? '#a78bfa' : 'rgba(255,255,255,0.1)',
                background: sectionFilter === s ? 'rgba(167,139,250,0.15)' : 'transparent',
                color: sectionFilter === s ? '#a78bfa' : '#64748b', transition: 'all 0.15s',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <button onClick={() => setModalOpen(true)} style={primaryBtnStyle}>+ Add Task</button>
      </div>

      {/* Columns */}
      <div style={{ display: 'flex', gap: 12 }}>
        {STATUS_ORDER.map((s) => (
          <TaskColumn key={s} status={s} tasks={byStatus(s)} instruments={instruments} onUpdateTask={onUpdateTask} />
        ))}
      </div>

      {modalOpen && <AddTaskModal onClose={() => setModalOpen(false)} onAdd={onAddTask} />}
      {manageOpen && (
        <ManageInstrumentsModal
          instruments={instruments}
          onClose={() => setManageOpen(false)}
          onSave={onUpdateInstruments}
        />
      )}
    </div>
  )
}

// ─── AddProjectInline ────────────────────────────────────────────────────────

function AddProjectInline({ onAdd }) {
  const [value, setValue] = useState('')
  const [active, setActive] = useState(false)

  const submit = () => {
    if (!value.trim()) return
    onAdd(value.trim())
    setValue('')
    setActive(false)
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 18px', borderRadius: 10, border: `1px dashed ${active ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(167,139,250,0.05)' : 'transparent', transition: 'all 0.15s' }}>
      <span style={{ color: '#a78bfa', fontSize: 18, lineHeight: 1 }}>+</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setActive(true)}
        onBlur={() => { if (!value.trim()) setActive(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setValue(''); setActive(false) } }}
        placeholder="New project name…"
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}
      />
      {active && value.trim() && (
        <button onClick={submit} style={{ ...primaryBtnStyle, padding: '5px 14px', fontSize: 12 }}>Add</button>
      )}
    </div>
  )
}

// ─── ProjectCard ─────────────────────────────────────────────────────────────

function ProjectCard({ project, taskCount, doneCount, onSelect, onToggleArchive }) {
  const progress = taskCount > 0 ? doneCount / taskCount : 0
  return (
    <div
      style={{ background: '#13151f', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
      onClick={() => onSelect(project.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, fontFamily: 'JetBrains Mono, monospace' }}>{project.name}</span>
        <span style={{ ...badgeBase, color: project.status === 'active' ? '#4ade80' : '#64748b', borderColor: project.status === 'active' ? '#4ade8044' : '#64748b44', background: project.status === 'active' ? '#4ade8018' : '#64748b18', fontSize: 10, fontWeight: 700 }}>
          {project.status.toUpperCase()}
        </span>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
            {taskCount === 0 ? 'No tasks yet' : `${doneCount} / ${taskCount} done`}
          </span>
          {taskCount > 0 && <span style={{ color: '#4ade80', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(progress * 100)}%</span>}
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, width: `${progress * 100}%`, background: 'linear-gradient(90deg, #a78bfa, #4ade80)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleArchive(project.id) }}
          style={ghostBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          {project.status === 'active' ? 'Archive' : 'Unarchive'}
        </button>
        <span style={{ color: '#a78bfa', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>Open →</span>
      </div>
    </div>
  )
}

// ─── ProjectList ─────────────────────────────────────────────────────────────

function ProjectList({ projects, tasks, onSelect, onAdd, onToggleArchive }) {
  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status === 'archived')
  const taskCount = (id) => (tasks[id] || []).length
  const doneCount = (id) => (tasks[id] || []).filter((t) => t.status === 'done').length

  return (
    <div>
      <AddProjectInline onAdd={onAdd} />
      {projects.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', marginTop: 48 }}>
          No projects yet. Add one above to get started.
        </p>
      )}
      {active.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10 }}>ACTIVE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map((p) => <ProjectCard key={p.id} project={p} taskCount={taskCount(p.id)} doneCount={doneCount(p.id)} onSelect={onSelect} onToggleArchive={onToggleArchive} />)}
          </div>
        </div>
      )}
      {archived.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 10 }}>ARCHIVED</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {archived.map((p) => <ProjectCard key={p.id} project={p} taskCount={taskCount(p.id)} doneCount={doneCount(p.id)} onSelect={onSelect} onToggleArchive={onToggleArchive} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MusicTracker (root) ──────────────────────────────────────────────────────

export default function MusicTracker() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY)
        if (result?.value) {
          const loaded = JSON.parse(result.value)
          // migrate: ensure instruments map exists
          if (!loaded.instruments) loaded.instruments = {}
          setData(loaded)
        } else {
          setData(buildInitial())
        }
      } catch {
        setData(buildInitial())
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const persist = useCallback((d) => {
    setSaving(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(d)) }
      catch (e) { console.error('Save failed:', e) }
      setSaving(false)
    }, 500)
  }, [])

  const addProject = useCallback((name) => {
    setData((prev) => {
      const id = `proj_${Date.now()}`
      const project = { id, name, status: 'active', createdAt: Date.now() }
      const next = {
        ...prev,
        projects: [...prev.projects, project],
        instruments: { ...prev.instruments, [id]: deepCopyInstruments(DEFAULT_INSTRUMENTS) },
      }
      persist(next)
      return next
    })
  }, [persist])

  const toggleArchive = useCallback((projectId) => {
    setData((prev) => {
      const projects = prev.projects.map((p) =>
        p.id === projectId ? { ...p, status: p.status === 'active' ? 'archived' : 'active' } : p
      )
      const next = { ...prev, projects }
      persist(next)
      return next
    })
  }, [persist])

  const addTask = useCallback((projectId, fields) => {
    setData((prev) => {
      const task = {
        id: `task_${Date.now()}`, projectId,
        title: fields.title, why: fields.why, section: fields.section,
        sounds: [], reflection: '', status: 'todo', createdAt: Date.now(),
      }
      const projectTasks = [...(prev.tasks[projectId] || []), task]
      const next = { ...prev, tasks: { ...prev.tasks, [projectId]: projectTasks } }
      persist(next)
      return next
    })
  }, [persist])

  const updateTask = useCallback((projectId, taskId, changes) => {
    setData((prev) => {
      const projectTasks = (prev.tasks[projectId] || []).map((t) =>
        t.id === taskId ? { ...t, ...changes } : t
      )
      const next = { ...prev, tasks: { ...prev.tasks, [projectId]: projectTasks } }
      persist(next)
      return next
    })
  }, [persist])

  const updateInstruments = useCallback((projectId, newInstruments) => {
    setData((prev) => {
      const next = { ...prev, instruments: { ...prev.instruments, [projectId]: newInstruments } }
      persist(next)
      return next
    })
  }, [persist])

  // Seed instruments for projects that pre-date this feature
  const openProject = useCallback((projectId) => {
    setData((prev) => {
      if (prev.instruments[projectId]) { setActiveProjectId(projectId); setView('detail'); return prev }
      const next = { ...prev, instruments: { ...prev.instruments, [projectId]: deepCopyInstruments(DEFAULT_INSTRUMENTS) } }
      persist(next)
      return next
    })
    setActiveProjectId(projectId)
    setView('detail')
  }, [persist])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0e14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>Loading…</span>
      </div>
    )
  }

  const activeProject = data.projects.find((p) => p.id === activeProjectId)
  const activeTasks = data.tasks[activeProjectId] || []
  const activeInstruments = (data.instruments[activeProjectId]) || deepCopyInstruments(DEFAULT_INSTRUMENTS)

  return (
    <div style={{ minHeight: '100vh', background: '#0c0e14', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Music Project Tracker
          </span>
          <div style={{ color: '#475569', fontSize: 10, letterSpacing: '0.12em', marginTop: 2 }}>TRACK YOUR CREATIVE PROCESS</div>
        </div>
        {saving && <span style={{ color: '#475569', fontSize: 11 }}>saving…</span>}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {view === 'list' ? (
          <ProjectList
            projects={data.projects}
            tasks={data.tasks}
            onSelect={openProject}
            onAdd={addProject}
            onToggleArchive={toggleArchive}
          />
        ) : (
          activeProject && (
            <ProjectDetail
              project={activeProject}
              tasks={activeTasks}
              instruments={activeInstruments}
              onAddTask={(fields) => addTask(activeProjectId, fields)}
              onUpdateTask={(taskId, changes) => updateTask(activeProjectId, taskId, changes)}
              onUpdateInstruments={(inst) => updateInstruments(activeProjectId, inst)}
              onBack={() => { setView('list'); setActiveProjectId(null) }}
            />
          )
        )}
      </div>
    </div>
  )
}
