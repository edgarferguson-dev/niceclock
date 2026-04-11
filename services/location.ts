export interface LocationContext {
  latitude: number
  longitude: number
  city: string
  region: string
}

export const DEFAULT_LOCATION: LocationContext = {
  latitude: 40.7128,
  longitude: -74.006,
  city: 'New York',
  region: 'NY',
}

export async function getLocationContext(): Promise<LocationContext> {
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
