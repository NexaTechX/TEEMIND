import { NextRequest, NextResponse } from 'next/server'
import { generateResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const analysisPrompt = `Analyze this JavaScript code and identify potential issues. Return a JSON array of issues with the following structure:

{
  "issues": [
    {
      "line": number,
      "message": "Description of the issue",
      "severity": "error|warning|info"
    }
  ]
}

Focus on:
- Syntax errors
- Common JavaScript mistakes
- Best practices violations
- Potential runtime errors
- Code style improvements

Code to analyze:
\`\`\`javascript
${code}
\`\`\`

Return only valid JSON:`

    const response = await generateResponse(analysisPrompt)
    
    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(response.text)
      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      // If parsing fails, create a basic analysis
      const issues = []
      const lines = code.split('\n')
      
      // Basic syntax check
      try {
        eval(code)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        issues.push({
          line: 1,
          message: `Syntax error: ${errorMessage}`,
          severity: 'error'
        })
      }

      // Check for common issues
      if (code.includes('console.log') && !code.includes('console.log(')) {
        issues.push({
          line: lines.findIndex(line => line.includes('console.log')) + 1,
          message: 'console.log should be called with parentheses',
          severity: 'warning'
        })
      }

      if (code.includes('var ') && !code.includes('let ') && !code.includes('const ')) {
        issues.push({
          line: lines.findIndex(line => line.includes('var ')) + 1,
          message: 'Consider using let or const instead of var',
          severity: 'info'
        })
      }

      return NextResponse.json({ issues })
    }
  } catch (error) {
    console.error('Code analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze code' },
      { status: 500 }
    )
  }
}
