'use client'

import React, { useState, useEffect } from 'react'

interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'not-started' | 'in-progress' | 'completed' | 'paused'
  target_date: string
  created_at: string
  roadmap?: any
  guidelines?: any
}

interface GoalListProps {
  onGoalUpdated?: (goal: Goal) => void
}

export default function GoalList({ onGoalUpdated }: GoalListProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals?userId=default-user')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGoalStatus = async (goalId: string, status: Goal['status']) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId,
          updates: { status }
        }),
      })

      if (response.ok) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? { ...goal, status } : goal
        ))
        
        if (onGoalUpdated) {
          const updatedGoal = goals.find(g => g.id === goalId)
          if (updatedGoal) {
            onGoalUpdated({ ...updatedGoal, status })
          }
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const generatePlan = async (goal: Goal) => {
    setGeneratingPlan(goal.id)
    try {
      const response = await fetch('/api/generate-goal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: goal.title,
          description: goal.description,
          category: goal.category
        }),
      })

      if (response.ok) {
        const roadmapData = await response.json()
        
        // Update goal with roadmap data
        await fetch('/api/goals', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            goalId: goal.id,
            updates: {
              roadmap: roadmapData.guide,
              guidelines: roadmapData.framework
            }
          }),
        })

        // Update local state
        setGoals(prev => prev.map(g => 
          g.id === goal.id 
            ? { ...g, roadmap: roadmapData.guide, guidelines: roadmapData.framework }
            : g
        ))

        // Expand the goal to show the generated plan
        setExpandedGoal(goal.id)
      }
    } catch (error) {
      console.error('Error generating plan:', error)
    } finally {
      setGeneratingPlan(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500">✓</span>
      case 'in-progress':
        return <span className="text-blue-500">⏱</span>
      case 'paused':
        return <span className="text-yellow-500">⏸</span>
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">✨</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
        <p className="text-gray-600">Create your first goal to get started with AI-powered roadmaps!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white py-2 z-10">
        <h2 className="text-xl font-semibold text-gray-900">Your Goals & Roadmaps</h2>
        <div className="text-sm text-gray-600">
          {goals.filter(g => g.status === 'completed').length} of {goals.length} completed
        </div>
      </div>

      {goals.map((goal) => (
        <div key={goal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <button
                  onClick={() => updateGoalStatus(goal.id, goal.status === 'completed' ? 'not-started' : 'completed')}
                  className="mt-1"
                >
                  {getStatusIcon(goal.status)}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {goal.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  {goal.description && (
                    <p className="text-gray-600 text-sm mb-2">{goal.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {goal.category && (
                      <span className="capitalize">{goal.category}</span>
                    )}
                    {goal.target_date && (
                      <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Generate Plan Button */}
                <button
                  onClick={() => generatePlan(goal)}
                  disabled={generatingPlan === goal.id}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 transition-colors"
                >
                  {generatingPlan === goal.id ? (
                    <>
                      <span className="animate-spin inline-block mr-1">⟳</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="mr-1">✨</span>
                      Generate Plan
                    </>
                  )}
                </button>

                <button
                  onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expandedGoal === goal.id ? (
                    <span className="text-gray-500">▼</span>
                  ) : (
                    <span className="text-gray-500">▶</span>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded content with roadmap and guidelines */}
            {expandedGoal === goal.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Roadmap Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-purple-600">🗺</span>
                      <h4 className="font-medium text-purple-900">AI Roadmap</h4>
                    </div>
                    {goal.roadmap ? (
                      <div className="text-sm text-purple-800 max-h-64 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: goal.roadmap.replace(/\n/g, '<br/>') }} />
                      </div>
                    ) : (
                      <p className="text-sm text-purple-600">Click "Generate Plan" to create your roadmap</p>
                    )}
                  </div>

                  {/* Guidelines Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-green-600">📚</span>
                      <h4 className="font-medium text-green-900">Guidelines & Framework</h4>
                    </div>
                    {goal.guidelines ? (
                      <div className="text-sm text-green-800 max-h-64 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: goal.guidelines.replace(/\n/g, '<br/>') }} />
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">Click "Generate Plan" to create your guidelines</p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => updateGoalStatus(goal.id, 'in-progress')}
                    disabled={goal.status === 'in-progress'}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => updateGoalStatus(goal.id, 'paused')}
                    disabled={goal.status === 'paused'}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => updateGoalStatus(goal.id, 'completed')}
                    disabled={goal.status === 'completed'}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                  >
                    Complete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
