import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { loadAlarmTime, saveAlarmTime } from '../hooks/useStorage'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlarmPhase = 'idle' | 'wake' | 'escalation' | 'briefing'

export interface AlarmState {
  phase: AlarmPhase
  alarmTime: string             // "07:30" 24h format
  confirmedAt: number | null    // ms timestamp when user confirmed awake
  escalationFiredAt: number | null
  isHydrated: boolean           // false until AsyncStorage load resolves
}

type AlarmAction =
  | { type: 'HYDRATE'; payload: { alarmTime: string } }
  | { type: 'SET_ALARM_TIME'; payload: string }
  | { type: 'ALARM_FIRED' }
  | { type: 'ESCALATION_TRIGGERED' }
  | { type: 'USER_CONFIRMED' }
  | { type: 'BRIEFING_ENTERED' }
  | { type: 'RESET' }

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: AlarmState = {
  phase: 'idle',
  alarmTime: '07:30',
  confirmedAt: null,
  escalationFiredAt: null,
  isHydrated: false,
}

function alarmReducer(state: AlarmState, action: AlarmAction): AlarmState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        alarmTime: action.payload.alarmTime,
        isHydrated: true,
      }

    case 'SET_ALARM_TIME':
      return { ...state, alarmTime: action.payload }

    case 'ALARM_FIRED':
      return { ...state, phase: 'wake' }

    case 'ESCALATION_TRIGGERED':
      return {
        ...state,
        phase: 'escalation',
        escalationFiredAt: Date.now(),
      }

    case 'USER_CONFIRMED':
      return {
        ...state,
        phase: 'briefing',
        confirmedAt: Date.now(),
      }

    case 'BRIEFING_ENTERED':
      return { ...state, phase: 'briefing' }

    case 'RESET':
      return {
        ...initialState,
        phase: 'idle',
        alarmTime: state.alarmTime,
        isHydrated: true, // preserve hydrated state after reset
      }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AlarmContextValue {
  state: AlarmState
  fireAlarm: () => void
  triggerEscalation: () => void
  confirmAwake: () => void
  reset: () => void
  setAlarmTime: (time: string) => void
}

const AlarmContext = createContext<AlarmContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(alarmReducer, initialState)

  // Hydrate from storage on mount.
  // Dispatches HYDRATE once — index.tsx waits for isHydrated before redirecting.
  useEffect(() => {
    loadAlarmTime().then((saved) => {
      dispatch({
        type: 'HYDRATE',
        payload: { alarmTime: saved ?? '07:30' },
      })
    })
  }, [])

  const fireAlarm = useCallback(() => dispatch({ type: 'ALARM_FIRED' }), [])
  const triggerEscalation = useCallback(() => dispatch({ type: 'ESCALATION_TRIGGERED' }), [])
  const confirmAwake = useCallback(() => dispatch({ type: 'USER_CONFIRMED' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  // Dispatch is sync (UI updates immediately). Storage save is fire-and-forget.
  const setAlarmTime = useCallback((time: string) => {
    dispatch({ type: 'SET_ALARM_TIME', payload: time })
    saveAlarmTime(time)
  }, [])

  return (
    <AlarmContext.Provider
      value={{ state, fireAlarm, triggerEscalation, confirmAwake, reset, setAlarmTime }}
    >
      {children}
    </AlarmContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAlarm() {
  const ctx = useContext(AlarmContext)
  if (!ctx) throw new Error('useAlarm must be used within AlarmProvider')
  return ctx
}
