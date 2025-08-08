import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        message: 'Please add your OPENAI_API_KEY to the .env.local file'
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Test with a simple prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Tee Shine, a business and personal development expert. Give a brief, encouraging response.'
        },
        {
          role: 'user',
          content: 'Test if AI is working properly'
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content

    return NextResponse.json({
      success: true,
      message: 'AI integration is working!',
      response: response,
      model: 'gpt-4'
    })

  } catch (error) {
    console.error('AI test error:', error)
    return NextResponse.json({
      success: false,
      error: 'AI test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
