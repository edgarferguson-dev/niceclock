import { fetchJson } from './http'

export interface LocalScore {
  id: string
  league: string
  team: string
  opponent: string
  status: string
  detail: string
  teamScore?: string
  opponentScore?: string
  state: 'live' | 'upcoming' | 'final'
}

interface ScoreboardResponse {
  events?: ScoreEvent[]
}

interface ScoreEvent {
  id?: string
  competitions?: ScoreCompetition[]
}

interface ScoreCompetition {
  competitors?: ScoreCompetitor[]
  status?: {
    type?: {
      name?: string
      shortDetail?: string
      description?: string
      detail?: string
    }
  }
  note?: {
    headline?: string
  }
}

interface ScoreCompetitor {
  score?: string
  team?: {
    displayName?: string
    shortDisplayName?: string
    abbreviation?: string
  }
}

const LOCAL_TEAMS = new Set([
  'New York Knicks',
  'Brooklyn Nets',
  'New York Yankees',
  'New York Mets',
  'New York Giants',
  'New York Jets',
  'New York Rangers',
  'New York Islanders',
  'New Jersey Devils',
])

const SCOREBOARD_ENDPOINTS = [
  { league: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  { league: 'MLB', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard' },
  { league: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
  { league: 'NHL', url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard' },
] as const

function parseScoreState(state?: string): LocalScore['state'] {
  if (state === 'STATUS_IN_PROGRESS' || state === 'STATUS_HALFTIME') return 'live'
  if (state === 'STATUS_FINAL') return 'final'
  return 'upcoming'
}

function rankScore(score: LocalScore): number {
  if (score.state === 'live') return 0
  if (score.state === 'upcoming') return 1
  return 2
}

export async function fetchLocalScores(): Promise<LocalScore[]> {
  try {
    const boards = await Promise.all(
      SCOREBOARD_ENDPOINTS.map(async ({ league, url }) => {
        const data = await fetchJson<ScoreboardResponse>(url)
        const events = Array.isArray(data?.events) ? data.events : []

        return events.flatMap((event) => {
          const competition = event?.competitions?.[0]
          const competitors = Array.isArray(competition?.competitors) ? competition.competitors : []
          const localTeam = competitors.find((competitor) => {
            const displayName = competitor?.team?.displayName
            return displayName ? LOCAL_TEAMS.has(displayName) : false
          })

          if (!localTeam) return []

          const opponent = competitors.find((competitor) => competitor !== localTeam)
          const statusType = competition?.status?.type
          const state = parseScoreState(statusType?.name)

          return [{
            id: `${league}-${event?.id ?? localTeam?.team?.abbreviation}`,
            league,
            team: localTeam?.team?.shortDisplayName ?? localTeam?.team?.displayName ?? 'Local team',
            opponent: opponent?.team?.shortDisplayName ?? opponent?.team?.displayName ?? 'Opponent',
            status: statusType?.shortDetail ?? competition?.status?.type?.detail ?? 'Awaiting update',
            detail: statusType?.description ?? competition?.note?.headline ?? 'Morning score update',
            teamScore: localTeam?.score,
            opponentScore: opponent?.score,
            state,
          } satisfies LocalScore]
        })
      })
    )

    return boards
      .flat()
      .sort((a, b) => rankScore(a) - rankScore(b))
      .slice(0, 3)
  } catch {
    return []
  }
}
