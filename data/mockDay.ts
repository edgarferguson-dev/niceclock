export type LockScreenGlanceKey = 'weather' | 'leaveBy' | 'topTask'

export interface DayActivity {
  id: string
  title: string
  startTime: string
  endTime: string
  detail?: string
  location?: string
}

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
    icon: string
  }
  topTask: string
  activities: DayActivity[]
  lockScreen: {
    allowedGlances: LockScreenGlanceKey[]
  }
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
    icon: 'Clear',
  },
  topTask: 'Review chapter 3 before class',
  activities: [
    {
      id: 'prep',
      title: 'Wake and reset',
      startTime: '06:45',
      endTime: '07:15',
      detail: 'Hydrate, open the blinds, and let the room brighten.',
    },
    {
      id: 'breakfast',
      title: 'Breakfast window',
      startTime: '07:15',
      endTime: '07:45',
      detail: 'Keep it light and steady before leaving.',
    },
    {
      id: 'commute',
      title: 'Leave for campus',
      startTime: '08:15',
      endTime: '08:45',
      detail: 'Give yourself margin before the first room fills up.',
      location: 'Main transit line',
    },
    {
      id: 'class',
      title: 'Design Systems',
      startTime: '09:00',
      endTime: '10:30',
      detail: 'Room 204. Bring the critique notes.',
      location: 'Room 204',
    },
    {
      id: 'review',
      title: 'Chapter 3 review',
      startTime: '11:00',
      endTime: '11:45',
      detail: 'Focus on the examples you flagged yesterday.',
    },
    {
      id: 'lunch',
      title: 'Lunch and reset',
      startTime: '12:15',
      endTime: '13:00',
      detail: 'Keep the middle of the day soft before the next push.',
    },
  ],
  lockScreen: {
    allowedGlances: ['weather', 'leaveBy'],
  },
}

export function getSelectedLockScreenGlances(day: DaySchedule) {
  return day.lockScreen.allowedGlances.map((key) => {
    switch (key) {
      case 'weather':
        return {
          key,
          label: 'Weather',
          value: `${day.weather.condition} ${day.weather.tempF}F`,
        }
      case 'leaveBy':
        return {
          key,
          label: 'Leave by',
          value: day.leaveBy,
        }
      case 'topTask':
        return {
          key,
          label: 'Top task',
          value: day.topTask,
        }
    }
  })
}

export const voiceScripts = {
  wake: 'Good morning. Time to start your day.',
  escalation: "Hey. You're going to be late. Get up now.",
  briefing: `Your first class is ${mockDay.firstActivity.label} at ${mockDay.firstActivity.time}. Leave by ${mockDay.leaveBy}.`,
} as const
