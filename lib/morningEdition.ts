import { getLocationContext } from '../services/location'
import { fetchNews, type MorningStory } from '../services/news'
import { fetchLocalScores, type LocalScore } from '../services/scores'
import { fetchWeather, type MorningWeather } from '../services/weather'
import { mockDay } from '../data/mockDay'

export type { MorningStory } from '../services/news'
export type { LocalScore } from '../services/scores'
export type { MorningWeather } from '../services/weather'

export interface MorningEdition {
  locationLabel: string
  weather: MorningWeather
  localStories: MorningStory[]
  topStories: MorningStory[]
  trendingStories: MorningStory[]
  localScores: LocalScore[]
  narration: string
}

const FALLBACK_WEATHER: MorningWeather = {
  temperatureF: mockDay.weather.tempF,
  highF: mockDay.weather.tempF + 4,
  lowF: mockDay.weather.tempF - 6,
  condition: mockDay.weather.condition,
}

const FALLBACK_STORY: MorningStory = {
  title: mockDay.topTask,
  source: 'NiceClock',
  link: '',
  summary: 'Live briefing is temporarily unavailable, so NiceClock is using your saved morning plan.',
}

export async function loadMorningEdition(): Promise<MorningEdition> {
  const location = await getLocationContext()
  const [weatherResult, storiesResult, scoresResult] = await Promise.allSettled([
    fetchWeather(location),
    fetchNews(location),
    fetchLocalScores(),
  ])

  const weather =
    weatherResult.status === 'fulfilled'
      ? weatherResult.value
      : FALLBACK_WEATHER

  const stories =
    storiesResult.status === 'fulfilled'
      ? storiesResult.value
      : {
          topStories: [FALLBACK_STORY],
          localStories: [FALLBACK_STORY],
          trendingStories: [FALLBACK_STORY],
        }

  const localScores =
    scoresResult.status === 'fulfilled'
      ? scoresResult.value
      : []

  const locationLabel = `${location.city}${location.region ? `, ${location.region}` : ''}`
  const leadTop = stories.topStories[0]?.title ?? stories.localStories[0]?.title ?? null
  const topScore = localScores[0]

  // Score phrase only when there's an actual result or a live game — skip upcoming
  const scorePhrase =
    topScore && topScore.state !== 'upcoming' && topScore.teamScore
      ? `${topScore.team} ${topScore.teamScore}, ${topScore.opponent} ${topScore.opponentScore ?? ''}. ${topScore.status}.`
      : null

  const narrationParts: string[] = [
    `Good morning. ${weather.temperatureF} and ${weather.condition.toLowerCase()} in ${location.city}.`,
  ]
  if (leadTop) narrationParts.push(leadTop + '.')
  if (scorePhrase) narrationParts.push(scorePhrase)

  return {
    locationLabel,
    weather,
    localStories: stories.localStories,
    topStories: stories.topStories,
    trendingStories: stories.trendingStories,
    localScores,
    narration: narrationParts.join(' '),
  }
}
