# NiceClock — Codex Instructions

AI coding partner instructions for this project.
This file is the source of truth for any AI assistant (Codex, Cursor, Copilot, etc.) working in this repo.

---

## What this app is

**NiceClock** is a smart wake-up assistant built in Expo + React Native + TypeScript.

It is NOT a generic alarm clock.

Core loop:
1. User sets alarm time → Settings screen
2. Alarm fires → Wake screen appears
3. User confirms awake → Morning briefing screen
4. If ignored for 30s → Escalation screen → then briefing

Nothing else. Scope is locked.

---

## Current build status

**Phase 1 complete** — foundation, design system, all three alarm screens
**Phase 2 complete** — settings screen, custom time picker, AsyncStorage persistence

**What still needs building:**
- ElevenLabs TTS implementation in `hooks/useVoice.ts`
- Real time-matching alarm trigger (idle loop checks clock against `alarmTime`)
- Expo Notifications for background alarm firing
- Final polish pass (spacing, shadow, motion tuning)

See `SESSIONS.md` for full session history.

---

## Stack

| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54.0.33 | SDK |
| `react-native` | 0.81.5 | Framework |
| `typescript` | ~5.9.2 | Language (strict) |
| `expo-router` | ~6.0.23 | File-based routing |
| `react-native-reanimated` | ~4.1.1 | Animations |
| `expo-linear-gradient` | ~15.0.8 | Gradient backgrounds |
| `expo-speech` | ~14.0.8 | TTS fallback |
| `expo-haptics` | ~15.0.8 | Touch feedback |
| `react-native-safe-area-context` | ~5.6.0 | Safe area insets |
| `react-native-screens` | ~4.16.0 | Screen optimization |
| `@react-native-async-storage/async-storage` | 2.2.0 | Alarm time persistence |

**Install note:** `npm install` requires `--legacy-peer-deps` due to a react-dom peer conflict introduced by expo-router v6. Use `npx expo install <package>` then `npm install --legacy-peer-deps` if it fails.

---

## Project structure

```
app/
  _layout.tsx          ← root layout: AlarmProvider, SafeAreaProvider, Stack, StatusBar
  index.tsx            ← holds on dark screen while hydrating, then redirects by phase
  settings.tsx         ← alarm time picker (idle home screen)
  alarm/
    wake.tsx           ← Wake Trigger Screen
    escalation.tsx     ← Escalation Screen (fires after 30s of no response)
    briefing.tsx       ← Morning Briefing Screen

components/
  Screen.tsx           ← base screen wrapper (safe area, gradient or solid bg, padding)
  TimeDisplay.tsx      ← live animated clock hero with pulsing glow ring
  TimePicker.tsx       ← custom column picker (hour / minute / AM-PM)
  GlowButton.tsx       ← primary CTA: calm / urgent / ghost variants, pulse + haptics
  BriefingCard.tsx     ← stagger-animated info card with optional accent bar
  StatusPill.tsx       ← small uppercase label with dot indicator

constants/
  theme.ts             ← ALL design tokens (colors, type, spacing, radius, shadows, durations)

context/
  AlarmContext.tsx     ← useReducer state + AsyncStorage hydration on mount

data/
  mockDay.ts           ← static schedule + weather + voice scripts

hooks/
  useVoice.ts          ← ElevenLabs slot (reserved) + expo-speech fallback
  useAlarmTimer.ts     ← 30s countdown, fires escalation callback, clears on unmount
  useStorage.ts        ← loadAlarmTime() / saveAlarmTime() — typed AsyncStorage wrappers
```

---

## State

Managed in `context/AlarmContext.tsx` via `useReducer`. No external state library.

```typescript
type AlarmPhase = 'idle' | 'wake' | 'escalation' | 'briefing'

type AlarmState = {
  phase: AlarmPhase
  alarmTime: string              // "07:30" 24h format
  confirmedAt: number | null     // ms timestamp when user confirmed awake
  escalationFiredAt: number | null
  isHydrated: boolean            // false until AsyncStorage load resolves on mount
}
```

**Actions:**
| Action | Trigger |
|---|---|
| `HYDRATE` | Provider mount — loads saved alarmTime from AsyncStorage |
| `SET_ALARM_TIME` | Settings screen on "Set Alarm" |
| `ALARM_FIRED` | Settings "Set Alarm" tap (demo) / notification trigger (production) |
| `ESCALATION_TRIGGERED` | `useAlarmTimer` 30s countdown expires |
| `USER_CONFIRMED` | "I'm Awake" or "I'm Up Now" tap |
| `BRIEFING_ENTERED` | Unused currently — reserved |
| `RESET` | "Let's go" on briefing — returns to idle |

**Initial phase is `idle`** — app always opens on settings unless a phase is in progress.

**Persistence:** `setAlarmTime()` dispatches synchronously (UI updates immediately) then saves to AsyncStorage fire-and-forget. Storage failure is silent.

---

## Navigation flow

```
Launch
  └─ index.tsx (isHydrated=false) → hold on navy900 screen
  └─ index.tsx (isHydrated=true, phase=idle) → /settings

/settings
  └─ "Set Alarm" → setAlarmTime() + fireAlarm() → /alarm/wake

/alarm/wake
  └─ "I'm Awake" → confirmAwake() → /alarm/briefing
  └─ 30s timeout → triggerEscalation() → /alarm/escalation

/alarm/escalation
  └─ "I'm Up Now" → confirmAwake() → /alarm/briefing

/alarm/briefing
  └─ "Let's go" → reset() → / → index.tsx → /settings
```

**Rules:**
- All alarm flow navigation uses `router.replace()` — never `router.push()`
- No back navigation allowed inside the alarm flow
- Settings has no back button — it is the home screen

---

## Design system

All tokens live in `constants/theme.ts`. Never hardcode colors, sizes, or spacing inline.

### Three emotional palettes

| Phase | Background | Accent | Feel |
|---|---|---|---|
| **wake** | deep navy (`#050D1A → #1A2F50`) | amber glow | calm, alive |
| **escalation** | near-black → deep red | hard red | urgent, confrontational |
| **briefing** | warm cream (`#FAF7F2`) | amber accent | rewarding, clear |
| **settings** | same as wake | amber | continuous with wake |

**Amber is the constant visual thread** — it appears as a glow on wake, an active indicator on the TimePicker, an accent on briefing, and a CTA on settings. Settings intentionally shares the wake palette so the transition from idle → alarm feels continuous.

### Type scale

| Role | Size | Weight | Usage |
|---|---|---|---|
| Clock / TimePicker | 92px / 76px | 200 | Hero time display |
| Headline large | 34px | 600 | Screen headlines |
| Headline | 28px | 600 | Secondary headlines |
| Card value | 22px | 600 | Briefing card data |
| CTA | 17px | 600 | Button labels |
| Sub-label | 13px | 500 | Secondary text |
| Label | 11px uppercase | 600 | Card labels, status |
| Brand | 12px uppercase | 500 | NICECLOCK wordmark |

Base spacing unit: 8px. Screen padding: 28px horizontal.

### Animation rules

- Entrances only — no exit animations
- One dominant animation per screen
- Ambient loops: `Easing.inOut(Easing.sin)`
- Entrances: `Easing.out(Easing.cubic)`
- Entrance duration: 350–700ms
- Ambient loop duration: 1800–3000ms
- Card stagger: 150ms per card
- Nothing bounces on escalation

---

## Voice

Hook: `hooks/useVoice.ts`

Call pattern in every screen:
```typescript
const { speak } = useVoice()
useEffect(() => {
  const id = setTimeout(() => speak(voiceScripts.wake), 1000)
  return () => clearTimeout(id)
}, [speak])
```

Voice scripts live in `data/mockDay.ts` under `voiceScripts` — not in screens.

ElevenLabs slot is reserved in `useVoice.ts`. When API key is available, implement `speakWithElevenLabs()` — no screen changes required. Currently falls back to `expo-speech`.

---

## MVP scope — do not expand

### In scope
- Settings screen with time picker and persistence
- Wake trigger screen
- Escalation screen (30s timeout)
- Morning briefing screen
- Voice on each alarm screen
- Mock schedule + weather data

### Out of scope (do not add)
- Social features
- Chat or AI assistant UI
- Wearable / smart-home integrations
- Sleep tracking or habit analytics
- Backend, database, or auth
- Multi-user support

---

## Code style

- Strict TypeScript — no `any`
- No inline styles except trivial dynamic values
- All static styles in `StyleSheet.create()` at bottom of each file
- Animation shared values declared at component top, driven in `useEffect`
- Comments explain `why`, not `what`
- No Zustand — context + useReducer is sufficient

---

## Commands

```bash
npx expo start               # start dev server
npx tsc --noEmit             # type check (must pass clean)
npm install --legacy-peer-deps  # use this if npm install fails on new packages
```
