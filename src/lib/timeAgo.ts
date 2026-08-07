export function timeAgo(value: string | null): string {
  if (!value) return ''
  const then = new Date(value)
  if (isNaN(then.getTime())) return ''
  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `hace ${days} ${days === 1 ? 'día' : 'días'}`
  const months = Math.round(days / 30)
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.round(months / 12)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}
