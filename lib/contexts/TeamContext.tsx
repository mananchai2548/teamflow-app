'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Team, Profile } from '@/lib/types'

type TeamContextType = {
  currentTeam: Team | null
  setCurrentTeam: (team: Team | null) => void
  userProfile: Profile | null
  setUserProfile: (profile: Profile | null) => void
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)

  return (
    <TeamContext.Provider value={{ currentTeam, setCurrentTeam, userProfile, setUserProfile }}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}
