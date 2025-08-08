'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Brain, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load components
const MindmapViewer = dynamic(() => import('./MindmapViewer'), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
      <span className="ml-2 text-gray-600">Loading mindmap...</span>
    </div>
  ),
  ssr: false
})

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  mindmap?: string
  timestamp: Date
  error?: boolean
}

interface ChatInterfaceProps {
  sessionId?: string
  onNewSession?: (sessionId: string) => void
}

export default function ChatInterface({ sessionId, onNewSession }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMindmap, setShowMindmap] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check connection status
  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      setConnectionStatus('disconnected')
    }
  }

  // Load messages for existing session
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId)
    }
  }, [currentSessionId])

  const loadMessages = async (sessionId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/sessions/${sessionId}/messages`)
      if (response.ok) {
        const { messages: loadedMessages } = await response.json()
        const formattedMessages = loadedMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          mindmap: msg.mindmaps?.[0]?.mindmap_data,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(formattedMessages)
      } else {
        // Add error message if loading fails
        setMessages([{
          id: 'error-1',
          role: 'system',
          content: 'Unable to load previous messages. Starting fresh conversation.',
          timestamp: new Date(),
          error: true
        }])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([{
        id: 'error-1',
        role: 'system',
        content: 'Connection error. Please check your internet connection and try again.',
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Chat',
          userId: 'default-user'
        }),
      })

      if (response.ok) {
        const { session } = await response.json()
        setCurrentSessionId(session.id)
        setMessages([])
        if (onNewSession) {
          onNewSession(session.id)
        }
      } else {
        throw new Error('Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      // Add error message
      setMessages([{
        id: 'error-2',
        role: 'system',
        content: 'Unable to create new chat session. Please try again.',
        timestamp: new Date(),
        error: true
      }])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newUserMessage])

    try {
      // Create session if none exists
      if (!currentSessionId) {
        await createNewSession()
      }

      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
          userId: 'default-user'
        }),
      })

      if (response.ok) {
        const { response: aiResponse, sessionId: newSessionId } = await response.json()
        
        // Update session ID if new session was created
        if (newSessionId && !currentSessionId) {
          setCurrentSessionId(newSessionId)
          if (onNewSession) {
            onNewSession(newSessionId)
          }
        }

        // Add AI response to chat
        const newAiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.content || aiResponse.text,
          mindmap: aiResponse.mindmap,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, newAiMessage])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your connection and try again. If the problem persists, please ensure your OpenAI API key is configured.',
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    createNewSession()
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Checking...'
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tee Shine AI</h1>
              <p className="text-sm text-gray-600">Your personal AI mentor & business partner</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              {getConnectionStatusIcon()}
              <span className={connectionStatus === 'connected' ? 'text-green-600' : 'text-gray-600'}>
                {getConnectionStatusText()}
              </span>
            </div>
            
            <button
              onClick={startNewChat}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RotateCcw size={16} />
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Content */}
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="text-white" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Tee Shine AI</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                I'm here to help you with business strategy, coding, goal planning, and more. 
                Ask me anything!
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.error
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-white text-gray-900 shadow-sm border'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Guide */}
                {message.role === 'assistant' && !message.error && showMindmap && message.mindmap && message.mindmap.trim() !== '' && (
                  <div className="mt-4">
                    <MindmapViewer mindmapData={message.mindmap} />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 shadow-sm border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600">Tee Shine is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Tee Shine anything..."
                className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isLoading || connectionStatus === 'disconnected'}
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim() || connectionStatus === 'disconnected'}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          
          {/* Guide Toggle */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mindmap-toggle"
                checked={showMindmap}
                onChange={(e) => setShowMindmap(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="mindmap-toggle" className="text-sm text-gray-600">
                Show guides
              </label>
            </div>
            
            {connectionStatus === 'disconnected' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={14} />
                <span>Connection issues detected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}