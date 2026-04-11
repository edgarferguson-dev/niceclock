import type { DayActivity, LockScreenGlanceKey } from '../data/mockDay'

export type ActivityState = 'past' | 'active' | 'upcoming'

export interface TimelineActivity extends DayActivity {
  startMinutes: number
  endMinutes: number
  state: ActivityState
}

export interface TimelineState {
  now: Date
  nowLabel: string
  active: TimelineActivity | null
  next: TimelineActivity | null
  activities: TimelineActivity[]
}

export interface LockScreenSnapshot {
  activeActivity: {
    title: string
    timeRange: string
  } | null
  nextActivity: {
    title: string
    timeRange: string
  } | null
  glances: Array<{
    key: LockScreenGlanceKey
    label: string
    value: string
  }>
}

export function toMinutes(time24: string): number {
  const [hours, minutes] = time24.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatMinutes(minutes: number): string {
  const hour24 = Math.floor(minutes / 60)
  const min = minutes % 60
  const ampm = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${String(min).padStart(2, '0')} ${ampm}`
}

export function formatRange(startTime: string, endTime: string): string {
  return `${formatMinutes(toMinutes(startTime))} - ${formatMinutes(toMinutes(endTime))}`
}

export function formatNow(now: Date): string {
  return formatMinutes(now.getHours() * 60 + now.getMinutes())
}

export function getTimelineState(activities: DayActivity[], now: Date): TimelineState {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const mapped = activities.map<TimelineActivity>((activity) => {
    const startMinutes = toMinutes(activity.startTime)
    const endMinutes = toMinutes(activity.endTime)

    let state: ActivityState = 'upcoming'
    if (currentMinutes >= endMinutes) state = 'past'
    else if (currentMinutes >= startMinutes) state = 'active'

    return {
      ...activity,
      startMinutes,
      endMinutes,
      state,
    }
  })

  const active = mapped.find((activity) => activity.state === 'active') ?? null
  const next = mapped.find((activity) => activity.state === 'upcoming') ?? null

  return {
    now,
    nowLabel: formatNow(now),
    active,
    next,
    activities: mapped,
  }
}

export function buildActivityVoiceLine(activity: DayActivity): string {
  const detail = activity.detail ? ` ${activity.detail}.` : ''
  return `${activity.title}. ${formatRange(activity.startTime, activity.endTime)}.${detail}`
}

export function createLockScreenSnapshot(input: {
  activities: DayActivity[]
  now: Date
  glances: Array<{
    key: LockScreenGlanceKey
    label: string
    value: string
  }>
}): LockScreenSnapshot {
  const timeline = getTimelineState(input.activities, input.now)

  return {
    activeActivity: timeline.active
      ? {
          title: timeline.active.title,
          timeRange: formatRange(timeline.active.startTime, timeline.active.endTime),
        }
      : null,
    nextActivity: timeline.next
      ? {
          title: timeline.next.title,
          timeRange: formatRange(timeline.next.startTime, timeline.next.endTime),
        }
      : null,
    glances: input.glances,
  }
}
