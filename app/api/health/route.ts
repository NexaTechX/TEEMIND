import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check Supabase connection
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          error: error.message 
        },
        { status: 500 }
      )
    }

    // Check OpenAI API key
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        openai: hasOpenAIKey ? 'configured' : 'missing_key'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}