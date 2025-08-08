'use client'

import React, { useState } from 'react'

interface Goal {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'not-started' | 'in-progress' | 'completed' | 'paused'
  targetDate: string
  roadmap?: any
  guidelines?: any
}

interface GoalCreatorProps {
  onGoalCreated?: (goal: Goal) => void
}

export default function GoalCreator({ onGoalCreated }: GoalCreatorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetDate: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Create the goal
      const goalResponse = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: 'default-user'
        }),
      })

      if (!goalResponse.ok) {
        throw new Error('Failed to create goal')
      }

      const goalData = await goalResponse.json()
      const goal = goalData.goal

      // Reset form and hide it
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        targetDate: ''
      })
      setShowForm(false)

      if (onGoalCreated) {
        onGoalCreated(goal)
      }

    } catch (error) {
      console.error('Error creating goal:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      targetDate: ''
    })
  }

  if (!showForm) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          <span className="text-xl">+</span>
          <span className="font-semibold">Create New Goal</span>
        </button>
        <p className="text-sm text-gray-600 mt-2">Click to create a new goal with AI-powered roadmap</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Goal</h2>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">✨</span>
          <span className="text-sm text-gray-600">AI-Powered Roadmap</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Goal Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Learn React, Start a Business, Master Python"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe your goal in detail..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              <option value="personal">Personal Development</option>
              <option value="career">Career</option>
              <option value="health">Health & Fitness</option>
              <option value="education">Education</option>
              <option value="business">Business</option>
              <option value="financial">Financial</option>
              <option value="creative">Creative</option>
              <option value="social">Social</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-2">
              Target Date
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="text-green-500">✓</span>
            <span>Create your goal first, then click "Generate Plan" to get AI roadmap</span>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Goal...</span>
                </>
              ) : (
                <>
                  <span>+</span>
                  <span>Create Goal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
