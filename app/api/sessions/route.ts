import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Check environment variables
const checkEnvVars = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

// Get all sessions
export async function GET(request: NextRequest) {
  try {
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Sessions API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// Create a new session
export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    checkEnvVars()
    
    const { title = 'New Chat' } = await request.json()

    const sessionId = uuidv4()
    
    console.log('Creating session with ID:', sessionId)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        id: sessionId,
        title,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating session:', error)
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      )
    }

    console.log('Session created successfully:', session)
    return NextResponse.json({ 
      session: session || { 
        id: sessionId, 
        title, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      } 
    })
  } catch (error: any) {
    console.error('Create Session API Error:', error)
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    )
  }
}