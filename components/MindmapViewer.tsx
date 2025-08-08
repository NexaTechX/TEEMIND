'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface MindmapViewerProps {
  mindmapData: string
  className?: string
}

interface MindmapNode {
  id: string
  name: string
  children?: MindmapNode[]
}

export default function MindmapViewer({ mindmapData, className = '' }: MindmapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || !mindmapData) return

    const renderMindmap = () => {
      try {
      setIsLoading(true)
      setError(null)

        // Clear previous content
        d3.select(containerRef.current).selectAll('*').remove()

        // Parse the mindmap data
        const nodeData = parseMindmapData(mindmapData)
        
        // Create the hierarchy
        const root = d3.hierarchy(nodeData)
        
        // Set up the tree layout for horizontal mindmap
        const tree = d3.tree<MindmapNode>()
          .size([800, 600])
          .nodeSize([100, 150])
        
        const treeData = tree(root)
        
        // Create SVG
        const svg = d3.select(containerRef.current)
          .append('svg')
          .attr('width', '100%')
          .attr('height', '600')
          .attr('viewBox', '0 0 800 600')
          .style('background', '#f8fafc')
        
        // Color palette for different branches
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#10b981', '#f59e0b']
        
        // Create links with curved paths
        const linkGenerator = d3.linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x)
        
        svg.selectAll('.link')
          .data(treeData.links())
          .enter()
          .append('path')
          .attr('class', 'link')
          .attr('d', (d: any) => linkGenerator(d))
          .attr('fill', 'none')
          .attr('stroke', '#9ca3af')
          .attr('stroke-width', 3)
          .attr('stroke-linecap', 'round')
        
        // Create nodes
        const nodes = svg.selectAll('.node')
          .data(treeData.descendants())
          .enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
        
        // Add rounded rectangles for nodes
        nodes.append('rect')
          .attr('width', (d: any) => Math.max(d.data.name.length * 8 + 20, 80))
          .attr('height', 40)
          .attr('x', (d: any) => -(d.data.name.length * 8 + 20) / 2)
          .attr('y', -20)
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('fill', (d: any, i: number) => {
            if (d.data.children && d.data.children.length > 0) {
              return colors[i % colors.length]
            }
            return '#6b7280'
          })
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 2)
          .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        
        // Add labels
        nodes.append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('font-weight', (d: any) => d.data.children && d.data.children.length > 0 ? 'bold' : 'normal')
          .attr('fill', '#ffffff')
          .text((d: any) => d.data.name)
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error rendering mindmap:', err)
        setError('Failed to create mindmap')
        setIsLoading(false)
      }
    }

    renderMindmap()
  }, [mindmapData])

  const parseMindmapData = (data: string): MindmapNode => {
    // Parse the mindmap data into D3 hierarchy format
    const lines = data.split('\n').filter(line => line.trim())
    const root: MindmapNode = { id: 'root', name: 'Main Topic', children: [] }
    
    let currentNode = root
    let stack: MindmapNode[] = [root]
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('mindmap') || trimmed.startsWith('root')) continue
      
      const depth = line.length - trimmed.length
      const name = trimmed.replace(/^[-*]\s*/, '')
      
      if (depth === 0) {
        // Root level
        const node: MindmapNode = { 
          id: `node-${Date.now()}-${Math.random()}`, 
          name, 
          children: [] 
        }
        root.children!.push(node)
        currentNode = node
        stack = [root, node]
      } else {
        // Child level
        const node: MindmapNode = { 
          id: `node-${Date.now()}-${Math.random()}`, 
          name, 
          children: [] 
        }
        
        // Find the correct parent based on depth
        while (stack.length > depth) {
          stack.pop()
        }
        
        const parent = stack[stack.length - 1]
        if (parent.children) {
          parent.children.push(node)
        }
        
        stack.push(node)
      }
    }
    
    return root
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Generating mindmap...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-600">⚠️ {error}</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={`mindmap-container ${className}`}
      style={{ minHeight: '600px', width: '100%' }}
    />
  )
}