import { NextRequest, NextResponse } from 'next/server'
import { generateResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { code, issue } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    if (!issue || !issue.message) {
      return NextResponse.json(
        { error: 'Issue details are required' },
        { status: 400 }
      )
    }

    const fixPrompt = `Fix this JavaScript code based on the issue described. Return only the corrected code without any explanations or markdown formatting.

Original code:
\`\`\`javascript
${code}
\`\`\`

Issue to fix:
- Line: ${issue.line}
- Message: ${issue.message}
- Severity: ${issue.severity}

Provide the corrected code:`

    const response = await generateResponse(fixPrompt)
    
    // Clean up the response to get just the code
    let fixedCode = response.text.trim()
    
    // Remove markdown code blocks if present
    if (fixedCode.startsWith('```javascript')) {
      fixedCode = fixedCode.replace(/^```javascript\n/, '').replace(/\n```$/, '')
    } else if (fixedCode.startsWith('```')) {
      fixedCode = fixedCode.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    return NextResponse.json({ 
      fixedCode,
      originalIssue: issue
    })
  } catch (error) {
    console.error('Code fix error:', error)
    return NextResponse.json(
      { error: 'Failed to fix code' },
      { status: 500 }
    )
  }
}
