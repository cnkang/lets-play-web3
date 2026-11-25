import { guides } from './guides.mjs'
import { labs } from './labs-copy.mjs'

export const labPaths = Object.values(labs).map((lab) => `labs/${lab.slug}/`)
export const guidePaths = guides.map((guide) => `guides/${guide.slug}/`)

export function learningPaths() {
  return ['labs/', ...labPaths, 'guides/', ...guidePaths, 'learn-with-ai/']
}
