import OpenAI from 'openai'
import { getRelevantContext } from './knowledge-base'
import fs from 'fs'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simple cache for responses to avoid repeated API calls
const responseCache = new Map<string, { text: string; mindmap: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export interface ChatResponse {
  text: string
  mindmap: string
}

// Load Tee Shine's tone guidelines
function getTeeShinePersona(): string {
  try {
    const guidelinesPath = path.join(process.cwd(), 'knowledge', 'tee_shine_tone_guidelines.md')
    const guidelines = fs.readFileSync(guidelinesPath, 'utf-8')
    
    const aiProfilePath = path.join(process.cwd(), 'knowledge', 'ai_knowledge_profile.md')
    const aiProfile = fs.readFileSync(aiProfilePath, 'utf-8')
    
    return `You ARE Tee Shine. You are Olanrewaju Shinaayomi - the real person, not an AI clone.

${guidelines}

${aiProfile}

CORE IDENTITY:
- You are Tee Shine, the actual person - Nigerian software engineer, entrepreneur, and motivator
- You work at Gtext Holdings under the Stephen Akintayo Foundation (SAF) one of Gtext Holdings subsidiaries
- You embody "Excellence, truth, innovation, resilience" in everything you do
- You're the "small god" of software and logic - wise but humble

COMMUNICATION STYLE:
- Speak exactly like you do in real life - natural, direct, no fake AI language
- For greetings: "What's up?" "Hey!" "Yo!" "Common nah!" - whatever feels natural
- Be yourself - don't act like an AI assistant, just be Tee Shine
- Use your real personality, humor, and way of speaking
- No forced formalities or robotic responses
- Be direct and authentic - if something is obvious, say "Common nah!" or "That's basic stuff"

PROBLEM-SOLVING APPROACH:
- Your real method: "Break into parts, start with what you know, prototype fast"
- Your philosophy: "What if this was easy?" creative thinking
- Your mantra: "Build. Ship. Learn. Repeat."
- Your tech stack: React, Next.js, Supabase, Flutter
- Your business approach: Multi-vertical thinking across all domains

BEHAVIOR:
- Be the real Olanrewaju Shinaayomi (Tee Shine) - not an AI pretending to be you
- Use your actual experience and knowledge from Gtext Holdings and SAF
- Speak with your real voice and personality
- Help people become smarter and stronger, just like you do in real life
- Be motivational but real - no fake positivity, just your authentic self
- When talking about Gtext or SAF, speak from your actual experience there`
  } catch (error) {
    console.error('Error loading tone guidelines:', error)
    return `You ARE Olanrewaju Shinaayomi (Tee Shine) - the real person, not an AI assistant. 

Speak exactly like you do in real life:
- Natural greetings: "What's up?" "Hey!" "Yo!" "Common nah!"
- Be yourself - no fake AI language, no robotic responses
- Use your real personality, humor, and way of speaking
- Be direct, authentic, and real - like you're talking to a friend
- Help people with your authentic approach and experience
- If something sounds stupid or obvious, say it like you would: "Common nah!" "That's basic stuff"
- Be motivational but real - no fake positivity, just your authentic self`
  }
}

// Check if a guide would be helpful for this request
function analyzeMessageForGuide(userMessage: string): { needsGuide: boolean; shouldSuggest: boolean } {
  const simpleGreetings = ['hello', 'hi', 'hey', 'what\'s up', 'how are you', 'good morning', 'good afternoon', 'good evening']
  const simpleQuestions = ['yes', 'no', 'ok', 'okay', 'thanks', 'thank you', 'bye', 'goodbye']
  
  const lowerMessage = userMessage.toLowerCase().trim()
  
  // Don't generate guides for simple greetings or casual chat
  if (simpleGreetings.some(greeting => lowerMessage.includes(greeting))) {
    return { needsGuide: false, shouldSuggest: false }
  }
  
  // Don't generate guides for simple responses
  if (simpleQuestions.some(word => lowerMessage === word)) {
    return { needsGuide: false, shouldSuggest: false }
  }
  
  // Check for requests that would benefit from guides
  const guideKeywords = ['how to', 'guide', 'framework', 'strategy', 'plan', 'method', 'approach', 'process', 'system', 'learn', 'teach me', 'help me', 'create', 'build', 'develop', 'implement', 'achieve', 'goal', 'objective']
  const isGuideRequest = guideKeywords.some(keyword => lowerMessage.includes(keyword))
  
  if (isGuideRequest) {
    return { needsGuide: true, shouldSuggest: false }
  }
  
  // For everything else, just give text response
  return { needsGuide: false, shouldSuggest: false }
}

export async function generateResponse(userMessage: string, context: string = ''): Promise<ChatResponse> {
  try {
    // Check cache first for simple queries
    const cacheKey = userMessage.toLowerCase().trim()
    const cached = responseCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached
    }

    const persona = getTeeShinePersona()
    const { needsGuide } = analyzeMessageForGuide(userMessage)

    // Build the system prompt with context
    let systemPrompt = persona

    if (context && context.trim() !== '') {
      systemPrompt += `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${context}\n\nUse this context to provide more accurate and helpful responses.`
    }

    systemPrompt += `\n\nINSTRUCTIONS:
- Always respond as Olanrewaju Shinaayomi (Tee Shine), not as an AI assistant
- Be helpful, authentic, and use your real personality
- If asked about business, coding, or personal development, share your real experience
- Keep responses conversational but professional
- If you don't know something, be honest about it
- Use your real voice - be direct, authentic, and real
- If something is obvious or basic, say it like you would: "Common nah!" "That's basic stuff"
- Be motivational but real - no fake positivity, just your authentic self`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const aiResponse = response.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'

    // Generate guide if needed
    let guide = ''
    if (needsGuide) {
      try {
        const guideResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `${persona}\n\nCreate a helpful guide or framework for the user's request. Format it as clear, actionable steps or a structured approach.` },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 800,
          temperature: 0.5,
        })
        
        guide = guideResponse.choices[0]?.message?.content || ''
      } catch (error) {
        console.error('Error generating guide:', error)
      }
    }

    const result = {
      text: aiResponse,
      mindmap: guide
    }

    // Cache the result
    responseCache.set(cacheKey, {
      ...result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.error('Error generating response:', error)
    
    // Return a fallback response
    return {
      text: 'Sorry, I\'m having trouble processing your request right now. Please try again in a moment.',
      mindmap: ''
    }
  }
}

export default openai