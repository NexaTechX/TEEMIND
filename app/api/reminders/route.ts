import { NextRequest, NextResponse } from 'next/server'

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

    // In a real app, you'd fetch from database
    // For now, return mock data
    const reminders = [
      {
        id: '1',
        goalId: 'goal-1',
        title: 'Review Progress',
        message: 'Time to check your goal progress',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        isCompleted: false,
        type: 'milestone'
      }
    ]

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { goalId, stepId, title, message, dueDate, type } = await request.json()

    if (!goalId || !title || !message || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const reminder = {
      id: Date.now().toString(),
      goalId,
      stepId,
      title,
      message,
      dueDate: new Date(dueDate),
      isCompleted: false,
      type: type || 'goal'
    }

    // In a real app, save to database
    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      reminder 
    })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { reminderId, updates } = await request.json()

    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
        { status: 400 }
      )
    }

    // In a real app, update in database
    return NextResponse.json({ 
      success: true, 
      message: 'Reminder updated successfully' 
    })
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reminderId = searchParams.get('id')

    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
        { status: 400 }
      )
    }

    // In a real app, delete from database
    return NextResponse.json({ 
      success: true, 
      message: 'Reminder deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    )
  }
}
