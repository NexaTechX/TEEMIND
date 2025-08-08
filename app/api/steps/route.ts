import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('goalId')
    
    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    const { data: steps, error } = await supabase
      .from('goal_steps')
      .select('*')
      .eq('goal_id', goalId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching steps:', error)
      return NextResponse.json(
        { error: 'Failed to fetch steps' },
        { status: 500 }
      )
    }

    return NextResponse.json({ steps: steps || [] })
  } catch (error) {
    console.error('Error in steps GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      goalId, title, description, estimatedTime, dueDate, 
      order, phase, difficulty, resources, successCriteria, 
      tips, prerequisites 
    } = await request.json()

    if (!goalId || !title || !description) {
      return NextResponse.json(
        { error: 'Goal ID, title, and description are required' },
        { status: 400 }
      )
    }

    const newStep = {
      goal_id: goalId,
      title,
      description,
      estimated_time: estimatedTime || 60,
      due_date: new Date(dueDate).toISOString(),
      order_index: order || 1,
      phase: phase || 'Phase 1',
      difficulty: difficulty || 'Beginner',
      status: 'pending',
      resources: resources || [],
      success_criteria: successCriteria || 'Complete the task',
      tips: tips || 'Focus on quality over speed',
      prerequisites: prerequisites || [],
      created_at: new Date().toISOString()
    }

    const { data: step, error } = await supabase
      .from('goal_steps')
      .insert([newStep])
      .select()
      .single()

    if (error) {
      console.error('Error creating step:', error)
      return NextResponse.json(
        { error: 'Failed to create step' },
        { status: 500 }
      )
    }

    return NextResponse.json({ step })
  } catch (error) {
    console.error('Error in steps POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { stepId, updates } = await request.json()

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    const { data: step, error } = await supabase
      .from('goal_steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single()

    if (error) {
      console.error('Error updating step:', error)
      return NextResponse.json(
        { error: 'Failed to update step' },
        { status: 500 }
      )
    }

    return NextResponse.json({ step })
  } catch (error) {
    console.error('Error in steps PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stepId = searchParams.get('id')

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('goal_steps')
      .delete()
      .eq('id', stepId)

    if (error) {
      console.error('Error deleting step:', error)
      return NextResponse.json(
        { error: 'Failed to delete step' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in steps DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
