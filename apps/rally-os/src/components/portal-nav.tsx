'use client'

import { Nav } from '@rally/ui'
import { navItems } from '../lib/nav-items'

/**
 * Client wrapper around the shared Nav. navItems carry lucide-react icon
 * components, which cannot be serialized across the Server→Client boundary, so
 * the items are bound to Nav here (entirely within the client module graph)
 * rather than passed down from the server layout.
 */
export function PortalNav() {
  return <Nav items={navItems} />
}
