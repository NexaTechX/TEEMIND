import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { businessData, strategy, format } = await request.json()

    if (!businessData || !strategy || !format) {
      return NextResponse.json(
        { error: 'Business data, strategy, and format are required' },
        { status: 400 }
      )
    }

    // Generate document content
    const documentContent = generateDocumentContent(businessData, strategy, format)

    if (format === 'pdf') {
      return generatePDF(documentContent, businessData.name)
    } else if (format === 'doc') {
      return generateDOC(documentContent, businessData.name)
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use "pdf" or "doc"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Export strategy error:', error)
    return NextResponse.json(
      { error: 'Failed to export strategy' },
      { status: 500 }
    )
  }
}

function generateDocumentContent(businessData: any, strategy: any[], format: string) {
  const date = new Date().toLocaleDateString()
  
  let content = ''
  
  if (format === 'pdf') {
    content = `
# Business Strategy Report
## ${businessData.name}
*Generated on ${date}*

---

## Executive Summary
This comprehensive business strategy has been developed specifically for ${businessData.name}, a ${businessData.industry} business operating in ${businessData.location}.

**Business Profile:**
- **Industry:** ${businessData.industry}
- **Size:** ${businessData.size}
- **Years in Business:** ${businessData.age}
- **Current Revenue:** ${businessData.currentRevenue}
- **Target Revenue:** ${businessData.targetRevenue}
- **Employees:** ${businessData.employeeCount}
- **Location:** ${businessData.location}
- **Budget:** ${businessData.budget}
- **Timeframe:** ${businessData.timeframe}

**Main Challenges:**
${businessData.mainChallenges.map((challenge: string) => `- ${challenge}`).join('\n')}

**Business Goals:**
${businessData.goals.map((goal: string) => `- ${goal}`).join('\n')}

---

## Strategic Recommendations

${strategy.map((section: any, index: number) => `
### ${index + 1}. ${section.title}

${section.content}

---
`).join('\n')}

## Implementation Timeline

**Phase 1 (Months 1-2):** Immediate Actions
- Crisis management and stabilization
- Customer feedback collection
- Quick wins implementation

**Phase 2 (Months 3-4):** Recovery & Optimization
- Strategy refinement
- Process improvements
- Performance monitoring

**Phase 3 (Months 5-6):** Growth & Expansion
- Market expansion
- New product development
- Strategic partnerships

## Success Metrics

- Revenue growth rate
- Customer acquisition cost (CAC)
- Customer lifetime value (CLV)
- Market share increase
- Employee satisfaction
- Customer satisfaction scores

## Budget Allocation

**Total Budget:** ${businessData.budget}
- Marketing & Sales: 40%
- Technology & Innovation: 25%
- Operations & Process: 20%
- Training & Development: 15%

---

*This strategy was generated using AI-powered business analysis tools and should be reviewed and customized by your management team before implementation.*
    `
  } else {
    // DOC format with simpler formatting
    content = `
BUSINESS STRATEGY REPORT
${businessData.name}
Generated on ${date}

EXECUTIVE SUMMARY
This comprehensive business strategy has been developed specifically for ${businessData.name}, a ${businessData.industry} business operating in ${businessData.location}.

BUSINESS PROFILE
Industry: ${businessData.industry}
Size: ${businessData.size}
Years in Business: ${businessData.age}
Current Revenue: ${businessData.currentRevenue}
Target Revenue: ${businessData.targetRevenue}
Employees: ${businessData.employeeCount}
Location: ${businessData.location}
Budget: ${businessData.budget}
Timeframe: ${businessData.timeframe}

MAIN CHALLENGES
${businessData.mainChallenges.map((challenge: string) => `• ${challenge}`).join('\n')}

BUSINESS GOALS
${businessData.goals.map((goal: string) => `• ${goal}`).join('\n')}

STRATEGIC RECOMMENDATIONS

${strategy.map((section: any, index: number) => `
${index + 1}. ${section.title.toUpperCase()}

${section.content}

`).join('\n')}

IMPLEMENTATION TIMELINE

Phase 1 (Months 1-2): Immediate Actions
• Crisis management and stabilization
• Customer feedback collection
• Quick wins implementation

Phase 2 (Months 3-4): Recovery & Optimization
• Strategy refinement
• Process improvements
• Performance monitoring

Phase 3 (Months 5-6): Growth & Expansion
• Market expansion
• New product development
• Strategic partnerships

SUCCESS METRICS
• Revenue growth rate
• Customer acquisition cost (CAC)
• Customer lifetime value (CLV)
• Market share increase
• Employee satisfaction
• Customer satisfaction scores

BUDGET ALLOCATION
Total Budget: ${businessData.budget}
• Marketing & Sales: 40%
• Technology & Innovation: 25%
• Operations & Process: 20%
• Training & Development: 15%

This strategy was generated using AI-powered business analysis tools and should be reviewed and customized by your management team before implementation.
    `
  }
  
  return content
}

async function generatePDF(content: string, businessName: string) {
  try {
    // For now, we'll create a simple text-based PDF
    // In production, you'd use a library like puppeteer or jsPDF
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${content.length}
>>
stream
${content}
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000210 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${content.length + 300}
%%EOF`

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${businessName.replace(/\s+/g, '_')}_Business_Strategy.pdf"`
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

async function generateDOC(content: string, businessName: string) {
  try {
    // Create a simple DOC format (RTF-like)
    const docContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24
${content.replace(/\n/g, '\\par ')}
}`

    return new NextResponse(docContent, {
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${businessName.replace(/\s+/g, '_')}_Business_Strategy.doc"`
      }
    })
  } catch (error) {
    console.error('DOC generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate DOC' },
      { status: 500 }
    )
  }
}
