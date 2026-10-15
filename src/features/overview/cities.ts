/**
 * Where traffic is attributed on the live map. The API reports a city code per request
 * (GET /v1/traffic → requests[].city); coordinates live here so the map can place them.
 */
export const cities = {
  LOS: { name: "Lagos", lat: 6.52, lon: 3.38 },
  ABV: { name: "Abuja", lat: 9.08, lon: 7.4 },
  ACC: { name: "Accra", lat: 5.6, lon: -0.19 },
  NBO: { name: "Nairobi", lat: -1.29, lon: 36.82 },
  JNB: { name: "Johannesburg", lat: -26.2, lon: 28.05 },
  CAI: { name: "Cairo", lat: 30.04, lon: 31.24 },
  LON: { name: "London", lat: 51.51, lon: -0.13 },
  FRA: { name: "Frankfurt", lat: 50.11, lon: 8.68 },
  NYC: { name: "New York", lat: 40.71, lon: -74.0 },
  SFO: { name: "San Francisco", lat: 37.77, lon: -122.42 },
  TOR: { name: "Toronto", lat: 43.65, lon: -79.38 },
  GRU: { name: "São Paulo", lat: -23.55, lon: -46.63 },
  DXB: { name: "Dubai", lat: 25.2, lon: 55.27 },
  BOM: { name: "Mumbai", lat: 19.08, lon: 72.88 },
  SIN: { name: "Singapore", lat: 1.35, lon: 103.82 },
  TYO: { name: "Tokyo", lat: 35.68, lon: 139.69 },
  SYD: { name: "Sydney", lat: -33.87, lon: 151.21 },
} as const

export type CityCode = keyof typeof cities
export const cityCodes = Object.keys(cities) as CityCode[]
