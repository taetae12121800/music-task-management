import { useState, useEffect, useRef, useCallback } from 'react'

const INST_COLOR = '#2dd4bf'
const AI_COLOR = '#a78bfa'

// ─── Shared mini styles ───────────────────────────────────────────────────────

const monoFont = 'JetBrains Mono, monospace'

const miniBadge = {
  display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
  borderRadius: 20, fontSize: 10, fontFamily: monoFont, fontWeight: 600,
  border: '1px solid',
}

// ─── ToolUsePreview ───────────────────────────────────────────────────────────

function TaskPreviewCard({ task, onRemove }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: '#e2e8f0', fontSize: 12, fontFamily: monoFont, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>
          {task.title}
        </span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
        {task.section && (
          <span style={{ ...miniBadge, color: AI_COLOR, borderColor: `${AI_COLOR}44`, background: `${AI_COLOR}12` }}>
            {task.section}
          </span>
        )}
        {(task.sounds || []).map((s, i) => (
          <span key={i} style={{ ...miniBadge, color: INST_COLOR, borderColor: `${INST_COLOR}44`, background: `${INST_COLOR}12` }}>
            {s.sub} · {s.role}
          </span>
        ))}
      </div>
      {task.why && (
        <p style={{ color: '#64748b', fontSize: 11, fontFamily: monoFont, margin: '6px 0 0', lineHeight: 1.5 }}>
          {task.why}
        </p>
      )}
    </div>
  )
}

function CreateTasksPreview({ toolInput, onApprove, onReject }) {
  const [tasks, setTasks] = useState(toolInput.tasks || [])

  const removeTask = (i) => setTasks((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <div style={{ background: 'rgba(167,139,250,0.06)', border: `1px solid ${AI_COLOR}33`, borderRadius: 10, padding: '12px 14px', marginTop: 8 }}>
      <div style={{ color: AI_COLOR, fontSize: 10, fontFamily: monoFont, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>
        PROPOSED TASKS ({tasks.length})
      </div>
      {tasks.map((t, i) => (
        <TaskPreviewCard key={i} task={t} onRemove={() => removeTask(i)} />
      ))}
      {tasks.length === 0 && (
        <p style={{ color: '#475569', fontSize: 11, fontFamily: monoFont }}>All tasks removed.</p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={() => onApprove(tasks)}
          disabled={tasks.length === 0}
          style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontFamily: monoFont, fontWeight: 600, cursor: tasks.length ? 'pointer' : 'not-allowed', background: tasks.length ? `linear-gradient(135deg, ${AI_COLOR}, #60a5fa)` : 'rgba(255,255,255,0.1)', border: 'none', color: tasks.length ? '#0c0e14' : '#475569', opacity: tasks.length ? 1 : 0.5 }}
        >
          Approve All ({tasks.length})
        </button>
        <button
          onClick={onReject}
          style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontFamily: monoFont, cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}
        >
          Reject
        </button>
      </div>
    </div>
  )
}

function AddInstrumentsPreview({ toolInput, instruments, onApprove, onReject }) {
  return (
    <div style={{ background: `rgba(45,212,191,0.06)`, border: `1px solid ${INST_COLOR}33`, borderRadius: 10, padding: '12px 14px', marginTop: 8 }}>
      <div style={{ color: INST_COLOR, fontSize: 10, fontFamily: monoFont, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>
        ADD INSTRUMENTS
      </div>
      {(toolInput.additions || []).map((addition, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <span style={{ color: INST_COLOR, fontSize: 11, fontFamily: monoFont, fontWeight: 700 }}>{addition.category}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {addition.subs.map((sub) => (
              <span key={sub} style={{ ...miniBadge, color: INST_COLOR, borderColor: `${INST_COLOR}44`, background: `${INST_COLOR}12` }}>{sub}</span>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => onApprove(toolInput.additions)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontFamily: monoFont, fontWeight: 600, cursor: 'pointer', background: `linear-gradient(135deg, ${INST_COLOR}, #60a5fa)`, border: 'none', color: '#0c0e14' }}>
          Add to Palette
        </button>
        <button onClick={onReject} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontFamily: monoFont, cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
          Reject
        </button>
      </div>
    </div>
  )
}

function UpdateTasksPreview({ toolInput, existingTasks, onApprove, onReject }) {
  const updates = toolInput.updates || []
  return (
    <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 10, padding: '12px 14px', marginTop: 8 }}>
      <div style={{ color: '#facc15', fontSize: 10, fontFamily: monoFont, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>
        UPDATE TASKS ({updates.length})
      </div>
      {updates.map((u, i) => {
        const existing = existingTasks.find((t) => t.id === u.taskId)
        return (
          <div key={i} style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
            <span style={{ color: '#e2e8f0', fontSize: 12, fontFamily: monoFont, fontWeight: 600 }}>
              {existing?.title || u.taskId}
            </span>
            {u.title && <div style={{ color: '#facc15', fontSize: 11, fontFamily: monoFont, marginTop: 4 }}>→ "{u.title}"</div>}
            {u.section && <div style={{ color: '#64748b', fontSize: 11, fontFamily: monoFont }}>Section: {u.section}</div>}
            {u.sounds && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {u.sounds.map((s, j) => (
                  <span key={j} style={{ ...miniBadge, color: INST_COLOR, borderColor: `${INST_COLOR}44`, background: `${INST_COLOR}12` }}>
                    {s.sub} · {s.role}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => onApprove(updates)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontFamily: monoFont, fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg, #facc15, #f97316)', border: 'none', color: '#0c0e14' }}>
          Apply Updates
        </button>
        <button onClick={onReject} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontFamily: monoFont, cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
          Reject
        </button>
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, tasks, instruments, onApproveCreateTasks, onApproveAddInstruments, onApproveUpdateTasks, onRejectTool }) {
  const isUser = msg.role === 'user'

  // Extract text and tool_use blocks from content
  const content = typeof msg.content === 'string' ? [{ type: 'text', text: msg.content }] : (msg.content || [])
  const textBlocks = content.filter((b) => b.type === 'text')
  const toolBlocks = content.filter((b) => b.type === 'tool_use')

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '92%' }}>
        {/* Text content */}
        {textBlocks.map((b, i) => (
          b.text?.trim() ? (
            <div key={i} style={{
              background: isUser ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isUser ? `${AI_COLOR}33` : 'rgba(255,255,255,0.08)'}`,
              borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              padding: '10px 14px', color: '#e2e8f0', fontSize: 13, fontFamily: monoFont,
              lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {b.text}
            </div>
          ) : null
        ))}

        {/* Tool use previews */}
        {!msg.toolResolved && toolBlocks.map((b) => {
          if (b.name === 'create_tasks') {
            return (
              <CreateTasksPreview
                key={b.id}
                toolInput={b.input}
                onApprove={(confirmedTasks) => onApproveCreateTasks(b.id, confirmedTasks)}
                onReject={() => onRejectTool(b.id, 'create_tasks')}
              />
            )
          }
          if (b.name === 'add_instruments') {
            return (
              <AddInstrumentsPreview
                key={b.id}
                toolInput={b.input}
                instruments={instruments}
                onApprove={(additions) => onApproveAddInstruments(b.id, additions)}
                onReject={() => onRejectTool(b.id, 'add_instruments')}
              />
            )
          }
          if (b.name === 'update_tasks') {
            return (
              <UpdateTasksPreview
                key={b.id}
                toolInput={b.input}
                existingTasks={tasks}
                onApprove={(updates) => onApproveUpdateTasks(b.id, updates)}
                onReject={() => onRejectTool(b.id, 'update_tasks')}
              />
            )
          }
          return null
        })}

        {/* Resolved tool confirmation */}
        {msg.toolResolved && msg.toolResolution && (
          <div style={{ color: '#4ade80', fontSize: 11, fontFamily: monoFont, marginTop: 4, padding: '4px 8px' }}>
            ✓ {msg.toolResolution}
          </div>
        )}

        {/* Image thumbnail in user messages */}
        {msg.imagePreview && (
          <img src={msg.imagePreview} alt="Attached" style={{ maxWidth: 200, maxHeight: 140, borderRadius: 6, marginTop: 6, border: '1px solid rgba(255,255,255,0.1)', display: 'block' }} />
        )}
      </div>

      <span style={{ color: '#334155', fontSize: 9, fontFamily: monoFont, marginTop: 3 }}>
        {isUser ? 'You' : 'AI Assistant'}
      </span>
    </div>
  )
}

// ─── AIChatPanel ──────────────────────────────────────────────────────────────

export default function AIChatPanel({
  projectId, projectName, tasks, instruments,
  onAddTask, onUpdateTask, onUpdateInstruments,
  isOpen, onClose,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [imageAttachment, setImageAttachment] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiAvailable, setApiAvailable] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Check API health and load chat history on mount / project change
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setApiAvailable(d.hasKey))
      .catch(() => setApiAvailable(false))

    const saved = localStorage.getItem(`music-tracker-chat-${projectId}`)
    if (saved) {
      try { setMessages(JSON.parse(saved)) } catch {}
    } else {
      setMessages([])
    }
  }, [projectId])

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`music-tracker-chat-${projectId}`, JSON.stringify(messages.slice(-50)))
    }
  }, [messages, projectId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const buildApiMessages = useCallback((msgs) => {
    const result = []
    for (const msg of msgs) {
      if (msg.role === 'tool_result') {
        // tool_result must be in a user turn
        result.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: msg.toolUseId, content: msg.content }],
        })
      } else if (msg.role === 'user' || msg.role === 'assistant') {
        result.push({ role: msg.role, content: msg.content })
      }
    }
    return result
  }, [])

  const sendMessage = useCallback(async (extraMessages = []) => {
    setError(null)
    setIsLoading(true)

    const apiMessages = buildApiMessages([...messages, ...extraMessages])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          projectContext: { projectName, tasks, instruments },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      // Add assistant message to state
      const assistantMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.content,
        toolResolved: false,
      }
      setMessages((prev) => [...prev, ...extraMessages, assistantMsg])

    } catch (e) {
      setError('Network error — is the server running? (npm run dev:server)')
    } finally {
      setIsLoading(false)
    }
  }, [messages, buildApiMessages, projectName, tasks, instruments])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text && !imageAttachment) return

    const contentBlocks = []
    if (text) contentBlocks.push({ type: 'text', text })
    if (imageAttachment) {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: imageAttachment.mediaType, data: imageAttachment.base64 },
      })
    }

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: contentBlocks.length === 1 && contentBlocks[0].type === 'text' ? text : contentBlocks,
      imagePreview: imageAttachment?.previewUrl || null,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setImageAttachment(null)
    sendMessage([userMsg])
  }, [input, imageAttachment, sendMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type
      setImageAttachment({ base64, mediaType, previewUrl: dataUrl })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Tool approval handlers
  const resolveToolUse = useCallback((toolUseId, resolution, toolResultContent, extraMessages = []) => {
    setMessages((prev) =>
      prev.map((m) =>
        Array.isArray(m.content) && m.content.some((b) => b.id === toolUseId)
          ? { ...m, toolResolved: true, toolResolution: resolution }
          : m
      )
    )
    const toolResultMsg = { id: `tr_${Date.now()}`, role: 'tool_result', toolUseId, content: toolResultContent }
    sendMessage([toolResultMsg, ...extraMessages])
  }, [sendMessage])

  const handleApproveCreateTasks = useCallback((toolUseId, confirmedTasks) => {
    let created = 0
    for (const task of confirmedTasks) {
      onAddTask({ title: task.title, why: task.why, section: task.section, sounds: task.sounds || [] })
      created++
    }
    resolveToolUse(toolUseId, `${created} task${created !== 1 ? 's' : ''} added to the board`, `User approved. ${created} task${created !== 1 ? 's' : ''} created successfully.`)
  }, [onAddTask, resolveToolUse])

  const handleApproveAddInstruments = useCallback((toolUseId, additions) => {
    const merged = { ...instruments }
    for (const { category, subs } of additions) {
      if (merged[category]) {
        merged[category] = [...new Set([...merged[category], ...subs])]
      } else {
        merged[category] = subs
      }
    }
    onUpdateInstruments(merged)
    resolveToolUse(toolUseId, `Instrument palette updated`, `User approved. Instruments added to palette.`)
  }, [instruments, onUpdateInstruments, resolveToolUse])

  const handleApproveUpdateTasks = useCallback((toolUseId, updates) => {
    for (const update of updates) {
      const { taskId, ...changes } = update
      onUpdateTask(taskId, changes)
    }
    resolveToolUse(toolUseId, `${updates.length} task${updates.length !== 1 ? 's' : ''} updated`, `User approved. ${updates.length} task${updates.length !== 1 ? 's' : ''} updated.`)
  }, [onUpdateTask, resolveToolUse])

  const handleRejectTool = useCallback((toolUseId, toolName) => {
    resolveToolUse(toolUseId, `Changes rejected`, `User rejected. No changes were made.`)
  }, [resolveToolUse])

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem(`music-tracker-chat-${projectId}`)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease',
      background: '#0a0c14', borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 900, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: monoFont, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Assistant
          </span>
          <div style={{ color: '#334155', fontSize: 9, fontFamily: monoFont, letterSpacing: '0.1em', marginTop: 1 }}>
            {projectName.toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {messages.length > 0 && (
            <button onClick={clearHistory} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 10, fontFamily: monoFont, padding: '2px 6px' }}>
              Clear
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
      </div>

      {/* API not configured warning */}
      {apiAvailable === false && (
        <div style={{ margin: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
          <div style={{ color: '#f87171', fontSize: 11, fontFamily: monoFont, fontWeight: 700, marginBottom: 4 }}>API Key Not Configured</div>
          <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: monoFont, lineHeight: 1.5 }}>
            Create a <code style={{ color: '#f87171' }}>.env</code> file in the project root:<br />
            <code style={{ color: '#4ade80' }}>ANTHROPIC_API_KEY=sk-ant-...</code><br />
            Then restart the server with <code style={{ color: '#60a5fa' }}>npm run dev:server</code>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
        {messages.length === 0 && apiAvailable !== false && (
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
            <div style={{ color: '#475569', fontSize: 12, fontFamily: monoFont, lineHeight: 1.7 }}>
              Describe your track idea.<br />
              I'll suggest arrangement tasks<br />
              with instruments and roles.
            </div>
            <div style={{ color: '#334155', fontSize: 10, fontFamily: monoFont, marginTop: 16, lineHeight: 1.8 }}>
              Try: "A dark afrobeat hook<br />inspired by Burna Boy's pocket"
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            tasks={tasks}
            instruments={instruments}
            onApproveCreateTasks={handleApproveCreateTasks}
            onApproveAddInstruments={handleApproveAddInstruments}
            onApproveUpdateTasks={handleApproveUpdateTasks}
            onRejectTool={handleRejectTool}
          />
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 12, fontFamily: monoFont }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>●</span> Thinking…
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', color: '#f87171', fontSize: 11, fontFamily: monoFont }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {/* Image thumbnail */}
        {imageAttachment && (
          <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
            <img src={imageAttachment.previewUrl} alt="Attachment" style={{ height: 60, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }} />
            <button
              onClick={() => setImageAttachment(null)}
              style={{ position: 'absolute', top: -6, right: -6, background: '#0a0c14', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', color: '#94a3b8', cursor: 'pointer', fontSize: 11, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >×</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {/* Image upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach DAW screenshot"
            style={{ background: imageAttachment ? `${INST_COLOR}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${imageAttachment ? INST_COLOR + '55' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, color: imageAttachment ? INST_COLOR : '#475569', cursor: 'pointer', padding: '6px 8px', fontSize: 14, lineHeight: 1, flexShrink: 0 }}
          >
            ⊕
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

          {/* Text input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your arrangement idea…"
            rows={2}
            disabled={isLoading || apiAvailable === false}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontFamily: monoFont, fontSize: 12, outline: 'none', resize: 'none', lineHeight: 1.5 }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !imageAttachment) || apiAvailable === false}
            style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', border: 'none', borderRadius: 6, color: '#0c0e14', cursor: 'pointer', padding: '8px 12px', fontSize: 14, fontWeight: 700, lineHeight: 1, flexShrink: 0, opacity: (isLoading || (!input.trim() && !imageAttachment)) ? 0.4 : 1 }}
          >
            ↑
          </button>
        </div>
        <div style={{ color: '#1e293b', fontSize: 9, fontFamily: monoFont, marginTop: 5, textAlign: 'right' }}>
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  )
}
