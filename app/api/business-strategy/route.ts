import { NextRequest, NextResponse } from 'next/server'
import { generateResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const businessData = await request.json()

    if (!businessData.name || !businessData.industry) {
      return NextResponse.json(
        { error: 'Business name and industry are required' },
        { status: 400 }
      )
    }

    const strategyPrompt = `Create a comprehensive business strategy for ${businessData.name}, a ${businessData.industry} business.

Business Profile:
- Size: ${businessData.size}
- Years in Business: ${businessData.age}
- Current Revenue: ${businessData.currentRevenue}
- Target Revenue: ${businessData.targetRevenue}
- Employees: ${businessData.employeeCount}
- Location: ${businessData.location}
- Budget: ${businessData.budget}
- Timeframe: ${businessData.timeframe}

Main Challenges: ${businessData.mainChallenges.join(', ')}
Business Goals: ${businessData.goals.join(', ')}

Create a detailed strategy with the following sections:

1. **Crisis Management & Recovery** (if sales are dropping)
2. **Revenue Growth Strategy**
3. **Customer Acquisition & Retention**
4. **Operational Optimization**
5. **Marketing & Brand Strategy**
6. **Financial Management**
7. **Technology & Innovation**
8. **Implementation Roadmap**

For each section, provide:
- Specific, actionable strategies
- Industry-specific recommendations
- Timeline and budget considerations
- Success metrics
- Risk mitigation

Focus especially on solutions for the main challenges mentioned. If sales are dropping, provide immediate crisis management steps.

Return the strategy as a JSON array with this structure:
{
  "strategy": [
    {
      "title": "Section Title",
      "content": "Detailed strategy content with actionable steps...",
      "icon": "icon-name",
      "color": "bg-blue-100 text-blue-600"
    }
  ]
}`

    const response = await generateResponse(strategyPrompt)
    
    try {
      const parsedResponse = JSON.parse(response.text)
      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      // Fallback strategy if JSON parsing fails
      const fallbackStrategy = [
        {
          title: "Crisis Management & Recovery",
          content: `Based on your challenges, here's an immediate action plan:

1. **Immediate Actions (Week 1-2):**
   - Conduct customer feedback surveys to understand why sales are dropping
   - Review your pricing strategy and competitive positioning
   - Analyze your sales funnel for bottlenecks
   - Implement customer retention programs

2. **Short-term Recovery (Month 1-3):**
   - Optimize your marketing spend for better ROI
   - Launch targeted promotions for existing customers
   - Improve your product/service quality based on feedback
   - Strengthen your sales team with training and incentives

3. **Medium-term Growth (Month 4-6):**
   - Expand to new markets or customer segments
   - Launch new products/services
   - Implement advanced analytics for better decision-making
   - Build strategic partnerships

Budget Allocation: ${businessData.budget}
Timeline: ${businessData.timeframe}`,
          icon: "TrendingUp",
          color: "bg-red-100 text-red-600"
        },
        {
          title: "Revenue Growth Strategy",
          content: `To achieve your target revenue of ${businessData.targetRevenue}:

1. **Customer Expansion:**
   - Identify new customer segments
   - Develop referral programs
   - Create upsell/cross-sell opportunities
   - Implement subscription models

2. **Market Expansion:**
   - Geographic expansion opportunities
   - Online presence optimization
   - International market entry
   - Strategic partnerships

3. **Product/Service Development:**
   - New product launches
   - Service diversification
   - Premium offerings
   - Customization options`,
          icon: "DollarSign",
          color: "bg-green-100 text-green-600"
        },
        {
          title: "Implementation Roadmap",
          content: `Phase 1 (Months 1-2): Crisis Management
- Immediate customer feedback collection
- Pricing strategy review
- Sales funnel optimization

Phase 2 (Months 3-4): Recovery & Optimization
- Marketing campaign optimization
- Customer retention programs
- Operational improvements

Phase 3 (Months 5-6): Growth & Expansion
- New market entry
- Product development
- Strategic partnerships

Success Metrics:
- Revenue growth rate
- Customer acquisition cost
- Customer lifetime value
- Market share increase`,
          icon: "Target",
          color: "bg-blue-100 text-blue-600"
        }
      ]
      
      return NextResponse.json({ strategy: fallbackStrategy })
    }
  } catch (error) {
    console.error('Business strategy error:', error)
    return NextResponse.json(
      { error: 'Failed to generate business strategy' },
      { status: 500 }
    )
  }
}
