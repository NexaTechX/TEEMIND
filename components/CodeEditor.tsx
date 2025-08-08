'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Copy, Save, Lightbulb, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface CodeEditorProps {
  onCodeChange: (code: string) => void
  onRunCode: (code: string) => void
}

interface CodeIssue {
  line: number
  message: string
  severity: 'error' | 'warning' | 'info'
  fix?: string
}

export default function CodeEditor({ onCodeChange, onRunCode }: CodeEditorProps) {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [issues, setIssues] = useState<CodeIssue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    onCodeChange(newCode)
    analyzeCode(newCode)
  }

  const analyzeCode = async (codeToAnalyze: string) => {
    if (!codeToAnalyze.trim()) {
      setIssues([])
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/code-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToAnalyze })
      })

      if (response.ok) {
        const data = await response.json()
        setIssues(data.issues || [])
      }
    } catch (error) {
      console.error('Error analyzing code:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const fixCode = async (issue: CodeIssue) => {
    setIsFixing(true)
    try {
      const response = await fetch('/api/code-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          issue: {
            line: issue.line,
            message: issue.message,
            severity: issue.severity
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCode(data.fixedCode)
        onCodeChange(data.fixedCode)
        setIssues(prev => prev.filter(i => i !== issue))
        setSelectedIssue(null)
      }
    } catch (error) {
      console.error('Error fixing code:', error)
    } finally {
      setIsFixing(false)
    }
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('')
    
    try {
      // Capture console.log output
      const originalLog = console.log
      let capturedOutput = ''
      
      console.log = (...args) => {
        capturedOutput += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n'
        originalLog(...args)
      }

      // Run the code
      const result = eval(code)
      
      // Restore console.log
      console.log = originalLog
      
      // Add result to output
      if (result !== undefined) {
        capturedOutput += `Result: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}\n`
      }
      
      setOutput(capturedOutput)
      onRunCode(code)
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsRunning(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
  }

  const saveCode = () => {
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'code.js'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getLineNumber = (text: string, cursorPosition: number) => {
    return text.substring(0, cursorPosition).split('\n').length
  }

  const handleTextareaClick = () => {
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart
      const lineNumber = getLineNumber(code, cursorPosition)
      const issueAtLine = issues.find(issue => issue.line === lineNumber)
      setSelectedIssue(issueAtLine || null)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-500'
      case 'warning': return 'text-yellow-500'
      case 'info': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle size={16} />
      case 'warning': return <AlertCircle size={16} />
      case 'info': return <Lightbulb size={16} />
      default: return <Lightbulb size={16} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Code Lab</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              title="Copy code"
            >
              <Copy size={16} />
              Copy
            </button>
            <button
              onClick={saveCode}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              title="Save code"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
              <button
                onClick={runCode}
                disabled={isRunning || !code.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onClick={handleTextareaClick}
              placeholder="Write your JavaScript code here..."
              className="w-full h-64 resize-none border border-gray-300 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Output */}
          <div className="flex-1 bg-white p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Output</h3>
            <div className="bg-gray-100 rounded-lg p-4 h-full overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {output || 'Run your code to see the output here...'}
              </pre>
            </div>
          </div>
        </div>

        {/* AI Assistant Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Lightbulb size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              {isAnalyzing && <Loader2 size={16} className="animate-spin text-blue-600" />}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {issues.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p className="text-sm">No issues detected</p>
                <p className="text-xs mt-2">Your code looks good!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 mb-3">Issues Found:</h4>
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedIssue === issue
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 ${getSeverityColor(issue.severity)}`}>
                        {getSeverityIcon(issue.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            Line {issue.line}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            issue.severity === 'error' ? 'bg-red-100 text-red-700' :
                            issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{issue.message}</p>
                        {selectedIssue === issue && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              fixCode(issue)
                            }}
                            disabled={isFixing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {isFixing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            {isFixing ? 'Fixing...' : 'Fix with AI'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
