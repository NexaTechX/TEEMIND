'use client'

import { useState, useEffect } from 'react'
import { Brain, Upload, Search, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface KnowledgeStatus {
  availableFiles: string[]
  totalChunks: number
  status: string
}

interface SearchResult {
  content: string
  metadata: {
    source: string
    section?: string
    type: string
  }
  similarity: number
}

export default function KnowledgeManager() {
  const [knowledgeStatus, setKnowledgeStatus] = useState<KnowledgeStatus | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadKnowledgeStatus()
  }, [])

  const loadKnowledgeStatus = async () => {
    try {
      const response = await fetch('/api/knowledge/process')
      if (response.ok) {
        const data = await response.json()
        setKnowledgeStatus(data)
      }
    } catch (error) {
      console.error('Error loading knowledge status:', error)
    }
  }

  const processKnowledge = async () => {
    setIsProcessing(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/knowledge/process', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully processed ${data.chunksProcessed} knowledge chunks from ${data.sources.length} files`
        })
        loadKnowledgeStatus()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to process knowledge base'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to process knowledge base'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const searchKnowledge = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Error searching knowledge:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchKnowledge()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Knowledge Base Manager</h2>
          <p className="text-gray-600">Manage Tee Shine's knowledge and personality</p>
        </div>
      </div>

      {/* Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Available Files</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {knowledgeStatus?.availableFiles.length || 0}
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Knowledge Chunks</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {knowledgeStatus?.totalChunks || 0}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Status</span>
          </div>
          <p className="text-lg font-semibold text-green-900 mt-1 capitalize">
            {knowledgeStatus?.status || 'Loading...'}
          </p>
        </div>
      </div>

      {/* Available Files */}
      {knowledgeStatus?.availableFiles && knowledgeStatus.availableFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Available Knowledge Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {knowledgeStatus.availableFiles.map((file) => (
              <div key={file} className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                <FileText className="w-4 h-4 inline mr-2 text-gray-600" />
                {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Knowledge Button */}
      <div className="mb-6">
        <button
          onClick={processKnowledge}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>{isProcessing ? 'Processing...' : 'Process Knowledge Base'}</span>
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This will scan the knowledge/ folder and update the AI's knowledge base with embeddings.
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Knowledge Search */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Test Knowledge Search</h3>
        <div className="flex space-x-3 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Tee Shine's knowledge..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={searchKnowledge}
            disabled={isSearching || !searchQuery.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Search Results:</h4>
            {searchResults.map((result, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      {result.metadata.source}
                    </span>
                    {result.metadata.section && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{result.metadata.section}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(result.similarity * 100)}% match
                  </span>
                </div>
                <p className="text-sm text-gray-800 line-clamp-3">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}