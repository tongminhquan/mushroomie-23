'use client'

import { useEffect } from 'react'
import clarity from '@microsoft/clarity'

export default function ClarityInit() {
  useEffect(() => {
    clarity.init('wztywnpske')
  }, [])

  return null
}
