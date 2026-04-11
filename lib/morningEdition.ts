import { getLocationContext } from '../services/location'
import { fetchNews, type MorningStory } from '../services/news'
import { fetchLocalScores, type LocalScore } from '../services/scores'
import { fetchWeather, type MorningWeather } from '../services/weather'

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

export async function loadMorningEdition(): Promise<MorningEdition> {
  const location = await getLocationContext()
  const [weather, stories, localScores] = await Promise.all([
    fetchWeather(location),
    fetchNews(location),
    fetchLocalScores(),
  ])

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
