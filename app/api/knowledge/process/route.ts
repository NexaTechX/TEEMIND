import { NextRequest, NextResponse } from 'next/server'
import { loadKnowledgeFromDirectory, generateEmbeddings, storeKnowledgeChunks } from '@/lib/knowledge-base'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting knowledge processing...')
    
    // Load knowledge from markdown files in knowledge/ directory
    const chunks = await loadKnowledgeFromDirectory('knowledge')
    console.log(`Loaded ${chunks.length} knowledge chunks`)
    
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No knowledge files found in knowledge/ directory' },
        { status: 400 }
      )
    }
    
    // Generate embeddings for all chunks
    console.log('Generating embeddings...')
    const chunksWithEmbeddings = await generateEmbeddings(chunks)
    console.log(`Generated embeddings for ${chunksWithEmbeddings.length} chunks`)
    
    // Store in Supabase
    console.log('Storing knowledge chunks in database...')
    await storeKnowledgeChunks(chunksWithEmbeddings)
    console.log('Knowledge processing completed successfully')
    
    return NextResponse.json({
      message: 'Knowledge base processed successfully',
      chunksProcessed: chunksWithEmbeddings.length,
      sources: Array.from(new Set(chunks.map(c => c.metadata.source)))
    })
  } catch (error) {
    console.error('Knowledge processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: 'Failed to process knowledge base', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get knowledge base statistics
    const chunks = await loadKnowledgeFromDirectory('knowledge')
    const sources = Array.from(new Set(chunks.map(c => c.metadata.source)))
    
    return NextResponse.json({
      availableFiles: sources,
      totalChunks: chunks.length,
      status: 'ready'
    })
  } catch (error) {
    console.error('Error getting knowledge status:', error)
    return NextResponse.json(
      { error: 'Failed to get knowledge status' },
      { status: 500 }
    )
  }
}