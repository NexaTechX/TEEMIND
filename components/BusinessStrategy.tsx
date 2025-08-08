'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Lightbulb, BarChart3, AlertCircle, CheckCircle, Loader2, ArrowRight, Building2, ShoppingCart, Briefcase, Heart, Zap, Download, FileText, FileDown } from 'lucide-react'

interface BusinessData {
  name: string
  industry: string
  size: string
  age: string
  currentRevenue: string
  targetRevenue: string
  employeeCount: string
  location: string
  mainChallenges: string[]
  goals: string[]
  budget: string
  timeframe: string
}

interface StrategySection {
  title: string
  content: string
  icon: React.ReactNode
  color: string
}

interface BusinessStrategyProps {
  onGenerateStrategy?: (strategy: StrategySection[]) => void
}

export default function BusinessStrategy({ onGenerateStrategy }: BusinessStrategyProps) {
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: '',
    industry: '',
    size: '',
    age: '',
    currentRevenue: '',
    targetRevenue: '',
    employeeCount: '',
    location: '',
    mainChallenges: [],
    goals: [],
    budget: '',
    timeframe: ''
  })

  const [strategy, setStrategy] = useState<StrategySection[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('analysis')

  const industries = [
    'Technology/SaaS', 'E-commerce', 'Healthcare', 'Education', 'Finance', 'Real Estate',
    'Manufacturing', 'Retail', 'Food & Beverage', 'Consulting', 'Marketing/Advertising',
    'Transportation', 'Entertainment', 'Fitness/Wellness', 'Legal Services', 'Other'
  ]

  const businessSizes = ['Startup (1-10 employees)', 'Small Business (11-50 employees)', 'Medium Business (51-200 employees)', 'Large Business (200+ employees)']

  const commonChallenges = [
    'Declining Sales/Revenue', 'Low Customer Retention', 'High Customer Acquisition Cost',
    'Cash Flow Problems', 'Employee Turnover', 'Competition Pressure', 'Market Saturation',
    'Technology Adoption', 'Supply Chain Issues', 'Marketing Ineffectiveness',
    'Product/Service Quality', 'Pricing Strategy', 'Customer Service Issues',
    'Operational Inefficiency', 'Regulatory Compliance', 'Brand Recognition'
  ]

  const commonGoals = [
    'Increase Sales by 50%', 'Improve Customer Retention', 'Reduce Operating Costs',
    'Expand to New Markets', 'Launch New Products/Services', 'Improve Brand Awareness',
    'Optimize Marketing ROI', 'Enhance Customer Experience', 'Streamline Operations',
    'Build Strong Team', 'Improve Profit Margins', 'Digital Transformation',
    'Market Leadership', 'Sustainable Growth', 'Customer Satisfaction'
  ]

  const handleInputChange = (field: keyof BusinessData, value: string | string[]) => {
    setBusinessData(prev => ({ ...prev, [field]: value }))
  }

  const handleChallengeToggle = (challenge: string) => {
    setBusinessData(prev => ({
      ...prev,
      mainChallenges: prev.mainChallenges.includes(challenge)
        ? prev.mainChallenges.filter(c => c !== challenge)
        : [...prev.mainChallenges, challenge]
    }))
  }

  const handleGoalToggle = (goal: string) => {
    setBusinessData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const generateStrategy = async () => {
    if (!businessData.name || !businessData.industry) {
      alert('Please fill in at least business name and industry')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/business-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData)
      })

      if (response.ok) {
        const data = await response.json()
        const strategyData = data.strategy || []
        setStrategy(strategyData)
        setActiveTab('strategy')
        
        // Call the callback if provided
        if (onGenerateStrategy) {
          onGenerateStrategy(strategyData)
        }
      } else {
        throw new Error('Failed to generate strategy')
      }
    } catch (error) {
      console.error('Error generating strategy:', error)
      alert('Failed to generate strategy. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportStrategy = async (format: 'pdf' | 'doc') => {
    if (strategy.length === 0) {
      alert('Please generate a strategy first')
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/export-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessData,
          strategy,
          format
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${businessData.name.replace(/\s+/g, '_')}_Business_Strategy.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to export strategy')
      }
    } catch (error) {
      console.error('Error exporting strategy:', error)
      alert('Failed to export strategy. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'Technology/SaaS': return <Zap size={20} />
      case 'E-commerce': return <ShoppingCart size={20} />
      case 'Healthcare': return <Heart size={20} />
      case 'Finance': return <DollarSign size={20} />
      case 'Real Estate': return <Building2 size={20} />
      case 'Consulting': return <Briefcase size={20} />
      default: return <Building2 size={20} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Business Strategy Generator</h1>
              <p className="text-sm text-gray-600">AI-powered solutions for business growth</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Input Panel */}
        <div className="w-1/2 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter business name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={businessData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Size</label>
                  <select
                    value={businessData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Size</option>
                    {businessSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years in Business</label>
                  <input
                    type="text"
                    value={businessData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="e.g., 2 years"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Annual Revenue</label>
                  <input
                    type="text"
                    value={businessData.currentRevenue}
                    onChange={(e) => handleInputChange('currentRevenue', e.target.value)}
                    placeholder="e.g., $500K"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Revenue (12 months)</label>
                  <input
                    type="text"
                    value={businessData.targetRevenue}
                    onChange={(e) => handleInputChange('targetRevenue', e.target.value)}
                    placeholder="e.g., $1M"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
                  <input
                    type="text"
                    value={businessData.employeeCount}
                    onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                    placeholder="e.g., 25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Location</label>
                  <input
                    type="text"
                    value={businessData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., New York, NY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Main Challenges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Main Challenges (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {commonChallenges.map(challenge => (
                    <label key={challenge} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={businessData.mainChallenges.includes(challenge)}
                        onChange={() => handleChallengeToggle(challenge)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{challenge}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Business Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Business Goals (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {commonGoals.map(goal => (
                    <label key={goal} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={businessData.goals.includes(goal)}
                        onChange={() => handleGoalToggle(goal)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Budget</label>
                  <input
                    type="text"
                    value={businessData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="e.g., $50K"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Timeframe</label>
                  <input
                    type="text"
                    value={businessData.timeframe}
                    onChange={(e) => handleInputChange('timeframe', e.target.value)}
                    placeholder="e.g., 6 months"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={generateStrategy}
                disabled={isGenerating || !businessData.name || !businessData.industry}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Lightbulb size={20} />
                    Generate Business Strategy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Strategy Display */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            {strategy.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Transform Your Business?</h3>
                <p className="text-gray-600 mb-6">Fill in your business details and generate a comprehensive strategy tailored to your specific challenges and goals.</p>
                
                {businessData.industry && (
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      {getIndustryIcon(businessData.industry)}
                      <span className="font-medium text-gray-900">{businessData.industry}</span>
                    </div>
                    <p className="text-sm text-gray-600">We'll create strategies specifically for {businessData.industry.toLowerCase()} businesses</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Your Business Strategy</h2>
                  </div>
                  
                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportStrategy('pdf')}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                      title="Export as PDF"
                    >
                      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                      PDF
                    </button>
                    <button
                      onClick={() => exportStrategy('doc')}
                      disabled={isExporting}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                      title="Export as DOC"
                    >
                      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      DOC
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {strategy.map((section, index) => (
                    <div key={index} className="bg-white rounded-lg p-6 border shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${section.color}`}>
                          {section.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {section.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
