import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { productTitle, keywords } = await request.json()

    if (!productTitle || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Invalid input: productTitle (string) and keywords (array) are required' },
        { status: 400 }
      )
    }

    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    if (!deepseekApiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY environment variable is not configured' },
        { status: 500 }
      )
    }

    const prompt = `
You are a professional cross-border e-commerce marketing copywriter.
Generate a high-converting 3-point bulleted English marketing description for the following product.

Product Title: ${productTitle}
Target Keywords to include: ${keywords.join(', ')}

Tone: Professional and Persuasive, suitable for the global English-speaking market.
Requirements:
1. Each bullet point should highlight a key benefit or feature of the product
2. Include the provided keywords naturally throughout the copy
3. Keep each bullet point concise, clear, and compelling for potential customers
4. Do not use any markdown formatting except the bullet points
5. Total length should be 100-150 words

Output only the 3 bullet points, no additional text.
`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const generatedCopy = data.choices[0].message.content.trim()

    return NextResponse.json({
      success: true,
      generatedCopy
    })

  } catch (error: unknown) {
    console.error('Error generating copy:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate marketing copy'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
