export interface MosaicCompany {
  id: string
  name: string
  reviewsCount: number
}

export interface MosaicItem<T> {
  c: T
  spanClass: string
  isLarge: boolean
}

const SPAN_BY_SIZE: Record<number, number> = {
  '-2': 3,
  '-1': 4,
  '0': 6,
  '1': 7,
  '2': 8,
}

const SPAN_CLASS_BY_SPAN: Record<number, string> = {
  3: 'lg:col-span-3 xl:col-span-3',
  4: 'lg:col-span-4 xl:col-span-4',
  5: 'lg:col-span-5 xl:col-span-5',
  6: 'lg:col-span-6 xl:col-span-6',
  7: 'lg:col-span-7 xl:col-span-7',
  8: 'lg:col-span-8 xl:col-span-8',
}

const ROW_PATTERNS_BY_COUNT: Record<number, number[][]> = {
  2: [
    [8, 4],
    [7, 5],
    [6, 6],
  ],
  3: [
    [6, 3, 3],
    [4, 4, 4],
    [5, 4, 3],
  ],
  4: [[3, 3, 3, 3]],
}

function sizeOf(company: MosaicCompany, index: number): number {
  let size = 0
  if (company.reviewsCount >= 8) size += 2
  else if (company.reviewsCount >= 1) size += 1
  if (company.name.length >= 20) size += 1
  if (index % 5 === 0) size += 1
  else if (index % 5 === 3) size -= 1
  return Math.max(-2, Math.min(2, size))
}

function desiredSpan(company: MosaicCompany, index: number): number {
  return SPAN_BY_SIZE[sizeOf(company, index)] ?? 6
}

function permutationsWithDedup(values: number[]): number[][] {
  const seen = new Set<string>()
  const result: number[][] = []
  const used = new Array(values.length).fill(false)

  function backtrack(current: number[]) {
    if (current.length === values.length) {
      const key = current.join(',')
      if (!seen.has(key)) {
        seen.add(key)
        result.push([...current])
      }
      return
    }
    for (let i = 0; i < values.length; i++) {
      if (used[i]) continue
      used[i] = true
      current.push(values[i])
      backtrack(current)
      current.pop()
      used[i] = false
    }
  }

  backtrack([])
  return result
}

const ROW_SHAPES = [2, 3, 4]

function weightedRowShape(counter: number): number {
  const r = (counter * 7 + 5) % 10
  if (r < 4) return 2
  if (r < 8) return 3
  return 4
}

function bestPatternForK(items: MosaicCompany[], start: number, k: number) {
  const patterns = ROW_PATTERNS_BY_COUNT[k]
  const desireds = items.slice(start, start + k).map((c, j) => desiredSpan(c, start + j))
  let best: { pattern: number[]; cost: number } | null = null
  for (const pattern of patterns) {
    const sorted = [...pattern].sort((a, b) => a - b)
    const sortedDesireds = [...desireds].sort((a, b) => a - b)
    const cost = sorted.reduce((acc, span, i) => acc + Math.abs(span - sortedDesireds[i]), 0)
    if (!best || cost < best.cost) best = { pattern, cost }
  }
  return best
}

function nextRowShape(remaining: number, shapeCounter: number): number | null {
  if (remaining === 1) return null
  for (let attempt = 0; attempt < ROW_SHAPES.length; attempt++) {
    const k = weightedRowShape(shapeCounter + attempt)
    if (k <= remaining && remaining - k !== 1) return k
  }
  for (const k of ROW_SHAPES) {
    if (k <= remaining && remaining - k !== 1) return k
  }
  return remaining >= 3 ? 3 : remaining
}

export function buildLayout<T extends MosaicCompany>(items: T[]): MosaicItem<T>[] {
  const placed: { company: T; span: number; idx: number }[] = []
  let idx = 0
  let shapeCounter = 0
  let rowCounter = 0
  while (idx < items.length) {
    const k = nextRowShape(items.length - idx, shapeCounter)
    shapeCounter += 1
    if (k === null) {
      placed.push({ company: items[idx], span: 6, idx })
      idx += 1
      continue
    }
    const row = bestPatternForK(items, idx, k)
    if (!row) {
      placed.push({ company: items[idx], span: 6, idx })
      idx += 1
      continue
    }
    const perms = permutationsWithDedup(row.pattern)
    const chosen = perms[rowCounter % perms.length]
    rowCounter += 1
    for (const span of chosen) {
      placed.push({ company: items[idx], span, idx })
      idx += 1
    }
  }
  return placed.map((p) => ({
    c: p.company,
    spanClass: SPAN_CLASS_BY_SPAN[p.span] ?? 'lg:col-span-6 xl:col-span-6',
    isLarge: p.span >= 8,
  }))
}
