import { NextRequest, NextResponse } from 'next/server'
import { searchKnowledge } from '@/lib/knowledge-base'

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const results = await searchKnowledge(query, limit)

    return NextResponse.json({
      query,
      results,
      count: results.length
    })
  } catch (error) {
    console.error('Knowledge search error:', error)
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    )
  }
}