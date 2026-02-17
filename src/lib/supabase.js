import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Registration functions
export async function submitRegistration(teamData, members) {
    // 1. Insert Team
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{ team_name: teamData.teamName }])
        .select()
        .single()

    if (teamError) throw teamError

    // 2. Prepare Member Data
    const membersToInsert = members.map((member, index) => ({
        team_id: team.id,
        full_name: member.fullName,
        reg_number: member.regNumber,
        gender: member.gender,
        dept: member.dept,
        year: member.year,
        section: member.section,
        email: member.email,
        mobile: member.mobile,
        is_leader: index === 0 // First member is leader
    }))

    // 3. Insert Members
    const { error: membersError } = await supabase
        .from('team_members')
        .insert(membersToInsert)

    if (membersError) {
        // Rollback team creation if members fail (manual rollback since Supabase-js doesn't support transactions easily in client)
        await supabase.from('teams').delete().eq('id', team.id)
        throw membersError
    }

    return team
}

export async function getRegistrations() {
    const { data, error } = await supabase
        .from('teams')
        .select(`
            *,
            team_members (*)
        `)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function deleteAllRegistrations() {
    const { error } = await supabase
        .from('teams')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows using UUID safe check

    if (error) throw error
}

export async function wipeAllData() {
    // 1. Delete Attendance
    // We use .not('id', 'is', null) which works for both UUID and BigInt/Int IDs
    const { error: attError } = await supabase
        .from('attendance')
        .delete()
        .not('id', 'is', null)

    if (attError) throw attError

    // 2. Delete Teams (cascades to team_members)
    const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .not('id', 'is', null)

    if (teamError) throw teamError
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

// BEFORE (exposes rows to anon):
// .select('*', { count: 'exact', head: true })

// AFTER (calls the secure function — returns count only):
export async function getRegistrationCount() {
    const { count, error } = await supabase
        .from('teams')
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

// =====================================================
// ATTENDANCE FUNCTIONS
// =====================================================

// Sanitise barcode / manual input:
//  - cast to string, trim whitespace
//  - strip BOM, null bytes, zero-width spaces, non-printable chars
//  - collapse internal whitespace
function sanitizeRegNumber(raw) {
    return String(raw)
        .trim()
        .replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\u200B-\u200D\u2060]/g, '') // invisible chars
        .replace(/\s+/g, ' ')  // collapse whitespace
        .trim()
}

// Updated to query team_members instead of registrations
export async function lookupRegistration(regNumber) {
    const cleanRegNumber = sanitizeRegNumber(regNumber)
    if (!cleanRegNumber) return null

    // We need to query team_members now
    const { data, error } = await supabase
        .from('team_members')
        .select('full_name, reg_number, dept, year, section')
        .eq('reg_number', cleanRegNumber)
        .single()

    if (error && error.code === 'PGRST116') return null // Not found
    if (error) throw error
    return data
}

// Fetch all individual members (for stats/verification)
export async function getAllMembers() {
    const { data, error } = await supabase
        .from('team_members')
        .select('*')

    if (error) throw error
    return data || []
}

export async function markAttendance(regNumber) {
    const cleanRegNumber = sanitizeRegNumber(regNumber)
    if (!cleanRegNumber) throw new Error('INVALID_INPUT')
    // First look up the student
    const student = await lookupRegistration(cleanRegNumber)
    if (!student) {
        throw new Error('NOT_FOUND')
    }

    // Mark attendance
    const { data, error } = await supabase
        .from('attendance')
        .insert([{
            reg_number: student.reg_number,
            full_name: student.full_name,
            dept: student.dept,
            year: student.year,
            section: student.section
        }])
        .select()

    if (error) {
        if (error.code === '23505') {
            throw new Error('ALREADY_CHECKED_IN')
        }
        throw error
    }
    return { ...data[0], student }
}

export async function getAttendance() {
    const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('checked_in_at', { ascending: false })

    if (error) throw error
    return data || []
}

export async function removeAttendance(regNumber) {
    const cleanRegNumber = sanitizeRegNumber(regNumber)
    const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('reg_number', cleanRegNumber)

    if (error) throw error
}

export async function clearAttendance() {
    const { error } = await supabase
        .from('attendance')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Updated to UUID safe check

    if (error) throw error
}
