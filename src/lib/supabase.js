import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://flyitjdpcnsuyiixngnx.supabase.co'
const supabaseKey = 'sb_publishable_3k5raskn5fL9wsvNDpGkBw_EynjhGt-'

export const supabase = createClient(supabaseUrl, supabaseKey)