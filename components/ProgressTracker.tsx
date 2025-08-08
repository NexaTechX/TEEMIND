'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  TrendingUp, BookOpen, Target, Award, Clock, CheckCircle, 
  Plus, Edit, Trash2, Bell, Calendar, Play, Pause, 
  AlertCircle, Lightbulb, Users, Zap, Star, Flag, 
  ChevronDown, ChevronUp, Settings, RefreshCw,
  GraduationCap, Briefcase, Heart, Building2, User, 
  Code, Palette, CheckSquare, Clock3, 
  ArrowRight, ArrowUp, ArrowDown, Info, ExternalLink
} from 'lucide-react'

interface ProgressTrackerProps {
  sessionId?: string
}

interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'not-started' | 'in-progress' | 'completed' | 'paused'
  createdAt: Date
  targetDate: Date
  completedAt?: Date
  framework?: Framework
  roadmap?: Roadmap
}

interface Step {
  id: string
  goalId: string
  title: string
  description: string
  estimatedTime: number // in minutes
  actualTime?: number
  status: 'pending' | 'in-progress' | 'completed'
  dueDate: Date
  completedAt?: Date
  order: number
  phase: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  resources: string[]
  successCriteria: string
  tips: string
  prerequisites: string[]
}

interface Framework {
  id: string
  name: string
  description: string
  steps: Omit<Step, 'id' | 'goalId' | 'actualTime' | 'completedAt'>[]
  category: string
  phases: string[]
}

interface Roadmap {
  overview: string
  totalEstimatedTime: number
  difficultyProgression: string
  keyMilestones: string[]
  resources: string[]
}

interface Reminder {
  id: string
  goalId: string
  stepId?: string
  title: string
  message: string
  dueDate: Date
  isCompleted: boolean
  type: 'goal' | 'step' | 'milestone'
}

interface LearningSession {
  id: string
  topic: string
  duration: number
  questions: number
  completed: boolean
  timestamp: Date
}

export default function ProgressTracker({ sessionId }: ProgressTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  
  // UI States
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [showReminders, setShowReminders] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  
  // Form States
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const,
    targetDate: ''
  })

  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadData()
    setupReminderChecks()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const loadData = async () => {
    try {
      // Load goals from database
      const response = await fetch('/api/goals?userId=default-user')
      if (response.ok) {
        const data = await response.json()
        const formattedGoals = data.goals.map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          priority: goal.priority,
          status: goal.status,
          createdAt: new Date(goal.created_at),
          targetDate: new Date(goal.target_date),
          completedAt: goal.completed_at ? new Date(goal.completed_at) : undefined,
          framework: goal.framework_data,
          roadmap: goal.roadmap_data
        }))
        setGoals(formattedGoals)

        // Load steps for each goal
        for (const goal of formattedGoals) {
          const stepsResponse = await fetch(`/api/steps?goalId=${goal.id}`)
          if (stepsResponse.ok) {
            const stepsData = await stepsResponse.json()
            const formattedSteps = stepsData.steps.map((step: any) => ({
              id: step.id,
              goalId: step.goal_id,
              title: step.title,
              description: step.description,
              estimatedTime: step.estimated_time,
              actualTime: step.actual_time,
              status: step.status,
              dueDate: new Date(step.due_date),
              completedAt: step.completed_at ? new Date(step.completed_at) : undefined,
              order: step.order,
              phase: step.phase,
              difficulty: step.difficulty,
              resources: step.resources || [],
              successCriteria: step.success_criteria,
              tips: step.tips,
              prerequisites: step.prerequisites || []
            }))
            setSteps(prev => [...prev, ...formattedSteps])
          }
        }
      }

      // Load from localStorage for sessions (temporary)
      const savedSessions = localStorage.getItem('learning-sessions')
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const setupReminderChecks = () => {
    // Check for due reminders every minute
    intervalRef.current = setInterval(() => {
      checkDueReminders()
    }, 60000)
  }

  const checkDueReminders = () => {
    const now = new Date()
    const dueReminders = reminders.filter(
      reminder => !reminder.isCompleted && new Date(reminder.dueDate) <= now
    )
    
    dueReminders.forEach(reminder => {
      showNotification(reminder)
    })
  }

  const showNotification = (reminder: Reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.message,
        icon: '/favicon.ico'
      })
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const generateAIPlan = async (goal: Goal) => {
    setIsGeneratingPlan(true)
    try {
      const response = await fetch('/api/generate-goal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.title,
          description: goal.description,
          category: goal.category,
          targetDate: goal.targetDate,
          priority: goal.priority
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update goal with framework and roadmap
        const updatedGoal = {
          ...goal,
          framework: data.framework,
          roadmap: data.roadmap
        }
        
        setGoals(prev => prev.map(g => g.id === goal.id ? updatedGoal : g))
        
        // Save steps to database
        for (const step of data.steps) {
          await fetch('/api/steps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goalId: goal.id,
              title: step.title,
              description: step.description,
              estimatedTime: step.estimatedTime,
              dueDate: step.dueDate,
              order: step.order,
              phase: step.phase,
              difficulty: step.difficulty,
              resources: step.resources,
              successCriteria: step.successCriteria,
              tips: step.tips,
              prerequisites: step.prerequisites
            })
          })
        }
        
        // Reload steps for this goal
        const stepsResponse = await fetch(`/api/steps?goalId=${goal.id}`)
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json()
          setSteps(prev => {
            const filtered = prev.filter(s => s.goalId !== goal.id)
            return [...filtered, ...(stepsData.steps || [])]
          })
        }
        
        // Create reminders for important steps
        const importantSteps = data.steps.filter((step: Step) => 
          step.title.toLowerCase().includes('milestone') || 
          step.title.toLowerCase().includes('review') ||
          step.title.toLowerCase().includes('deadline') ||
          step.difficulty === 'Advanced'
        )
        
        const newReminders = importantSteps.map((step: Step) => ({
          id: `reminder-${step.id}`,
          goalId: goal.id,
          stepId: step.id,
          title: `Step Due: ${step.title}`,
          message: `Time to work on: ${step.description}`,
          dueDate: new Date(step.dueDate),
          isCompleted: false,
          type: 'step' as const
        }))
        
        setReminders(prev => [...prev, ...newReminders])
      }
    } catch (error) {
      console.error('Error generating plan:', error)
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const addGoal = async () => {
    if (!goalForm.title.trim()) return

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goalForm.title,
          description: goalForm.description,
          category: goalForm.category,
          priority: goalForm.priority,
          targetDate: goalForm.targetDate,
          userId: 'default-user' // In a real app, get from auth context
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newGoal: Goal = {
          id: data.goal.id,
          title: data.goal.title,
          description: data.goal.description,
          category: data.goal.category,
          priority: data.goal.priority,
          status: data.goal.status,
          createdAt: new Date(data.goal.created_at),
          targetDate: new Date(data.goal.target_date)
        }

        setGoals(prev => [...prev, newGoal])
        setGoalForm({
          title: '',
          description: '',
          category: '',
          priority: 'medium',
          targetDate: ''
        })
        setShowGoalForm(false)

        // Generate AI plan for the new goal
        await generateAIPlan(newGoal)
      }
    } catch (error) {
      console.error('Error adding goal:', error)
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          updates
        })
      })

      if (response.ok) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? { ...goal, ...updates } : goal
        ))
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId))
        setSteps(prev => prev.filter(step => step.goalId !== goalId))
        setReminders(prev => prev.filter(reminder => reminder.goalId !== goalId))
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const updateStep = async (stepId: string, updates: Partial<Step>) => {
    try {
      const response = await fetch('/api/steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          updates
        })
      })

      if (response.ok) {
        setSteps(prev => prev.map(step => 
          step.id === stepId ? { ...step, ...updates } : step
        ))
      }
    } catch (error) {
      console.error('Error updating step:', error)
    }
  }

  const completeStep = async (stepId: string) => {
    await updateStep(stepId, {
      status: 'completed',
      completedAt: new Date()
    })
  }

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString()
    }
    setReminders(prev => [...prev, newReminder])
  }

  const completeReminder = (reminderId: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === reminderId ? { ...reminder, isCompleted: true } : reminder
    ))
  }

  const getGoalProgress = (goalId: string) => {
    const goalSteps = steps.filter(step => step.goalId === goalId)
    if (goalSteps.length === 0) return 0
    const completedSteps = goalSteps.filter(step => step.status === 'completed')
    return Math.round((completedSteps.length / goalSteps.length) * 100)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in-progress': return 'text-blue-600 bg-blue-100'
      case 'paused': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Advanced': return 'text-red-600 bg-red-100'
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'Beginner': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return <BookOpen size={16} />
      case 'career': return <Briefcase size={16} />
      case 'health': return <Heart size={16} />
      case 'business': return <Building2 size={16} />
      case 'personal': return <User size={16} />
      case 'technology': return <Code size={16} />
      case 'creative': return <Palette size={16} />
      default: return <Target size={16} />
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (date: Date) => {
    return new Date(date) < new Date()
  }

  const getFilteredSteps = (goalId: string) => {
    let filteredSteps = steps.filter(step => step.goalId === goalId)
    
    if (selectedPhase !== 'all') {
      filteredSteps = filteredSteps.filter(step => step.phase === selectedPhase)
    }
    
    return filteredSteps.sort((a, b) => a.order - b.order)
  }

  const getPhases = (goalId: string) => {
    const goalSteps = steps.filter(step => step.goalId === goalId)
    const phases = Array.from(new Set(goalSteps.map(step => step.phase)))
    return phases.sort()
  }

  return (
    <div className="space-y-6">
      {/* Header with Notification Permission */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Goal Progress Tracker</h2>
        <button
          onClick={requestNotificationPermission}
          className="flex items-center gap-2 px-3 py-2 bg-white-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Bell size={16} />
          Enable Notifications
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Active Goals</p>
              <p className="text-2xl font-bold">{goals.filter(g => g.status !== 'completed').length}</p>
            </div>
            <Target size={24} />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Completed Goals</p>
              <p className="text-2xl font-bold">{goals.filter(g => g.status === 'completed').length}</p>
            </div>
            <CheckCircle size={24} />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Steps</p>
              <p className="text-2xl font-bold">{steps.length}</p>
            </div>
            <BookOpen size={24} />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Due Reminders</p>
              <p className="text-2xl font-bold">{reminders.filter(r => !r.isCompleted && new Date(r.dueDate) <= new Date()).length}</p>
            </div>
            <Bell size={24} />
          </div>
        </div>
      </div>

      {/* Add Goal Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add New Goal
        </button>
        
        <button
          onClick={() => setShowReminders(!showReminders)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Bell size={16} />
          Reminders ({reminders.filter(r => !r.isCompleted).length})
        </button>
      </div>

      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Goal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Learn React Advanced Concepts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="learning">Learning & Education</option>
                    <option value="career">Career Development</option>
                    <option value="health">Health & Fitness</option>
                    <option value="business">Business & Entrepreneurship</option>
                    <option value="personal">Personal Development</option>
                    <option value="technology">Technology</option>
                    <option value="creative">Creative Projects</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={addGoal}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isGeneratingPlan ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    Generating Roadmap...
                  </div>
                ) : (
                  'Add Goal & Generate Roadmap'
                )}
              </button>
              <button
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminders Panel */}
      {showReminders && (
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Bell className="text-orange-600" />
            Active Reminders
          </h3>
          
          <div className="space-y-3">
            {reminders.filter(r => !r.isCompleted).map(reminder => (
              <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className="text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-800">{reminder.title}</p>
                    <p className="text-sm text-gray-600">{reminder.message}</p>
                    <p className="text-xs text-gray-500">Due: {formatDate(reminder.dueDate)}</p>
                  </div>
                </div>
                <button
                  onClick={() => completeReminder(reminder.id)}
                  className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Complete
                </button>
              </div>
            ))}
            
            {reminders.filter(r => !r.isCompleted).length === 0 && (
              <p className="text-gray-500 text-center py-4">No active reminders</p>
            )}
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getCategoryIcon(goal.category)}
                  <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                    {goal.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{goal.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Category: {goal.category}</span>
                  <span>Target: {formatDate(goal.targetDate)}</span>
                  <span>Progress: {getGoalProgress(goal.id)}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getGoalProgress(goal.id)}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {selectedGoal?.id === goal.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => setEditingGoal(goal)}
                  className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Framework & Roadmap Overview */}
            {goal.framework && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Framework: {goal.framework.name}</h4>
                <p className="text-sm text-blue-700 mb-2">{goal.framework.description}</p>
                {goal.roadmap && (
                  <div className="text-sm text-blue-600">
                    <p><strong>Overview:</strong> {goal.roadmap.overview}</p>
                    <p><strong>Total Time:</strong> {formatTime(goal.roadmap.totalEstimatedTime)}</p>
                    <p><strong>Difficulty:</strong> {goal.roadmap.difficultyProgression}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Goal Steps */}
            {selectedGoal?.id === goal.id && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Action Steps</h4>
                  
                  {/* Phase Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Filter:</span>
                    <select
                      value={selectedPhase}
                      onChange={(e) => setSelectedPhase(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="all">All Phases</option>
                      {getPhases(goal.id).map(phase => (
                        <option key={phase} value={phase}>{phase}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {getFilteredSteps(goal.id).map(step => (
                    <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => completeStep(step.id)}
                            className={`p-1 rounded ${step.status === 'completed' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                          >
                            <CheckCircle size={16} />
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-medium ${step.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {step.title}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(step.difficulty)}`}>
                                {step.difficulty}
                              </span>
                              <span className="text-xs text-gray-500">({formatTime(step.estimatedTime)})</span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Phase: {step.phase}</span>
                              <span>Due: {formatDate(step.dueDate)}</span>
                              {isOverdue(step.dueDate) && step.status !== 'completed' && (
                                <span className="text-red-600">Overdue</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {expandedStep === step.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      
                      {/* Expanded Step Details */}
                      {expandedStep === step.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                          {step.prerequisites.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Prerequisites:</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {step.prerequisites.map((prereq, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <ArrowRight size={12} />
                                    {prereq}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {step.resources.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Resources:</h5>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {step.resources.map((resource, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <ExternalLink size={12} />
                                    {resource}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Success Criteria:</h5>
                            <p className="text-xs text-gray-600">{step.successCriteria}</p>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Tee Shine's Tips:</h5>
                            <p className="text-xs text-gray-600 italic">{step.tips}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {getFilteredSteps(goal.id).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No steps found for this phase</p>
                )}
              </div>
            )}
          </div>
        ))}
        
        {goals.length === 0 && (
          <div className="text-center py-12">
            <Target size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Yet</h3>
            <p className="text-gray-600 mb-4">Start by adding your first goal and let AI create a personalized roadmap for you!</p>
            <button
              onClick={() => setShowGoalForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
