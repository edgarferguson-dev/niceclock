import type { LocationContext } from './location'
import { fetchText } from './http'

export interface MorningStory {
  title: string
  source: string
  link: string
  summary: string
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

function buildStorySummary(title: string, description: string): string {
  const cleanDescription = description
    .replace(title, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleanDescription.length >= 36) {
    return cleanDescription.slice(0, 110).trim()
  }

  if (title.includes(':')) {
    return title.split(':').slice(1).join(':').trim()
  }

  return 'A concise local briefing for the morning surface.'
}

function parseGoogleNewsFeed(xml: string, limit: number): MorningStory[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((match) => {
      const block = match[1]
      const source = getTag(block, 'source') || 'Google News'
      const rawTitle = getTag(block, 'title')
      const description = getTag(block, 'description')
      const title = source && rawTitle.endsWith(` - ${source}`)
        ? rawTitle.slice(0, -(source.length + 3)).trim()
        : rawTitle

      return {
        title,
        source,
        link: getTag(block, 'link'),
        summary: buildStorySummary(title, description),
      }
    })
    .filter((story) => story.title.length > 0)
}

export async function fetchNews(location: LocationContext) {
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
