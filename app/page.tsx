'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Menu, History, Settings, Code, BarChart3 } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

// Lazy load components
const ChatInterface = dynamic(() => import('@/components/ChatInterface'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Tee Shine AI..." className="h-96" />,
  ssr: false
})

const BusinessStrategy = dynamic(() => import('@/components/BusinessStrategy'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Business Strategy..." className="h-96" />,
  ssr: false
})

const GoalCreator = dynamic(() => import('@/components/GoalCreator'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Goal Creator..." className="h-96" />,
  ssr: false
})

const GoalList = dynamic(() => import('@/components/GoalList'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Goals..." className="h-96" />,
  ssr: false
})

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Code Editor..." className="h-96" />,
  ssr: false
})

const ProgressTracker = dynamic(() => import('@/components/ProgressTracker'), {
  loading: () => <LoadingSpinner size="lg" text="Loading Progress Tracker..." className="h-96" />,
  ssr: false
})

export default function HomePage() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true) // Default to open
  const [sessions, setSessions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'goals' | 'strategy' | 'code' | 'progress'>('chat')

  const handleNewSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    // Optionally refresh sessions list
    loadSessions()
  }

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const { sessions } = await response.json()
        setSessions(sessions)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="h-full">
            <ChatInterface 
              sessionId={currentSessionId ?? undefined} 
              onNewSession={handleNewSession}
            />
          </div>
        )
      case 'goals':
        return (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              <div>
                <GoalCreator />
              </div>
              <div>
                <GoalList />
              </div>
            </div>
          </div>
        )
      case 'strategy':
        return (
          <div className="h-full overflow-y-auto">
            <BusinessStrategy />
          </div>
        )
      case 'code':
        return (
          <div className="h-full overflow-y-auto">
            <CodeEditor
              onCodeChange={(code) => console.log('Code changed:', code)}
              onRunCode={(code) => console.log('Running code:', code)}
            />
          </div>
        )
      case 'progress':
        return (
          <div className="h-full overflow-y-auto">
            <ProgressTracker sessionId={currentSessionId || undefined} />
          </div>
        )
      default:
        return (
          <div className="h-full">
            <ChatInterface 
              sessionId={currentSessionId ?? undefined} 
              onNewSession={handleNewSession}
            />
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-gradient-to-b from-purple-50 to-blue-50 border-r border-purple-200 flex-shrink-0`}>
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800">Tee Shine AI</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-blue-100 text-blue-700 shadow-md transform scale-105'
                  : 'hover:bg-white hover:shadow-sm text-gray-700'
              }`}
            >
              <div className="font-semibold text-lg">💬 Chat & AI Assistant</div>
              <div className="text-sm text-gray-500 mt-1">Talk to Tee Shine AI</div>
            </button>
            
            {/* <button
              onClick={() => setActiveTab('goals')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeTab === 'goals'
                  ? 'bg-purple-100 text-purple-700 shadow-md transform scale-105'
                  : 'hover:bg-white hover:shadow-sm text-gray-700'
              }`}
            >
              <div className="font-semibold text-lg">🎯 Goals & Roadmaps</div>
              <div className="text-sm text-gray-500 mt-1">Create goals with AI roadmaps</div>
            </button> */}
            
            <button
              onClick={() => setActiveTab('strategy')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeTab === 'strategy'
                  ? 'bg-green-100 text-green-700 shadow-md transform scale-105'
                  : 'hover:bg-white hover:shadow-sm text-gray-700'
              }`}
            >
              <div className="font-semibold text-lg">📊 Business Strategy</div>
              <div className="text-sm text-gray-500 mt-1">Generate business strategies</div>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeTab === 'code'
                  ? 'bg-orange-100 text-orange-700 shadow-md transform scale-105'
                  : 'hover:bg-white hover:shadow-sm text-gray-700'
              }`}
            >
              <div className="font-semibold text-lg">💻 Code Lab</div>
              <div className="text-sm text-gray-500 mt-1">Write and test code</div>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeTab === 'progress'
                  ? 'bg-indigo-100 text-indigo-700 shadow-md transform scale-105'
                  : 'hover:bg-white hover:shadow-sm text-gray-700'
              }`}
            >
              <div className="font-semibold text-lg">📈 Progress Tracker</div>
              <div className="text-sm text-gray-500 mt-1">Track your progress</div>
            </button>
          </div>

          {/* Chat History */}
          <div className="border-t border-purple-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Chat History</h3>
            <button
              onClick={loadSessions}
              className="w-full flex items-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg mb-4 transition-colors"
            >
              <History className="w-4 h-4" />
              <span>Load Chat History</span>
            </button>

            <div className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setCurrentSessionId(session.id)
                    setActiveTab('chat')
                    setSidebarOpen(false)
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-white hover:shadow-sm text-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-white border-b flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {activeTab === 'chat' && '💬 Chat with Tee Shine AI'}
              {/* {activeTab === 'goals' && '🎯 Goals & Roadmaps'} */}
              {activeTab === 'strategy' && '📊 Business Strategy'}
              {activeTab === 'code' && '💻 Code Lab'}
              {activeTab === 'progress' && '📈 Progress Tracker'}
            </div>
            
            <a
              href="/admin"
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Admin</span>
            </a>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  )
}