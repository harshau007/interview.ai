import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, questions, userProfile } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 400 }
      );
    }

    // Use Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    
    const prompt = `
      You are an AI interview evaluator. Your task is to evaluate the candidate's interview performance and provide structured feedback.
      
      IMPORTANT: Return ONLY the JSON object, with no additional text, markdown formatting, or explanations.
      The response should start with { and end with }.
      
      Job Description: ${jobDescription}
      
      ${userProfile ? `Candidate Profile: ${JSON.stringify(userProfile)}` : ""}
      
      Interview Questions and Answers:
      ${JSON.stringify(questions)}
      
      Return the data in this exact JSON structure:
      {
        "score": [A number between 0-100 representing the overall score],
        "feedback": [Detailed feedback about the candidate's performance, strengths, and areas for improvement],
        "questionFeedback": [An array of objects with feedback for each question]
      }
      
      Guidelines:
      1. Score should be a number between 0-100
      2. Feedback should be detailed and constructive
      3. Question feedback should be specific to each question
      4. Consider both job requirements and candidate's background
      5. DO NOT include any text before or after the JSON object
      6. DO NOT use markdown code blocks or formatting
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const textResponse = response.text()

    // Clean the response text
    const cleanedText = textResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // Extract the JSON from the text response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response")
    }

    const jsonResponse = JSON.parse(jsonMatch[0])

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error calling Gemini API for scoring:", error)
    return NextResponse.json({ error: "Failed to process scoring with Gemini" }, { status: 500 })
  }
}

