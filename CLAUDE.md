# NiceClock — Claude Instructions

AI coding partner instructions for this project.
This file is the source of truth for any AI assistant (Claude, Cursor, Copilot, etc.) working in this repo.

---

## What this app is

**NiceClock** is a smart wake-up assistant built in Expo + React Native + TypeScript.

It is NOT a generic alarm clock.

Core loop:
1. Alarm fires → Wake screen appears
2. User confirms awake → Morning briefing screen
3. If ignored for 30s → Escalation screen → then briefing

Nothing else. Scope is locked.

---

## Stack

- **Expo** (SDK 54)
- **React Native** (0.81)
- **TypeScript** (strict)
- **Expo Router** (file-based routing, v6)
- **React Native Reanimated** (animations)
- **expo-linear-gradient** (backgrounds)
- **expo-speech** (TTS fallback)
- **expo-haptics** (touch feedback)
- **react-native-safe-area-context** (insets)

---

## Project structure

```
app/
  _layout.tsx          ← root layout, AlarmProvider, StatusBar
  index.tsx            ← redirects based on alarm phase
  alarm/
    wake.tsx           ← Wake Trigger Screen
    escalation.tsx     ← Escalation Screen
    briefing.tsx       ← Morning Briefing Screen

components/
  Screen.tsx           ← base screen wrapper (safe area, gradient, padding)
  TimeDisplay.tsx      ← animated live clock hero
  GlowButton.tsx       ← primary CTA with pulse animation
  BriefingCard.tsx     ← stagger-animated info card
  StatusPill.tsx       ← small status label with dot

constants/
  theme.ts             ← ALL design tokens (colors, type, spacing, radius, shadows)

context/
  AlarmContext.tsx     ← useReducer state: phase, alarmTime, timestamps

data/
  mockDay.ts           ← static schedule + weather + voice scripts

hooks/
  useVoice.ts          ← ElevenLabs (slot ready) + expo-speech fallback
  useAlarmTimer.ts     ← 30s countdown, fires escalation
```

---

## State

Managed in `context/AlarmContext.tsx` via `useReducer`. No external state library.

```typescript
type AlarmPhase = 'idle' | 'wake' | 'escalation' | 'briefing'

type AlarmState = {
  phase: AlarmPhase
  alarmTime: string        // "07:30"
  confirmedAt: number | null
  escalationFiredAt: number | null
}
```

Actions: `SET_ALARM_TIME` | `ALARM_FIRED` | `ESCALATION_TRIGGERED` | `USER_CONFIRMED` | `BRIEFING_ENTERED` | `RESET`

---

## Design system

All tokens live in `constants/theme.ts`. Never hardcode colors, sizes, or spacing inline.

Three emotional palettes — one per screen phase:
- **wake** → deep navy + amber glow
- **escalation** → near-black + deep red
- **briefing** → warm off-white + amber accent

Amber is the constant thread across all three phases.

Type scale: clock (92px weight 200) → headline (34px weight 600) → card value (22px weight 600) → label (11px uppercase weight 600).

Base spacing unit: 8px. Screen padding: 28px horizontal.

---

## Animation rules

- Entrances only, no exit animations
- One dominant animation per screen
- Ambient loops use `Easing.inOut(Easing.sin)`
- Entrances use `Easing.out(Easing.cubic)`
- Entrance duration: 350–700ms
- Ambient loop duration: 1800–3000ms
- Card stagger: 150ms per card
- Nothing bounces on the escalation screen

---

## Voice

Hook: `hooks/useVoice.ts`

Call pattern in screens:
```typescript
const { speak } = useVoice()
useEffect(() => {
  const id = setTimeout(() => speak(voiceScripts.wake), 1000)
  return () => clearTimeout(id)
}, [speak])
```

Voice scripts are in `data/mockDay.ts` under `voiceScripts`.

ElevenLabs slot is reserved in `useVoice.ts`. When API key is available, implement `speakWithElevenLabs` — no screen changes required.

---

## Navigation rules

- All alarm flow navigation uses `router.replace()` — never `router.push()`
- No back navigation allowed inside the alarm flow
- `index.tsx` reads `phase` from context and redirects

---

## MVP scope — do not expand

### In scope
- Wake trigger screen
- Escalation screen (30s timeout)
- Morning briefing screen
- Voice on each screen
- Mock schedule + weather data

### Out of scope (do not add)
- Social features
- Chat or AI assistant UI
- Wearable / smart-home integrations
- Sleep tracking
- Analytics dashboards
- Backend or database
- Auth
- Multi-user

---

## Code style

- Strict TypeScript — no `any`
- No inline styles except trivial dynamic values
- All static styles go in `StyleSheet.create()` at the bottom of each file
- Animation shared values declared at component top, driven in `useEffect`
- Comments on `why`, not `what`
- No Zustand — keep state in context unless there's a real reason to change

---

## Commands

```bash
npx expo start          # start dev server
npx tsc --noEmit        # type check
```

---

## What to build next (see SESSIONS.md for current status)

1. Settings screen — alarm time picker, AsyncStorage persistence
2. ElevenLabs integration in `useVoice.ts`
3. Real alarm trigger logic in `index.tsx` (time matching)
4. Polish pass — spacing, shadow, motion tuning
