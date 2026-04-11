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
  const leadLocal = stories.localStories[0]?.title ?? 'No local lead available yet.'
  const leadTop = stories.topStories[0]?.title ?? 'No top story available yet.'
  const leadTrending = stories.trendingStories[0]?.title ?? 'No trending story available yet.'
  const leadScore = localScores[0]
    ? `${localScores[0].team} ${localScores[0].teamScore ?? ''} ${localScores[0].opponent} ${localScores[0].opponentScore ?? ''}. ${localScores[0].status}`.replace(/\s+/g, ' ').trim()
    : 'No local score update yet.'

  return {
    locationLabel,
    weather,
    localStories: stories.localStories,
    topStories: stories.topStories,
    trendingStories: stories.trendingStories,
    localScores,
    narration: `Good morning. In ${location.city}, it's ${weather.temperatureF} degrees and ${weather.condition.toLowerCase()}. Top story: ${leadTop}. Local lead: ${leadLocal}. Local scoreline: ${leadScore}. Trending now: ${leadTrending}`,
  }
}
