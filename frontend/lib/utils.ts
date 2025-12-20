/**
 * Utility functions
 */

import { useState, useEffect } from 'react'

/**
 * Format a date string consistently for both server and client
 * Uses UTC to avoid timezone differences between server and client
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    // Use UTC methods to ensure consistency between server and client
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    
    const formattedHours = hours.toString().padStart(2, '0')
    const formattedMinutes = minutes.toString().padStart(2, '0')
    
    return `${monthNames[month]} ${day}, ${year} at ${formattedHours}:${formattedMinutes}`
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Format a date string for short display (date only, no time)
 */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return `${monthNames[month]} ${day}, ${year}`
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Hook to check if component is mounted on client
 * Useful for preventing hydration mismatches
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  return isMounted
}

