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

function parseRssFeed(xml: string, limit: number, fallbackSource: string): MorningStory[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((match) => {
      const block = match[1]
      const source = getTag(block, 'source') || fallbackSource
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

const FEEDS = {
  top: {
    url: 'https://feeds.npr.org/1001/rss.xml',
    source: 'NPR',
  },
  trending: {
    url: 'https://feeds.npr.org/1004/rss.xml',
    source: 'NPR',
  },
  local: {
    url: 'https://gothamist.com/feed',
    source: 'Gothamist',
  },
} as const

export async function fetchNews(_location: LocationContext) {
  const topFeedUrl = FEEDS.top.url
  const localFeedUrl = FEEDS.local.url
  const trendingFeedUrl = FEEDS.trending.url

  const [topXml, localXml, trendingXml] = await Promise.all([
    fetchText(topFeedUrl),
    fetchText(localFeedUrl),
    fetchText(trendingFeedUrl),
  ])

  return {
    topStories: parseRssFeed(topXml, 5, FEEDS.top.source),
    localStories: parseRssFeed(localXml, 4, FEEDS.local.source),
    trendingStories: parseRssFeed(trendingXml, 4, FEEDS.trending.source),
  }
}
