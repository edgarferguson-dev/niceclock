import type { LocationContext } from './location'

export interface MorningWeather {
  temperatureF: number
  highF: number
  lowF: number
  condition: string
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

export async function fetchWeather(location: LocationContext): Promise<MorningWeather> {
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
