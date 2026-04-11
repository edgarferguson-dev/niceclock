import type { DayActivity } from '../data/mockDay'
import type { LocalScore, MorningEdition } from './morningEdition'
import { formatRange, getTimelineState } from './activityTimeline'

export interface MorningSurfaceSnapshot {
  nextAlarmLabel: string
  primaryTitle: string
  supportingLine: string
  weatherLine: string
  weatherSummary: string
  localLead: string
  localLeadSummary: string
  scoreLine: string
  scoreCard: LocalScore | null
  scoreItems: LocalScore[]
  liveNote: string
}

function formatAlarmTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h24 = parseInt(hStr, 10)
  const h12 = h24 % 12 || 12
  const ampm = h24 < 12 ? 'AM' : 'PM'
  return `${h12}:${mStr} ${ampm}`
}

export function createMorningSurfaceSnapshot(input: {
  now: Date
  alarmTime: string
  activities: DayActivity[]
  edition: MorningEdition | null
}): MorningSurfaceSnapshot {
  const timeline = getTimelineState(input.activities, input.now)
  const activeOrNext = timeline.active ?? timeline.next ?? null
  const scoreCard = input.edition?.localScores[0] ?? null

  return {
    nextAlarmLabel: formatAlarmTime(input.alarmTime),
    primaryTitle: activeOrNext?.title ?? 'Morning stays open',
    supportingLine: timeline.active
      ? `Happening now until ${formatRange(timeline.active.startTime, timeline.active.endTime).split(' - ')[1]}.`
      : timeline.next
        ? `Next block begins at ${formatRange(timeline.next.startTime, timeline.next.endTime).split(' - ')[0]}.`
        : 'The rest of the day is still unwritten.',
    weatherLine: input.edition
      ? `${input.edition.weather.temperatureF} degrees - ${input.edition.weather.condition}`
      : 'Weather loading',
    weatherSummary: input.edition
      ? `High ${input.edition.weather.highF} degrees and low ${input.edition.weather.lowF} degrees for the next stretch.`
      : 'Forecast is still coming in.',
    localLead: input.edition?.localStories[0]?.title ?? 'Local lead loading',
    localLeadSummary: input.edition?.localStories[0]?.summary ?? 'A concise local briefing will appear here.',
    scoreLine: scoreCard
      ? `${scoreCard.team} ${scoreCard.teamScore ?? ''} - ${scoreCard.opponent} ${scoreCard.opponentScore ?? ''}`.replace(/\s+/g, ' ').trim()
      : 'No local score update',
    scoreCard,
    scoreItems: input.edition?.localScores ?? [],
    liveNote: input.edition
      ? `Updated for ${input.edition.locationLabel}`
      : 'Refreshing morning context',
  }
}
