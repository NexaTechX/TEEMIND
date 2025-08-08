import { NextRequest, NextResponse } from 'next/server'
import { generateResponse } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { getRelevantContext } from '@/lib/knowledge-base'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, userId = 'default-user' } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { 
          response: {
            content: 'I need my OpenAI API key to be configured first. Please add your OPENAI_API_KEY to the .env.local file.',
            text: 'I need my OpenAI API key to be configured first. Please add your OPENAI_API_KEY to the .env.local file.'
          },
          mindmap: ''
        }
      )
    }

    // Get relevant context from knowledge base
    let context = ''
    try {
      context = await getRelevantContext(message)
    } catch (error) {
      console.error('Error getting knowledge context:', error)
      // Continue without context if there's an error
    }

    // Generate AI response with context
    const aiResponse = await generateResponse(message, context)

    // Create session if none exists
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const sessionId = uuidv4()
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          id: sessionId,
          title: message.length > 50 ? message.substring(0, 50) + '...' : message,
        })

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        return NextResponse.json(
          { error: 'Failed to create chat session' },
          { status: 500 }
        )
      }
      currentSessionId = sessionId
    }

    // Save user message to database
    const userMessageId = uuidv4()
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        id: userMessageId,
        session_id: currentSessionId,
        role: 'user',
        content: message,
      })

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError)
    }

    // Save AI response to database
    const aiMessageId = uuidv4()
    const { error: aiMessageError } = await supabase
      .from('messages')
      .insert({
        id: aiMessageId,
        session_id: currentSessionId,
        role: 'assistant',
        content: aiResponse.text,
      })

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError)
    }

    // Save guide data only if it exists
    if (aiResponse.mindmap && aiResponse.mindmap.trim() !== '') {
      const { error: guideError } = await supabase
        .from('mindmaps')
        .insert({
          message_id: aiMessageId,
          mindmap_data: aiResponse.mindmap,
        })

      if (guideError) {
        console.error('Error saving guide:', guideError)
      }
    }

    // Update session title if it's the first message
    if (currentSessionId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('session_id', currentSessionId)
        .limit(2)

      if (messages && messages.length <= 2) {
        // This is likely the first exchange, update session title
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message
        await supabase
          .from('chat_sessions')
          .update({ title })
          .eq('id', currentSessionId)
      }
    }

    return NextResponse.json({
      response: {
        content: aiResponse.text,
        text: aiResponse.text
      },
      mindmap: aiResponse.mindmap,
      sessionId: currentSessionId,
      messageId: aiMessageId,
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}