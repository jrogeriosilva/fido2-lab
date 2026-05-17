import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('shiki/themes/one-dark-pro.mjs')],
      langs: [import('shiki/langs/json.mjs')],
      engine: createOnigurumaEngine(import('shiki/wasm')),
    })
  }
  return highlighterPromise
}
