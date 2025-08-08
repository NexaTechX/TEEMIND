'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, MessageSquare, Brain, Calendar, BarChart3, Settings } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load heavy components
const MindmapViewer = dynamic(() => import('@/components/MindmapViewer'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>,
  ssr: false
})

const KnowledgeManager = dynamic(() => import('@/components/KnowledgeManager'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false
})

interface SessionData {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
  latest_message?: string
}

interface MessageData {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  mindmaps?: { mindmap_data: string }[]
}

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMindmap, setSelectedMindmap] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'analytics' | 'knowledge'>('analytics')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const { sessions: sessionData } = await response.json()
        
        // Get message counts for each session
        const sessionsWithCounts = await Promise.all(
          sessionData.map(async (session: SessionData) => {
            try {
              const msgResponse = await fetch(`/api/sessions/${session.id}/messages`)
              if (msgResponse.ok) {
                const { messages: sessionMessages } = await msgResponse.json()
                return {
                  ...session,
                  message_count: sessionMessages.length,
                  latest_message: sessionMessages.length > 0 
                    ? sessionMessages[sessionMessages.length - 1].content.substring(0, 100) + '...'
                    : 'No messages'
                }
              }
              return { ...session, message_count: 0, latest_message: 'No messages' }
            } catch {
              return { ...session, message_count: 0, latest_message: 'Error loading' }
            }
          })
        )
        
        setSessions(sessionsWithCounts)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`)
      if (response.ok) {
        const { messages: messageData } = await response.json()
        setMessages(messageData)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSessionClick = (session: SessionData) => {
    setSelectedSession(session)
    loadMessages(session.id)
    setSelectedMindmap(null)
  }

  const totalMessages = sessions.reduce((sum, session) => sum + (session.message_count || 0), 0)
  const totalMindmaps = messages.filter(msg => msg.mindmaps && msg.mindmaps.length > 0).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Chat</span>
              </a>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'knowledge'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Knowledge Base
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{sessions.length}</h3>
                    <p className="text-gray-600">Total Sessions</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{totalMessages}</h3>
                    <p className="text-gray-600">Total Messages</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{totalMindmaps}</h3>
                    <p className="text-gray-600">Mindmaps Generated</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sessions List */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Chat Sessions</h2>
                  <p className="text-gray-600 mt-1">Click on a session to view details</p>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSessionClick(session)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedSession?.id === session.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{session.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 truncate">{session.latest_message}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {session.message_count} messages
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(session.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Details */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedSession ? `Session: ${selectedSession.title}` : 'Select a Session'}
                  </h2>
                  {selectedSession && (
                    <p className="text-gray-600 mt-1">
                      Created: {new Date(selectedSession.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div className="p-6">
                  {!selectedSession ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a session from the left to view messages and mindmaps</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : 'bg-gray-50 border-l-4 border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              message.role === 'user' ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {message.role === 'user' ? 'User' : 'Tee Shine'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <p className="text-gray-800 whitespace-pre-wrap text-sm mb-2">
                            {message.content}
                          </p>
                          
                          {message.mindmaps && message.mindmaps.length > 0 && (
                            <button
                              onClick={() => setSelectedMindmap(message.mindmaps![0].mindmap_data)}
                              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 text-sm"
                            >
                              <Brain className="w-4 h-4" />
                              <span>View Mindmap</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <KnowledgeManager />
        )}

        {/* Mindmap Modal */}
        {selectedMindmap && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Mindmap Visualization</h3>
                <button
                  onClick={() => setSelectedMindmap(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                <MindmapViewer mindmapData={selectedMindmap} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}