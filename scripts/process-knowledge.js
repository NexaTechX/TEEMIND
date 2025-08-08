const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Check if required environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract text from PDF files
async function extractPdfText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error extracting PDF text from ${filePath}:`, error);
    return '';
  }
}

// Extract text from DOCX files
async function extractDocxText(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error(`Error extracting DOCX text from ${filePath}:`, error);
    return '';
  }
}

// Split content into meaningful chunks (works for markdown, PDF, and DOCX)
function splitIntoChunks(content, filename) {
  const chunks = [];
  const isPdf = filename.endsWith('.pdf');
  const isDocx = filename.endsWith('.docx');
  
  if (isPdf || isDocx) {
    // For PDFs, split by paragraphs and sections
    const sections = content.split(/\n\s*\n/).filter(section => section.trim().length > 100);
    
    sections.forEach((section, index) => {
      const trimmedSection = section.trim();
      if (trimmedSection.length === 0) return;
      
      // Try to extract a title from the first line
      const lines = trimmedSection.split('\n');
      const possibleTitle = lines[0].trim();
      const sectionTitle = possibleTitle.length < 100 ? possibleTitle : `Section ${index + 1}`;
      
      // Split large sections into smaller chunks
      if (trimmedSection.length > 1000) {
        const sentences = trimmedSection.split(/[.!?]+\s+/).filter(s => s.trim().length > 50);
        const chunkSize = 3; // Group sentences into chunks
        
        for (let i = 0; i < sentences.length; i += chunkSize) {
          const chunkSentences = sentences.slice(i, i + chunkSize);
          const chunkContent = chunkSentences.join('. ').trim();
          
          if (chunkContent.length > 50) {
            chunks.push({
              id: `${filename}_${index}_${Math.floor(i / chunkSize)}`,
              content: chunkContent,
              metadata: {
                source: filename,
                section: sectionTitle,
                type: 'pdf_chunk',
                page_section: index + 1
              }
            });
          }
        }
      } else {
        chunks.push({
          id: `${filename}_${index}`,
          content: trimmedSection,
          metadata: {
            source: filename,
            section: sectionTitle,
            type: 'pdf_section'
          }
        });
      }
    });
  } else {
    // For Markdown files, split by headers
    const sections = content.split(/(?=^#{1,3}\s)/m);
    
    sections.forEach((section, index) => {
      if (section.trim().length === 0) return;
      
      // Extract section title
      const titleMatch = section.match(/^#{1,3}\s(.+)$/m);
      const sectionTitle = titleMatch ? titleMatch[1] : `Section ${index + 1}`;
      
      // For large sections, split into paragraphs
      const paragraphs = section.split('\n\n').filter(p => p.trim().length > 50);
      
      if (paragraphs.length <= 1) {
        // Small section, keep as one chunk
        chunks.push({
          id: `${filename}_${index}`,
          content: section.trim(),
          metadata: {
            source: filename,
            section: sectionTitle,
            type: 'markdown_section'
          }
        });
      } else {
        // Large section, split into paragraphs
        paragraphs.forEach((paragraph, pIndex) => {
          chunks.push({
            id: `${filename}_${index}_${pIndex}`,
            content: paragraph.trim(),
            metadata: {
              source: filename,
              section: sectionTitle,
              type: 'markdown_paragraph'
            }
          });
        });
      }
    });
  }
  
  return chunks;
}

// Generate embeddings for knowledge chunks
async function generateEmbeddings(chunks) {
  const chunksWithEmbeddings = [];
  
  console.log(`Generating embeddings for ${chunks.length} chunks...`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.id}`);
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.content,
      });
      
      chunksWithEmbeddings.push({
        ...chunk,
        embedding: response.data[0].embedding
      });
    } catch (error) {
      console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
      chunksWithEmbeddings.push(chunk);
    }
  }
  
  return chunksWithEmbeddings;
}

// Store knowledge chunks in Supabase
async function storeKnowledgeChunks(chunks) {
  console.log(`Storing ${chunks.length} chunks in database...`);
  
  // Clear existing knowledge
  const { error: deleteError } = await supabase
    .from('knowledge_chunks')
    .delete()
    .neq('id', 'non-existent'); // Delete all rows
  
  if (deleteError) {
    console.error('Error clearing existing knowledge:', deleteError);
  } else {
    console.log('Cleared existing knowledge chunks');
  }
  
  // Insert new chunks in batches
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('knowledge_chunks')
      .upsert(
        batch.map(chunk => ({
          id: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: chunk.embedding
        }))
      );
    
    if (error) {
      console.error(`Error storing batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Stored batch ${i / batchSize + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }
  }
}

// Main processing function
async function processKnowledge() {
  try {
    console.log('🧠 Starting knowledge base processing...');
    
    // Load knowledge from markdown, PDF, and DOCX files in knowledge/ directory
    const knowledgeDir = path.join(__dirname, '..', 'knowledge');
    const files = fs.readdirSync(knowledgeDir);
    const knowledgeFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.pdf') || file.endsWith('.docx'));
    
    console.log(`Found ${knowledgeFiles.length} knowledge files:`, knowledgeFiles);
    
    let allChunks = [];
    
    for (const file of knowledgeFiles) {
      const filePath = path.join(knowledgeDir, file);
      let content;
      
      if (file.endsWith('.pdf')) {
        console.log(`Extracting text from PDF: ${file}...`);
        content = await extractPdfText(filePath);
        if (!content) {
          console.warn(`Could not extract text from ${file}, skipping...`);
          continue;
        }
        console.log(`Extracted ${content.length} characters from ${file}`);
      } else if (file.endsWith('.docx')) {
        console.log(`Extracting text from DOCX: ${file}...`);
        content = await extractDocxText(filePath);
        if (!content) {
          console.warn(`Could not extract text from ${file}, skipping...`);
          continue;
        }
        console.log(`Extracted ${content.length} characters from ${file}`);
      } else {
        content = fs.readFileSync(filePath, 'utf-8');
      }
      
      console.log(`Processing ${file}...`);
      const chunks = splitIntoChunks(content, file);
      console.log(`Created ${chunks.length} chunks from ${file}`);
      allChunks.push(...chunks);
    }
    
    console.log(`Created ${allChunks.length} knowledge chunks`);
    
    if (allChunks.length === 0) {
      console.log('No knowledge chunks to process');
      return;
    }
    
    // Generate embeddings for all chunks
    const chunksWithEmbeddings = await generateEmbeddings(allChunks);
    console.log(`Generated embeddings for ${chunksWithEmbeddings.length} chunks`);
    
    // Store in Supabase
    await storeKnowledgeChunks(chunksWithEmbeddings);
    
    console.log('✅ Knowledge processing completed successfully!');
    console.log(`📊 Processed ${chunksWithEmbeddings.length} chunks from ${knowledgeFiles.length} files`);
    console.log('📁 Sources:', knowledgeFiles);
    
  } catch (error) {
    console.error('❌ Knowledge processing failed:', error);
    process.exit(1);
  }
}

// Run the script
processKnowledge();