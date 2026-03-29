import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '20mb' }))

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env automatically

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'create_tasks',
    description: 'Propose one or more new tasks for the project. They will appear as preview cards for the user to approve before being added to the board.',
    input_schema: {
      type: 'object',
      required: ['tasks'],
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'why', 'section', 'sounds'],
            properties: {
              title: { type: 'string', description: 'Concise action-oriented task title' },
              why: { type: 'string', description: 'Musical intention behind this step' },
              section: {
                type: 'string',
                enum: ['Hook', 'Verse', 'Bridge', 'Outro', 'Intro', 'Other', ''],
              },
              sounds: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['category', 'sub', 'role'],
                  properties: {
                    category: { type: 'string' },
                    sub: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    name: 'update_tasks',
    description: 'Modify one or more existing tasks. Only include fields that should change. Changes will be previewed for user approval.',
    input_schema: {
      type: 'object',
      required: ['updates'],
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            required: ['taskId'],
            properties: {
              taskId: { type: 'string' },
              title: { type: 'string' },
              why: { type: 'string' },
              section: { type: 'string', enum: ['Hook', 'Verse', 'Bridge', 'Outro', 'Intro', 'Other', ''] },
              sounds: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['category', 'sub', 'role'],
                  properties: {
                    category: { type: 'string' },
                    sub: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    name: 'add_instruments',
    description: 'Add new instrument categories or sounds to the project palette. Use when suggesting an instrument not already available.',
    input_schema: {
      type: 'object',
      required: ['additions'],
      properties: {
        additions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['category', 'subs'],
            properties: {
              category: { type: 'string', description: 'Instrument category name' },
              subs: { type: 'array', items: { type: 'string' }, description: 'Specific sounds in this category' },
            },
          },
        },
      },
    },
  },
]

// ─── Build system prompt ─────────────────────────────────────────────────────

function buildSystemPrompt(projectContext) {
  const { projectName, tasks, instruments } = projectContext
  const taskSummary = tasks.length === 0
    ? 'No tasks yet.'
    : tasks.map(t => `[${t.status}] ${t.section ? `(${t.section}) ` : ''}${t.title}${t.sounds?.length ? ' — ' + t.sounds.map(s => `${s.sub} (${s.role})`).join(', ') : ''}`).join('\n')

  return `You are an expert music arrangement assistant inside a music project tracker app.

## Your Expertise
Song structure, instrument layering, rhythmic patterns, arrangement roles, genre conventions, artist references (you know music deeply from your training).

## Current Project: "${projectName}"

### Existing Tasks:
${taskSummary}

### Available Instruments:
${Object.entries(instruments).map(([cat, subs]) => `${cat}: ${subs.join(', ')}`).join('\n')}

## Rules
- ALWAYS use the create_tasks tool to propose tasks — never list them in plain text
- If you need an instrument not in the palette, use add_instruments first, then reference it in create_tasks
- Valid sections: Hook, Verse, Bridge, Outro, Intro, Other (or empty for general tasks)
- Valid roles: Lead, Counter-Melody, Harmony, Pad, Call, Response, Pulse, Groove, Ostinato, Accent, Foundation, Melodic Bass, Sub Layer, Atmosphere, Texture, Drone, Ear Candy, Riff, Hook, Transition, Fill, Foreground, Midground, Background
- Task titles: concise and action-oriented (e.g. "Layer Rhodes pad under verse vocal")
- The "why" field should capture the musical intention, not restate the title
- New tasks always use status "todo"
- When the user shares a DAW screenshot, analyze visible tracks, clips, or arrangement blocks and relate them to the task list — note what's done and what's missing
- Be conversational but efficient. Ask clarifying questions when intent is ambiguous (tempo, mood, reference artists, section structure)
- Think in arrangement layers: foundation (drums + bass), harmonic bed (keys/pads), melodic elements (leads/vocals), ear candy (FX/textures)
- Don't create duplicate tasks for things already in the task list`
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: !!process.env.ANTHROPIC_API_KEY })
})

app.post('/api/chat', async (req, res) => {
  const { messages, projectContext } = req.body

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured. Create a .env file with your key.' })
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: buildSystemPrompt(projectContext),
      tools: TOOLS,
      messages,
    })

    res.json(response)
  } catch (err) {
    console.error('Claude API error:', err)
    if (err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(503).json({ error: 'Failed to reach Claude API. Check your API key and network.' })
  }
})

// ─── Production static serving ───────────────────────────────────────────────

const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
}

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API key: ${process.env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ missing — create .env file'}`)
})
