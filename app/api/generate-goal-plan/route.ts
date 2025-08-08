import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { goal, description, category, targetDate, priority } = await request.json()

    if (!goal || !description) {
      return NextResponse.json(
        { error: 'Goal title and description are required' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    // Calculate timeline based on target date
    const targetDateObj = new Date(targetDate)
    const today = new Date()
    const daysUntilTarget = Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Analyze the goal topic and determine the best framework
    const framework = await analyzeGoalAndGetFramework(goal, description, category, priority, daysUntilTarget)
    
    const prompt = `You are Tee Shine, an expert in goal achievement and personal development. Create a comprehensive guide and framework for achieving this goal:

GOAL: ${goal}
DESCRIPTION: ${description}
CATEGORY: ${category}
PRIORITY: ${priority}
TIMELINE: ${daysUntilTarget} days until target date

FRAMEWORK: ${framework.name}
FRAMEWORK DESCRIPTION: ${framework.description}

Create a detailed guide with the following structure:

1. **GUIDE OVERVIEW**
   - What this goal means and why it's important
   - Key benefits of achieving this goal
   - Common challenges and how to overcome them
   - Success mindset and approach

2. **FRAMEWORK BREAKDOWN**
   - Phase-by-phase explanation of the framework
   - How each phase builds on the previous one
   - Key principles and methodologies
   - Adaptations for different skill levels

3. **ACTIONABLE STEPS**
   - Specific, practical steps to take
   - Clear instructions and guidance
   - Realistic time estimates
   - Progress tracking methods

4. **RESOURCES AND TOOLS**
   - Recommended books, courses, and materials
   - Tools and apps that will help
   - Community and support networks
   - Expert insights and tips

5. **SUCCESS METRICS**
   - How to measure progress
   - Key milestones and checkpoints
   - Signs of success and completion
   - Celebration and reflection points

Return the response as a JSON object with this structure:
{
  "framework": {
    "name": "Framework Name",
    "description": "Framework description",
    "phases": ["Phase 1", "Phase 2", "Phase 3", "Phase 4"],
    "principles": ["Principle 1", "Principle 2", "Principle 3"]
  },
  "guide": {
    "overview": "Comprehensive overview of the goal and approach",
    "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
    "challenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
    "mindset": "Success mindset and approach",
    "methodology": "Detailed methodology explanation"
  },
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed description with guidance",
      "estimatedTime": 120,
      "dueDate": "2024-01-15",
      "order": 1,
      "phase": "Phase 1",
      "difficulty": "Beginner",
      "resources": ["Resource 1", "Resource 2"],
      "successCriteria": "How to measure completion",
      "tips": "Tee Shine's expert tips",
      "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
    }
  ],
  "resources": {
    "books": ["Book 1", "Book 2"],
    "courses": ["Course 1", "Course 2"],
    "tools": ["Tool 1", "Tool 2"],
    "communities": ["Community 1", "Community 2"]
  },
  "metrics": {
    "progressIndicators": ["Indicator 1", "Indicator 2"],
    "milestones": ["Milestone 1", "Milestone 2"],
    "successSigns": ["Sign 1", "Sign 2"]
  }
}

Make the guide practical, inspiring, and tailored to the specific goal. Include Tee Shine's personal insights, proven strategies, and real-world examples.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are Tee Shine, a renowned business and personal development expert. You have helped thousands of people achieve their goals through practical, actionable advice. 

Your expertise includes:
- Business strategy and entrepreneurship
- Personal development and goal achievement
- Learning and skill development
- Health and wellness optimization
- Technology and innovation
- Creative projects and artistic endeavors

When creating roadmaps, always:
1. Provide specific, actionable steps
2. Include realistic time estimates
3. Consider the user's priority level
4. Add your personal insights and tips
5. Include resources and tools needed
6. Set clear success criteria
7. Account for different skill levels
8. Include milestone celebrations

Be encouraging, practical, and results-focused.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let roadmapData
    try {
      roadmapData = JSON.parse(response)
    } catch (error) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        roadmapData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse roadmap from response')
      }
    }

    // Validate and format the roadmap
    const formattedSteps = roadmapData.steps?.map((step: any, index: number) => ({
      title: step.title || `Step ${index + 1}`,
      description: step.description || 'Complete this step',
      estimatedTime: step.estimatedTime || 60,
      dueDate: step.dueDate || getDefaultDueDate(index, daysUntilTarget),
      order: step.order || index + 1,
      phase: step.phase || 'Phase 1',
      difficulty: step.difficulty || 'Beginner',
      resources: step.resources || [],
      successCriteria: step.successCriteria || 'Complete the task',
      tips: step.tips || 'Focus on quality over speed',
      prerequisites: step.prerequisites || []
    })) || []

    return NextResponse.json({
      success: true,
      framework: roadmapData.framework || framework,
      guide: roadmapData.guide || {
        overview: `Complete guide for ${goal}`,
        benefits: ['Personal growth', 'Skill development', 'Achievement satisfaction'],
        challenges: ['Time management', 'Consistency', 'Overcoming setbacks'],
        mindset: 'Focus on progress over perfection',
        methodology: 'Systematic approach with regular review and adjustment'
      },
      steps: formattedSteps,
      resources: roadmapData.resources || {
        books: ['Recommended reading for this goal'],
        courses: ['Online courses and training'],
        tools: ['Helpful apps and software'],
        communities: ['Support groups and networks']
      },
      metrics: roadmapData.metrics || {
        progressIndicators: ['Regular check-ins', 'Milestone completion'],
        milestones: ['Foundation complete', 'Core skills mastered', 'Goal achieved'],
        successSigns: ['Consistent progress', 'Improved confidence', 'Goal completion']
      },
      totalSteps: formattedSteps.length,
      estimatedTotalTime: formattedSteps.reduce((sum: number, step: any) => sum + step.estimatedTime, 0)
    })

  } catch (error) {
    console.error('Error generating goal plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate goal plan' },
      { status: 500 }
    )
  }
}

async function analyzeGoalAndGetFramework(goal: string, description: string, category: string, priority: string, daysUntilTarget: number) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  
  const analysisPrompt = `Analyze this goal and determine the best framework to use:

GOAL: ${goal}
DESCRIPTION: ${description}
CATEGORY: ${category}
PRIORITY: ${priority}
TIMELINE: ${daysUntilTarget} days

Available frameworks:
1. Learning Mastery Framework - For educational goals
2. Career Advancement Framework - For professional development
3. Health Transformation Framework - For fitness and wellness
4. Business Growth Framework - For entrepreneurial goals
5. Personal Development Framework - For self-improvement
6. Tech Learning Framework - For technical skills
7. Creative Project Framework - For artistic endeavors
8. Custom Framework - For unique goals

Return only the framework name and a brief description of why it's the best choice.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in goal analysis and framework selection. Choose the most appropriate framework based on the goal content and category.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Extract framework name from response
    const frameworkMatch = response.match(/(\d+\.\s*)?([^:]+?)\s*Framework/i)
    const frameworkName = frameworkMatch ? frameworkMatch[2].trim() : 'Personal Development Framework'
    
    return getFrameworkByName(frameworkName, category, priority, daysUntilTarget)
  } catch (error) {
    console.error('Error analyzing goal:', error)
    return getFrameworkForCategory(category, priority, daysUntilTarget)
  }
}

function getFrameworkByName(name: string, category: string, priority: string, daysUntilTarget: number) {
  const frameworks = {
    'Learning Mastery': {
      name: 'Learning Mastery Framework',
      description: 'Research → Plan → Learn → Practice → Review → Apply → Master'
    },
    'Career Advancement': {
      name: 'Career Advancement Framework',
      description: 'Assessment → Skill Gap Analysis → Learning Plan → Implementation → Networking → Promotion'
    },
    'Health Transformation': {
      name: 'Health Transformation Framework',
      description: 'Assessment → Goal Setting → Habit Formation → Progress Tracking → Optimization → Maintenance'
    },
    'Business Growth': {
      name: 'Business Growth Framework',
      description: 'Market Research → Strategy Development → Implementation → Scaling → Optimization'
    },
    'Personal Development': {
      name: 'Personal Development Framework',
      description: 'Self-Assessment → Goal Clarity → Action Planning → Habit Building → Progress Review → Continuous Improvement'
    },
    'Tech Learning': {
      name: 'Tech Learning Framework',
      description: 'Foundation → Core Concepts → Practical Projects → Advanced Topics → Real-world Application'
    },
    'Creative Project': {
      name: 'Creative Project Framework',
      description: 'Inspiration → Planning → Creation → Refinement → Sharing → Feedback → Iteration'
    }
  }

  const frameworkKey = Object.keys(frameworks).find(key => 
    name.toLowerCase().includes(key.toLowerCase())
  )

  return frameworks[frameworkKey as keyof typeof frameworks] || frameworks['Personal Development']
}

function getFrameworkForCategory(category: string, priority: string, daysUntilTarget: number) {
  const frameworks = {
    learning: {
      name: 'Learning Mastery Framework',
      description: 'Research → Plan → Learn → Practice → Review → Apply → Master'
    },
    career: {
      name: 'Career Advancement Framework',
      description: 'Assessment → Skill Gap Analysis → Learning Plan → Implementation → Networking → Promotion'
    },
    health: {
      name: 'Health Transformation Framework',
      description: 'Assessment → Goal Setting → Habit Formation → Progress Tracking → Optimization → Maintenance'
    },
    business: {
      name: 'Business Growth Framework',
      description: 'Market Research → Strategy Development → Implementation → Scaling → Optimization'
    },
    personal: {
      name: 'Personal Development Framework',
      description: 'Self-Assessment → Goal Clarity → Action Planning → Habit Building → Progress Review → Continuous Improvement'
    },
    technology: {
      name: 'Tech Learning Framework',
      description: 'Foundation → Core Concepts → Practical Projects → Advanced Topics → Real-world Application'
    },
    creative: {
      name: 'Creative Project Framework',
      description: 'Inspiration → Planning → Creation → Refinement → Sharing → Feedback → Iteration'
    }
  }

  return frameworks[category as keyof typeof frameworks] || frameworks.personal
}

function getDefaultDueDate(stepIndex: number, totalDays: number) {
  const today = new Date()
  const daysToAdd = Math.floor((stepIndex + 1) * (totalDays / 5)) // Spread across 5 steps
  const dueDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  return dueDate.toISOString().split('T')[0]
}
