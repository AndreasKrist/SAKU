'use server'

import { createClient } from '@/lib/supabase/server'

export async function logActivity(data: {
  business_id: string
  user_id: string
  action: string
  entity_type?: string | null
  entity_id?: string | null
  details?: Record<string, any>
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('activity_logs').insert({
    business_id: data.business_id,
    user_id: data.user_id,
    action: data.action,
    entity_type: data.entity_type || null,
    entity_id: data.entity_id || null,
    details: data.details || null,
  })

  if (error) {
    console.error('Failed to log activity:', error)
  }
}
