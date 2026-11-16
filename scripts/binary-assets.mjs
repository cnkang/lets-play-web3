#!/usr/bin/env node
// The repository is published through an API that only accepts text files, so the
// two binary Open Graph images are stored as base64 text (assets/og/*.png.b64) and
// decoded to public/og/*.png before every dev/build/preview (and in CI). The raw
// PNGs are git-ignored build inputs; the .b64 files are the source of truth.
//
//   node scripts/binary-assets.mjs           # decode: write public/og/*.png if missing or different
//   node scripts/binary-assets.mjs encode    # encode: refresh assets/og/*.png.b64 from public/og/*.png
//
// No dependencies; the decoded bytes are identical to the original PNGs.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
// [base64 source dir, output dir]
const dirs = [['assets/og', 'public/og']]
const sha = (b) => createHash('sha256').update(b).digest('hex')
const mode = process.argv[2] === 'encode' ? 'encode' : 'decode'

for (const [srcRel, outRel] of dirs) {
  const src = join(root, srcRel)
  const out = join(root, outRel)
  mkdirSync(src, { recursive: true })
  mkdirSync(out, { recursive: true })
  if (mode === 'encode') {
    for (const f of readdirSync(out).filter((x) => x.endsWith('.png'))) {
      const b64 = readFileSync(join(out, f)).toString('base64').replace(/.{1,76}/g, '$&\n')
      writeFileSync(join(src, `${f}.b64`), b64)
      console.log(`encoded ${outRel}/${f} → ${srcRel}/${f}.b64`)
    }
    continue
  }
  for (const f of readdirSync(src).filter((x) => x.endsWith('.png.b64'))) {
    const bytes = Buffer.from(readFileSync(join(src, f), 'utf8').replace(/\s+/g, ''), 'base64')
    const target = join(out, f.replace(/\.b64$/, ''))
    if (existsSync(target) && sha(readFileSync(target)) === sha(bytes)) continue
    writeFileSync(target, bytes)
    console.log(`decoded ${srcRel}/${f} → ${outRel}/${f.replace(/\.b64$/, '')} (sha256 ${sha(bytes).slice(0, 12)}…)`)
  }
}
