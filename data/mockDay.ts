export interface DaySchedule {
  greeting: string
  firstActivity: {
    label: string
    time: string
    location?: string
  }
  leaveBy: string
  weather: {
    condition: string
    tempF: number
    icon: string // emoji for MVP
  }
  topTask: string
}

export const mockDay: DaySchedule = {
  greeting: 'Good morning.',
  firstActivity: {
    label: 'Design Systems',
    time: '9:00 AM',
    location: 'Room 204',
  },
  leaveBy: '8:15 AM',
  weather: {
    condition: 'Clear',
    tempF: 62,
    icon: '☀️',
  },
  topTask: 'Review chapter 3 before class',
}

// Voice script derived from mock data — keeps voice logic out of components
export const voiceScripts = {
  wake: 'Good morning. Time to start your day.',
  escalation: "Hey. You're going to be late. Get up now.",
  briefing: `Your first class is ${mockDay.firstActivity.label} at ${mockDay.firstActivity.time}. Leave by ${mockDay.leaveBy}.`,
} as const
