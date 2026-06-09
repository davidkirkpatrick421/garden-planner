// Obstacle state; triggers heat map recalc on change.
// STUB — CLAUDE.md §Obstacle System (shade-casting vs feature categories).
import { useState } from 'react'
import type { Obstacle } from '../types'

export interface UseObstaclesResult {
  obstacles: Obstacle[]
  addObstacle: (obstacle: Obstacle) => void
  removeObstacle: (id: string) => void
}

export function useObstacles(): UseObstaclesResult {
  const [obstacles, setObstacles] = useState<Obstacle[]>([])

  // TODO: trigger heat map recalc on add/remove for shade-casting obstacles.
  return {
    obstacles,
    addObstacle: (obstacle) => setObstacles((prev) => [...prev, obstacle]),
    removeObstacle: (id) =>
      setObstacles((prev) => prev.filter((o) => o.id !== id)),
  }
}
