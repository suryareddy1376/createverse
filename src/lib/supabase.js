import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydfzenbuxadtfrdbqpce.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZnplbmJ1eGFkdGZyZGJxcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDY5MTAsImV4cCI6MjA4NjIyMjkxMH0.FjmFxTfnZJb0b3f712JeNhWSSx3Nbe4QNcEnpLqI-6M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Registration functions
export async function submitRegistration(data) {
    const { data: result, error } = await supabase
        .from('registrations')
        .insert([{
            full_name: data.fullName,
            reg_number: data.regNumber,
            section: data.section,
            email: data.email,
            mobile: data.mobile,
            created_at: new Date().toISOString()
        }])
        .select()

    if (error) throw error
    return result
}

export async function getRegistrations() {
    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function deleteAllRegistrations() {
    const { error } = await supabase
        .from('registrations')
        .delete()
        .neq('id', 0) // Delete all rows

    if (error) throw error
}

export async function getSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'registrations_open')
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.value === 'true'
}

export async function setRegistrationsOpen(isOpen) {
    const { error } = await supabase
        .from('settings')
        .upsert({
            key: 'registrations_open',
            value: isOpen ? 'true' : 'false'
        }, { onConflict: 'key' })

    if (error) throw error
}
