import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      )
    }

    return NextResponse.json({ goals: goals || [] })
  } catch (error) {
    console.error('Error in goals GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, category, priority, targetDate, userId } = await request.json()

    if (!title || !description || !category || !priority || !targetDate || !userId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const newGoal = {
      user_id: userId,
      title,
      description,
      category,
      priority,
      status: 'not-started',
      target_date: new Date(targetDate).toISOString(),
      created_at: new Date().toISOString(),
      roadmap: null,
      guidelines: null
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .insert([newGoal])
      .select()
      .single()

    if (error) {
      console.error('Error creating goal:', error)
      return NextResponse.json(
        { error: 'Failed to create goal' },
        { status: 500 }
      )
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error in goals POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { goalId, updates } = await request.json()

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    const { data: goal, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single()

    if (error) {
      console.error('Error updating goal:', error)
      return NextResponse.json(
        { error: 'Failed to update goal' },
        { status: 500 }
      )
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error in goals PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)

    if (error) {
      console.error('Error deleting goal:', error)
      return NextResponse.json(
        { error: 'Failed to delete goal' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in goals DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
