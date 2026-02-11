import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Registration functions
export async function submitRegistration(data) {
    const { data: result, error } = await supabase
        .from('registrations')
        .insert([{
            full_name: data.fullName,
            reg_number: data.regNumber,
            dept: data.dept,
            year: data.year,
            section: data.section,
            email: data.email,
            mobile: data.mobile,
            created_at: new Date().toISOString()
        }])
        .select()

    if (error) {
        // Handle duplicate registration errors
        if (error.code === '23505') {
            if (error.message.includes('unique_reg_number')) {
                throw new Error('This registration number is already registered.')
            }
            if (error.message.includes('unique_email')) {
                throw new Error('This email is already registered.')
            }
            throw new Error('You have already registered.')
        }
        throw error
    }
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

// Registration limit functions
export async function getRegistrationLimit() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'registration_limit')
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return parseInt(data?.value || '0', 10) // 0 means unlimited
}

export async function setRegistrationLimit(limit) {
    const { error } = await supabase
        .from('settings')
        .upsert({
            key: 'registration_limit',
            value: limit.toString()
        }, { onConflict: 'key' })

    if (error) throw error
}

// Count-only query — does NOT expose any registration data
export async function getRegistrationCount() {
    const { count, error } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
}

export async function checkCanRegister() {
    const [limit, count] = await Promise.all([
        getRegistrationLimit(),
        getRegistrationCount()
    ])

    // 0 means unlimited
    if (limit === 0) return { canRegister: true, currentCount: count, limit: 0 }

    return {
        canRegister: count < limit,
        currentCount: count,
        limit
    }
}
