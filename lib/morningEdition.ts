export interface MorningStory {
  title: string
  source: string
  link: string
}

export interface MorningWeather {
  temperatureF: number
  highF: number
  lowF: number
  condition: string
}

export interface MorningEdition {
  locationLabel: string
  weather: MorningWeather
  localStories: MorningStory[]
  topStories: MorningStory[]
  trendingStories: MorningStory[]
  narration: string
}

interface LocationContext {
  latitude: number
  longitude: number
  city: string
  region: string
}

const DEFAULT_LOCATION: LocationContext = {
  latitude: 40.7128,
  longitude: -74.006,
  city: 'New York',
  region: 'NY',
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function getTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeEntities(match[1]) : ''
}

function parseGoogleNewsFeed(xml: string, limit: number): MorningStory[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((match) => {
      const block = match[1]
      const source = getTag(block, 'source') || 'Google News'
      const rawTitle = getTag(block, 'title')
      const title = source && rawTitle.endsWith(` - ${source}`)
        ? rawTitle.slice(0, -(source.length + 3)).trim()
        : rawTitle

      return {
        title,
        source,
        link: getTag(block, 'link'),
      }
    })
    .filter((story) => story.title.length > 0)
}

function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear'
  if ([1, 2, 3].includes(code)) return 'Partly cloudy'
  if ([45, 48].includes(code)) return 'Foggy'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain'
  if ([71, 73, 75, 77].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Showers'
  if ([95, 96, 99].includes(code)) return 'Stormy'
  return 'Mild'
}

async function fetchText(url: string): Promise<string> {
  try {
    const direct = await fetch(url)
    if (direct.ok) return await direct.text()
  } catch {
    // Fall back to a lightweight proxy when direct fetch is blocked.
  }

  const proxied = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  if (!proxied.ok) throw new Error(`Request failed for ${url}`)
  return await proxied.text()
}

async function getLocationContext(): Promise<LocationContext> {
  try {
    const Location = await import('expo-location')
    const permission = await Location.requestForegroundPermissionsAsync()

    if (!permission.granted) return DEFAULT_LOCATION

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    })

    const firstPlace = places[0]

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city: firstPlace?.city || firstPlace?.subregion || DEFAULT_LOCATION.city,
      region: firstPlace?.region || firstPlace?.country || DEFAULT_LOCATION.region,
    }
  } catch {
    return DEFAULT_LOCATION
  }
}

async function fetchWeather(location: LocationContext): Promise<MorningWeather> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: '1',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
  if (!response.ok) throw new Error('Weather request failed')

  const data = await response.json()
  const currentTemp = Math.round(data.current?.temperature_2m ?? 0)
  const weatherCode = Number(data.current?.weather_code ?? 0)

  return {
    temperatureF: currentTemp,
    highF: Math.round(data.daily?.temperature_2m_max?.[0] ?? currentTemp),
    lowF: Math.round(data.daily?.temperature_2m_min?.[0] ?? currentTemp),
    condition: mapWeatherCode(weatherCode),
  }
}

async function fetchNews(location: LocationContext) {
  const countryCode = 'US'
  const localQuery = encodeURIComponent(`${location.city} latest news`)
  const trendingQuery = encodeURIComponent('trending news today')

  const topFeedUrl = `https://news.google.com/rss?hl=en-US&gl=${countryCode}&ceid=${countryCode}:en`
  const localFeedUrl = `https://news.google.com/rss/search?q=${localQuery}&hl=en-US&gl=${countryCode}&ceid=${countryCode}:en`
  const trendingFeedUrl = `https://news.google.com/rss/search?q=${trendingQuery}&hl=en-US&gl=${countryCode}&ceid=${countryCode}:en`

  const [topXml, localXml, trendingXml] = await Promise.all([
    fetchText(topFeedUrl),
    fetchText(localFeedUrl),
    fetchText(trendingFeedUrl),
  ])

  return {
    topStories: parseGoogleNewsFeed(topXml, 5),
    localStories: parseGoogleNewsFeed(localXml, 4),
    trendingStories: parseGoogleNewsFeed(trendingXml, 4),
  }
}

export async function loadMorningEdition(): Promise<MorningEdition> {
  const location = await getLocationContext()
  const [weather, stories] = await Promise.all([
    fetchWeather(location),
    fetchNews(location),
  ])

  const locationLabel = `${location.city}${location.region ? `, ${location.region}` : ''}`
  const leadLocal = stories.localStories[0]?.title ?? 'No local lead available yet.'
  const leadTop = stories.topStories[0]?.title ?? 'No top story available yet.'
  const leadTrending = stories.trendingStories[0]?.title ?? 'No trending story available yet.'

  return {
    locationLabel,
    weather,
    localStories: stories.localStories,
    topStories: stories.topStories,
    trendingStories: stories.trendingStories,
    narration: `Good morning. In ${location.city}, it's ${weather.temperatureF} degrees and ${weather.condition.toLowerCase()}. Top story: ${leadTop}. Local lead: ${leadLocal}. Trending now: ${leadTrending}`,
  }
}
