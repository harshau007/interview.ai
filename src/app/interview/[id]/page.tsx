"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Info, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, use } from "react"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { ElevenLabsClient } from "@/lib/elevenlabs"

type InterviewerState = {
  name: string
  initials: string
  speaking: boolean
  message: string
  currentQuestion: string
}

interface SpeechVoice {
  name: string
  lang: string
}

const getInitials = (name: string) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const {
    setCurrentSession,
    getCurrentSession,
    addQuestion,
    addAnswer,
    updateSession,
    completeSession,
    setScore,
    userProfile,
  } = useStore()
  const resolvedParams = use(params)
  const { theme } = useTheme()
  const [interviewer, setInterviewer] = useState<InterviewerState>({
    name: "AI Interviewer",
    initials: "AI",
    speaking: false,
    message: "",
    currentQuestion: "",
  })

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)

  const [interviewState, setInterviewState] = useState<{
    stage: "intro" | "questions" | "outro" | "completed"
    questionIndex: number
    totalQuestions: number
  }>({
    stage: "intro",
    questionIndex: 0,
    totalQuestions: 10,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const elevenlabsRef = useRef<ElevenLabsClient | null>(null)

  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)

  const [audioError, setAudioError] = useState(false)

  const [showMicHint, setShowMicHint] = useState(true)

  // Hide the mic hint after 10 seconds
  useEffect(() => {
    if (showMicHint) {
      const timer = setTimeout(() => {
        setShowMicHint(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showMicHint])

  // Hide the mic hint when recording starts
  useEffect(() => {
    if (isRecording) {
      setShowMicHint(false)
    }
  }, [isRecording])

  const getNextQuestion = async (audioBlob: Blob) => {
    const session = getCurrentSession()
    if (!session) return

    try {
      // Prepare previous questions and answers for context
      const previousQuestions = session.questions.map((q) => ({
        question: q.question,
        answer: q.answer || "",
      }))

      // Create form data for the audio
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("jobDescription", session.jobDescription)
      formData.append("previousQuestions", JSON.stringify(previousQuestions))
      if (userProfile) {
        formData.append("userProfile", JSON.stringify(userProfile))
      }

      // Call the Gemini API directly with audio
      const response = await fetch("/api/gemini", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to get next question")
      }

      const data = await response.json()

      // Save the transcript from Gemini's understanding
      setTranscript(data.transcript || "")

      // Update interviewer state with the response
      setInterviewer((prev) => ({
        ...prev,
        speaking: true,
        message: data.response,
        currentQuestion: data.nextQuestion,
      }))

      // Speak the response first and wait for it to complete
      await speak(data.response)

      // Add a delay between response and question
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check if we should move to the next stage
      const nextQuestionIndex = interviewState.questionIndex + 1
      if (nextQuestionIndex >= interviewState.totalQuestions) {
        // Move to outro
        setInterviewState((prev) => ({ ...prev, stage: "outro" }))

        // Final message
        setInterviewer((prev) => ({
          ...prev,
          speaking: true,
          message:
            "Thank you for participating in this interview. You've answered all my questions. I'll now provide you with feedback on your performance.",
          currentQuestion: "",
        }))

        // Complete the interview and get the score
        await completeInterviewAndScore()
      } else {
        // Add the next question
        addQuestion(session._id, data.nextQuestion)

        // Move to the next question
        setInterviewState((prev) => ({
          ...prev,
          questionIndex: nextQuestionIndex,
        }))
        
        // Only speak the next question after the response is complete
        // Update interviewer state to show the next question
        setInterviewer((prev) => ({
          ...prev,
          speaking: true,
          currentQuestion: data.nextQuestion,
        }))
        
        // Speak the next question
        await speak(data.nextQuestion)
      }
    } catch (error) {
      console.error("Error getting next question:", error)
      toast.error("Error", {
        description: "Failed to process your response. Please try again.",
      })
    }
  }

  const completeInterviewAndScore = async () => {
    const session = getCurrentSession()
    if (!session) return

    try {
      // Call the scoring API
      const response = await fetch("/api/gemini/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobDescription: session.jobDescription,
          questions: session.questions,
          userProfile,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get score")
      }

      const data = await response.json()

      // Update the session with the score and feedback
      setScore(session._id, data.score, data.feedback)

      // Complete the session
      completeSession(session._id)

      // Move to completed stage
      setInterviewState((prev) => ({ ...prev, stage: "completed" }))

      // Redirect to results page
      router.push(`/results/${session._id}`)
    } catch (error) {
      console.error("Error completing interview:", error)
      toast.error("Error", {
        description: "Failed to complete the interview. Please try again.",
      })
    }
  }

  // Initialize camera when component mounts
  useEffect(() => {
    if (isCameraOn) {
      initCamera()
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [isCameraOn])

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // We don't need audio from camera since we handle it separately
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast.error("Camera Error", {
        description: "Could not access your camera. Please check your permissions.",
      })
      setIsCameraOn(false) // Turn off camera if there's an error
    }
  }

  // Initialize speech synthesis when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = (window as any).speechSynthesis.getVoices()
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (voice: SpeechVoice) => voice.lang.includes("en") && voice.name.includes("Female"),
        )
        if (preferredVoice) {
          console.log("Using voice:", preferredVoice.name)
        }
      }
    }

    // Load voices immediately if available
    loadVoices()

    // Also listen for voices to be loaded
    ;(window as any).speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      ;(window as any).speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Initialize ElevenLabs client
  useEffect(() => {
    const initElevenLabs = async () => {
      if (process.env.ELEVENLABS_API_KEY) {
        elevenlabsRef.current = new ElevenLabsClient({
          apiKey: process.env.ELEVENLABS_API_KEY,
        })
      }
    }
    initElevenLabs()
  }, [])

  // Add this useEffect for audio element initialization
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e)
        setAudioError(true)
        setIsSpeaking(false)
        toast.error("Audio Error", {
          description: "Failed to play audio. Please check your audio settings.",
        })
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  const speak = async (text: string): Promise<void> => {
    try {
      if (!text) return

      setIsSpeaking(true)
      setAudioError(false)

      const response = await fetch("/api/elevenlabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        // Stop any currently playing audio
        audioRef.current.pause()
        audioRef.current.currentTime = 0

        // Set up new audio
        audioRef.current.src = audioUrl
        
        // Create a promise that resolves when the audio finishes playing
        const playPromise = new Promise<void>((resolve) => {
          audioRef.current!.onended = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
        })

        // Play the audio
        try {
          await audioRef.current.play()
          // Wait for the audio to finish playing
          await playPromise
        } catch (playError) {
          console.error("Error playing audio:", playError)
          setAudioError(true)
          setIsSpeaking(false)
          toast.error("Playback Error", {
            description: "Failed to play audio. Please check your audio settings.",
          })
        }
      }
    } catch (error) {
      console.error("Error speaking:", error)
      setIsSpeaking(false)
      toast.error("Error", {
        description: "Failed to generate speech. Please try again.",
      })
    }
  }

  // Start the interview when component mounts
  useEffect(() => {
    setCurrentSession(resolvedParams.id)
    const session = getCurrentSession()

    if (!session) {
      router.push("/dashboard")
      return
    }

    // Update session status to in-progress
    if (session.status === "not-started") {
      updateSession({ ...session, status: "in-progress" })
    }

    // Start the interview
    startInterview()

    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
    }
  }, [resolvedParams.id, setCurrentSession, getCurrentSession, router, updateSession])

  const startInterview = async () => {
    try {
      const session = getCurrentSession()
      if (!session) return

      setInterviewState((prev) => ({ ...prev, stage: "questions" }))

      // Initial greeting with introduction request
      const greeting = `Hello! I'm your AI interviewer today. I'll be asking you questions about ${session.jobTitle}. Before we begin, could you please introduce yourself?`

      setInterviewer((prev) => ({
        ...prev,
        speaking: true,
        message: greeting,
        currentQuestion: "Could you please introduce yourself?",
      }))

      // Add the first question
      addQuestion(session._id, "Could you please introduce yourself?")

      await speak(greeting)
    } catch (error) {
      console.error("Error starting interview:", error)
      toast.error("Error", {
        description: "Failed to start the interview. Please try again.",
      })
    }
  }

  const startRecording = async () => {
    try {
      audioChunksRef.current = []

      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(audioStream)

      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        setAudioBlob(audioBlob)
        setIsProcessing(true)

        // Stop all tracks
        audioStream.getTracks().forEach((track) => track.stop())

        // Process the audio
        processAudio(audioBlob)
      }

      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)

      // Start timer
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      setRecordingInterval(interval)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Microphone Error", {
        description: "Could not access your microphone. Please check your permissions.",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clear timer
      if (recordingInterval) {
        clearInterval(recordingInterval)
        setRecordingInterval(null)
      }

      setRecordingTime(0)
    }
  }

  const processAudio = async (blob: Blob) => {
    try {
      // Get the current session
      const session = getCurrentSession()
      if (!session) return

      // Save the answer
      const currentQuestion = session.questions[interviewState.questionIndex]
      if (currentQuestion) {
        // We'll update this with the transcript from Gemini later
        addAnswer(session._id, currentQuestion.id, "Processing...")
      }

      // Get AI response based on the audio
      await getNextQuestion(blob)

      setIsProcessing(false)
    } catch (error) {
      console.error("Error processing audio:", error)
      setIsProcessing(false)
      toast.error("Error", {
        description: "Failed to process your response. Please try again.",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const session = getCurrentSession()

  return (
    <div className="h-screen w-screen lg:pl-60 fixed inset-0 bg-gradient-to-b from-background to-background/95">
      {/* Add this hidden audio element */}
      <audio ref={audioRef} className="hidden" />

      <div className="flex flex-col h-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Video Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-0 max-h-full">
            {/* User Video */}
            <div className="relative rounded-xl overflow-hidden bg-black/90 shadow-lg h-full max-h-full">
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <span className="text-3xl md:text-4xl font-medium text-primary">
                      {userProfile?.name ? getInitials(userProfile.name) : "U"}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-white font-medium text-sm md:text-base">{userProfile?.name || "You"}</p>
                </div>
              </div>
            </div>

            {/* AI Interviewer */}
            <div className="relative rounded-xl overflow-hidden bg-black/90 shadow-lg h-full max-h-full">
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <span className="text-3xl md:text-4xl font-medium text-primary">{interviewer.initials}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  {isSpeaking && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                  <p className="text-white font-medium text-sm md:text-base">{interviewer.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-card/80 backdrop-blur-sm hidden md:flex md:flex-col min-h-0">
            <div className="p-4 border-b shrink-0">
              <h3 className="font-medium text-lg">Interview Progress</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="space-y-4">
                {interviewer.message && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="text-primary font-medium text-xs">{interviewer.initials}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{interviewer.name}</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{interviewer.message}</p>
                    </div>
                  </div>
                )}
                {interviewer.currentQuestion && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Current Question:
                    </h4>
                    <p className="text-sm text-primary-foreground/80 font-medium">{interviewer.currentQuestion}</p>
                  </div>
                )}
                {transcript && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-muted-foreground/20">
                      <span className="text-muted-foreground font-medium text-xs">
                        {userProfile?.name ? getInitials(userProfile.name) : "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">{transcript}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-auto md:h-20 border-t bg-card/90 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between p-4 gap-4 md:gap-0 shrink-0">
          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <Button
                variant={isMicOn ? "default" : "outline"}
                size="icon"
                className="h-10 w-10 rounded-full shadow-md transition-all duration-200 hover:scale-105"
                onClick={() => {
                  setIsMicOn(!isMicOn)
                  if (!isMicOn) {
                    startRecording()
                  } else {
                    stopRecording()
                  }
                }}
                disabled={isProcessing}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isCameraOn ? "default" : "outline"}
                size="icon"
                className="h-10 w-10 rounded-full shadow-md transition-all duration-200 hover:scale-105"
                onClick={() => setIsCameraOn(!isCameraOn)}
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
                <span className="text-xs font-medium text-destructive">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Question {interviewState.questionIndex + 1} of {interviewState.totalQuestions}
              </span>
              <Progress
                value={(interviewState.questionIndex / interviewState.totalQuestions) * 100}
                className="w-32 h-1.5 md:h-1"
              />
            </div>
            <Button
              variant="destructive"
              className="shadow-md transition-all duration-200 hover:scale-105"
              onClick={() => router.push("/dashboard")}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Mic Hint */}
      {showMicHint && !isRecording && !isProcessing && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg max-w-md animate-bounce">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            <p className="text-sm font-medium">
              Click the microphone button to start speaking, then click it again to send your response.
            </p>
          </div>
        </div>
      )}

      {/* Job Details Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="fixed top-4 right-4 z-50 rounded-full shadow-md transition-all duration-200 hover:scale-105"
          >
            <Info className="h-4 w-4 mr-2" />
            Job Details
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[90%] max-w-md sm:w-[540px] border-l-primary/10 overflow-hidden flex flex-col"
        >
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-xl">Job Details</SheetTitle>
            <SheetDescription>Information about the position you're interviewing for</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 p-5 flex-1 overflow-y-auto scrollbar-hide">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
              <h3 className="font-semibold text-lg">{session?.jobTitle}</h3>
              {session?.companyName && <p className="text-muted-foreground">{session.companyName}</p>}
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Job Description
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg border border-muted/50">
                <p className="text-sm whitespace-pre-line text-muted-foreground">{session?.jobDescription}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <style jsx global>{`
        /* Hide scrollbars but keep functionality */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  )
}

