import { generateText, Output } from 'ai'
import { z } from 'zod'
import { EFFECTS } from '@/lib/glitch/effects'

export const maxDuration = 30

const catalogue = EFFECTS.map((e) => {
  const params = e.params.map((p) => `${p.key}(${p.min}..${p.max}, default ${p.default})`).join(', ')
  return `- ${e.id}: ${e.name}. ${e.blurb} params: ${params}`
}).join('\n')

const schema = z.object({
  title: z.string().describe('short evocative name for this look, max 4 words'),
  note: z.string().describe('one sentence describing the treatment, max 20 words'),
  stages: z
    .array(
      z.object({
        effect: z.string().describe('one of the effect ids from the catalogue'),
        intensity: z.number().min(0).max(1),
        audioMod: z.number().min(0).max(1).describe('how much live audio pushes this stage, usually 0'),
        params: z
          .array(z.object({ key: z.string(), value: z.number() }))
          .describe('parameter overrides for this effect, using the documented keys and ranges'),
      }),
    )
    .min(2)
    .max(6),
})

export async function POST(req: Request) {
  const { prompt } = (await req.json()) as { prompt?: string }
  if (!prompt?.trim()) {
    return Response.json({ error: 'Prompt required' }, { status: 400 })
  }

  try {
    const { output } = await generateText({
      model: 'openai/gpt-5.4-mini',
      output: Output.object({ schema }),
      system: [
        'You are the pipeline designer inside Glitch Studio, a real-time experimental video lab.',
        'Translate an artistic prompt into an ordered chain of GPU glitch stages.',
        'Rules: order matters, signal flows top to bottom and the last stage is what the viewer sees.',
        'Put temporal/compression damage early, distortion mid-chain, and optical/color stages last.',
        'Use 3 to 5 stages. Only use effect ids from the catalogue. Only use documented param keys.',
        'Values must respect each param range. Be bold: a flat, barely-visible result is a failure.',
        '',
        'CATALOGUE',
        catalogue,
      ].join('\n'),
      prompt,
    })

    return Response.json({
      title: output.title,
      note: output.note,
      stages: output.stages.map((s) => ({
        effect: s.effect,
        intensity: s.intensity,
        audioMod: s.audioMod,
        params: Object.fromEntries(s.params.map((p) => [p.key, p.value])),
      })),
    })
  } catch (error) {
    console.log('[v0] pipeline generation failed', error)
    return Response.json({ error: 'Could not generate a pipeline' }, { status: 500 })
  }
}
