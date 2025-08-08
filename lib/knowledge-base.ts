import OpenAI from 'openai'
import { supabase } from './supabase'
import fs from 'fs'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface KnowledgeChunk {
  id: string
  content: string
  metadata: {
    source: string
    section?: string
    type: string
  }
  embedding?: number[]
}

interface SearchResult {
  content: string
  metadata: any
  similarity: number
}

// Load and process knowledge from markdown files
export async function loadKnowledgeFromDirectory(dirPath: string = 'knowledge'): Promise<KnowledgeChunk[]> {
  const chunks: KnowledgeChunk[] = []
  
  try {
    const files = fs.readdirSync(dirPath)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    
    for (const file of markdownFiles) {
      const filePath = path.join(dirPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Split content into chunks (by sections or paragraphs)
      const sections = splitIntoChunks(content, file)
      chunks.push(...sections)
    }
  } catch (error) {
    console.error('Error loading knowledge files:', error)
  }
  
  return chunks
}

// Split markdown content into meaningful chunks
function splitIntoChunks(content: string, filename: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = []
  
  // Split by markdown headers (## or ###)
  const sections = content.split(/(?=^#{1,3}\s)/m)
  
  sections.forEach((section, index) => {
    if (section.trim().length === 0) return
    
    // Extract section title
    const titleMatch = section.match(/^#{1,3}\s(.+)$/m)
    const sectionTitle = titleMatch ? titleMatch[1] : `Section ${index + 1}`
    
    // For large sections, split into paragraphs
    const paragraphs = section.split('\n\n').filter(p => p.trim().length > 50)
    
    if (paragraphs.length <= 1) {
      // Small section, keep as one chunk
      chunks.push({
        id: `${filename}_${index}`,
        content: section.trim(),
        metadata: {
          source: filename,
          section: sectionTitle,
          type: 'section'
        }
      })
    } else {
      // Large section, split into paragraphs
      paragraphs.forEach((paragraph, pIndex) => {
        chunks.push({
          id: `${filename}_${index}_${pIndex}`,
          content: paragraph.trim(),
          metadata: {
            source: filename,
            section: sectionTitle,
            type: 'paragraph'
          }
        })
      })
    }
  })
  
  return chunks
}

// Generate embeddings for knowledge chunks
export async function generateEmbeddings(chunks: KnowledgeChunk[]): Promise<KnowledgeChunk[]> {
  const chunksWithEmbeddings: KnowledgeChunk[] = []
  
  for (const chunk of chunks) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.content,
      })
      
      chunksWithEmbeddings.push({
        ...chunk,
        embedding: response.data[0].embedding
      })
    } catch (error) {
      console.error(`Error generating embedding for chunk ${chunk.id}:`, error)
      chunksWithEmbeddings.push(chunk)
    }
  }
  
  return chunksWithEmbeddings
}

// Store knowledge chunks in Supabase
export async function storeKnowledgeChunks(chunks: KnowledgeChunk[]): Promise<void> {
  const { error } = await supabase
    .from('knowledge_chunks')
    .upsert(
      chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: chunk.embedding
      }))
    )
  
  if (error) {
    console.error('Error storing knowledge chunks:', error)
    throw error
  }
}

// Search knowledge base using semantic similarity
export async function searchKnowledge(query: string, limit: number = 5): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    
    // Search for similar chunks using Supabase's vector similarity
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: queryEmbedding.data[0].embedding,
      match_threshold: 0.7,
      match_count: limit
    })
    
    if (error) {
      console.error('Error searching knowledge:', error)
      return []
    }
    
    return data.map((item: any) => ({
      content: item.content,
      metadata: item.metadata,
      similarity: item.similarity
    }))
  } catch (error) {
    console.error('Error in knowledge search:', error)
    return []
  }
}

// Get relevant context for a user query
export async function getRelevantContext(query: string): Promise<string> {
  const searchResults = await searchKnowledge(query, 3)
  
  if (searchResults.length === 0) {
    return ''
  }
  
  const context = searchResults
    .map(result => `[From ${result.metadata.source}]: ${result.content}`)
    .join('\n\n')
  
  return context
}