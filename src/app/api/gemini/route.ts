import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get("audio") as Blob
    const jobDescription = formData.get("jobDescription") as string
    const previousQuestions = formData.get("previousQuestions") as string
    const userProfile = formData.get("userProfile") as string

    if (!audioBlob) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 })
    }

    // Convert audio blob to base64
    const audioBuffer = await audioBlob.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString("base64")

    // Use Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    
    const prompt = `
      You are an AI interviewer conducting a job interview. 
      
      IMPORTANT: Return ONLY the JSON object, with no additional text, markdown formatting, or explanations.
      The response should start with { and end with }.
      
      Job Description: ${jobDescription}
      
      ${userProfile ? `Candidate Profile: ${userProfile}` : ""}
      
      ${previousQuestions ? `Previous questions and answers in this interview: ${previousQuestions}` : ""}
      
      The candidate has just responded. Please analyze their response and provide your next question.
      
      Return the data in this exact JSON structure:
      {
        "response": "Your response as the interviewer",
        "nextQuestion": "Your follow-up question based on the candidate's answer, job description, and their profile"
      }
      
      Guidelines:
      1. Make your questions relevant to both the job description and the candidate's background when available
      2. Keep responses concise and professional
      3. DO NOT include any text before or after the JSON object
      4. DO NOT use markdown code blocks or formatting
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/webm",
          data: audioBase64,
        },
      },
    ])

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
    console.error("Error calling Gemini API:", error)
    return NextResponse.json({ error: "Failed to process with Gemini" }, { status: 500 })
  }
}

