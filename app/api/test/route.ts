import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  })
}
