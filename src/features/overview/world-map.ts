import DottedMap from "dotted-map"

import { cities, type CityCode } from "@/features/overview/cities"

export type WorldMapData = {
  width: number
  height: number
  /** Land dots, as [x, y] in map units. */
  dots: [number, number][]
  /** Each city's dot. */
  cities: Record<CityCode, [number, number]>
}

let cached: WorldMapData | null = null

/**
 * The dotted world map for the Overview's live traffic, computed once on the server and sent as
 * plain coordinates — the map data itself never reaches the browser. Import only from server code.
 */
export function getWorldMap(): WorldMapData {
  if (cached) return cached
  const map = new DottedMap({ height: 56, grid: "diagonal", region: { lat: { min: -50, max: 72 }, lng: { min: -168, max: 180 } } })
  const dots = map.getPoints().map((p) => [p.x, p.y] as [number, number])
  const pins = Object.fromEntries(
    (Object.keys(cities) as CityCode[]).map((code) => {
      const pin = map.getPin({ lat: cities[code].lat, lng: cities[code].lon })
      return [code, pin ? [pin.x, pin.y] : [0, 0]]
    })
  ) as Record<CityCode, [number, number]>
  cached = { width: map.image.width, height: map.image.height, dots, cities: pins }
  return cached
}
