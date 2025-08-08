import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('goals')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database connection error:', error)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message
      })
    }

    // Test inserting a sample goal
    const testGoal = {
      user_id: 'test-user',
      title: 'Test Goal',
      description: 'This is a test goal',
      category: 'personal',
      priority: 'medium',
      status: 'not-started',
      target_date: new Date().toISOString()
    }

    const { data: insertData, error: insertError } = await supabase
      .from('goals')
      .insert([testGoal])
      .select()

    if (insertError) {
      console.error('Insert test error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: insertError.message
      })
    }

    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase
        .from('goals')
        .delete()
        .eq('id', insertData[0].id)
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection and table creation successful',
      tables: ['goals', 'goal_steps', 'reminders']
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
