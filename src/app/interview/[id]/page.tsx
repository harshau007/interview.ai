"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getClientConfig } from "@/lib/client-config";
import { useInterviewStore } from "@/lib/store";
import { ElevenLabsClient } from "elevenlabs";
import { Info, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type InterviewerState = {
  name: string;
  initials: string;
  speaking: boolean;
  message: string;
  currentQuestion: string;
};

interface SpeechVoice {
  name: string;
  lang: string;
}

const getInitials = (name: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const {
    setCurrentSession,
    getCurrentSession,
    addQuestion,
    addAnswer,
    updateSession,
    completeSession,
    setScore,
    getUserProfile,
  } = useInterviewStore();
  const { theme } = useTheme();
  const [interviewer, setInterviewer] = useState<InterviewerState>({
    name: "AI Interviewer",
    initials: "AI",
    speaking: false,
    message: "",
    currentQuestion: "",
  });

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] =
    useState<NodeJS.Timeout | null>(null);

  const [interviewState, setInterviewState] = useState<{
    stage: "intro" | "questions" | "outro" | "completed";
    questionIndex: number;
    totalQuestions: number;
  }>({
    stage: "intro",
    questionIndex: 0,
    totalQuestions: 10,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resolvedParams = use(params);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const elevenlabsRef = useRef<ElevenLabsClient | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);

  const [audioError, setAudioError] = useState(false);

  const getNextQuestion = async (audioBlob: Blob) => {
    const session = getCurrentSession();
    const userProfile = getUserProfile();
    if (!session) return;

    try {
      // Prepare previous questions and answers for context
      const previousQuestions = session.questions.map((q) => ({
        question: q.question,
        answer: q.answer || "",
      }));

      // Create form data for the audio
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("jobDescription", session.jobDescription);
      formData.append("previousQuestions", JSON.stringify(previousQuestions));
      if (userProfile) {
        formData.append("userProfile", JSON.stringify(userProfile));
      }

      // Call the Gemini API directly with audio
      const response = await fetch("/api/gemini", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to get next question");
      }

      const data = await response.json();

      // Save the transcript from Gemini's understanding
      setTranscript(data.transcript || "");

      // Update interviewer state with the response
      setInterviewer((prev) => ({
        ...prev,
        speaking: true,
        message: data.response,
        currentQuestion: data.nextQuestion,
      }));

      // Speak the response first and wait for it to complete
      await speak(data.response);

      // Add a delay between response and question
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Only speak the next question if we're not at the end
      const nextQuestionIndex = interviewState.questionIndex + 1;
      if (nextQuestionIndex < interviewState.totalQuestions) {
        // Update interviewer state to show the next question
        setInterviewer((prev) => ({
          ...prev,
          speaking: true,
          currentQuestion: data.nextQuestion,
        }));

        // Speak the next question
        await speak(data.nextQuestion);
      }

      // Check if we should move to the next stage
      if (nextQuestionIndex >= interviewState.totalQuestions) {
        // Move to outro
        setInterviewState((prev) => ({ ...prev, stage: "outro" }));

        // Final message
        setInterviewer((prev) => ({
          ...prev,
          speaking: true,
          message:
            "Thank you for participating in this interview. You've answered all my questions. I'll now provide you with feedback on your performance.",
          currentQuestion: "",
        }));

        // Complete the interview and get the score
        await completeInterviewAndScore();
      } else {
        // Add the next question
        addQuestion(session.id, data.nextQuestion);

        // Move to the next question
        setInterviewState((prev) => ({
          ...prev,
          questionIndex: nextQuestionIndex,
        }));
      }
    } catch (error) {
      console.error("Error getting next question:", error);
      toast.error("Error", {
        description: "Failed to process your response. Please try again.",
      });
    }
  };

  const completeInterviewAndScore = async () => {
    const session = getCurrentSession();
    const userProfile = getUserProfile();
    if (!session) return;

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
      });

      if (!response.ok) {
        throw new Error("Failed to get score");
      }

      const data = await response.json();

      // Update the session with the score and feedback
      setScore(session.id, data.score, data.feedback);

      // Complete the session
      completeSession(session.id);

      // Move to completed stage
      setInterviewState((prev) => ({ ...prev, stage: "completed" }));

      // Redirect to results page
      router.push(`/results/${session.id}`);
    } catch (error) {
      console.error("Error completing interview:", error);
      toast.error("Error", {
        description: "Failed to complete the interview. Please try again.",
      });
    }
  };

  // Initialize camera when component mounts
  useEffect(() => {
    if (isCameraOn) {
      initCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraOn]);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // We don't need audio from camera since we handle it separately
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Camera Error", {
        description:
          "Could not access your camera. Please check your permissions.",
      });
      setIsCameraOn(false); // Turn off camera if there's an error
    }
  };

  // Initialize speech synthesis when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = (window as any).speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (voice: SpeechVoice) =>
            voice.lang.includes("en") && voice.name.includes("Female")
        );
        if (preferredVoice) {
          console.log("Using voice:", preferredVoice.name);
        }
      }
    };

    // Load voices immediately if available
    loadVoices();

    // Also listen for voices to be loaded
    (window as any).speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      (window as any).speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Initialize ElevenLabs client
  useEffect(() => {
    const initElevenLabs = async () => {
      const config = getClientConfig();
      if (config?.elevenLabsApiKey) {
        elevenlabsRef.current = new ElevenLabsClient({
          apiKey: process.env.ELEVENLABS_API_KEY,
        });
      }
    };
    initElevenLabs();
  }, []);

  // Add this useEffect for audio element initialization
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e);
        setAudioError(true);
        setIsSpeaking(false);
        toast.error("Audio Error", {
          description: "Failed to play audio. Please check your audio settings.",
        });
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const speak = async (text: string): Promise<void> => {
    try {
      if (!text) return;

      setIsSpeaking(true);
      setAudioError(false);
      
      const response = await fetch("/api/elevenlabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        // Stop any currently playing audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // Set up new audio
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };

        // Play the audio
        try {
          await audioRef.current.play();
        } catch (playError) {
          console.error("Error playing audio:", playError);
          setAudioError(true);
          setIsSpeaking(false);
          toast.error("Playback Error", {
            description: "Failed to play audio. Please check your audio settings.",
          });
        }
      }
    } catch (error) {
      console.error("Error speaking:", error);
      setIsSpeaking(false);
      toast.error("Error", {
        description: "Failed to generate speech. Please try again.",
      });
    }
  };

  // Start the interview when component mounts
  useEffect(() => {
    setCurrentSession(resolvedParams.id);
    const session = getCurrentSession();

    if (!session) {
      router.push("/dashboard");
      return;
    }

    // Update session status to in-progress
    if (session.status === "not-started") {
      updateSession({ id: session.id, status: "in-progress" });
    }

    // Start the interview
    startInterview();

    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [
    resolvedParams.id,
    setCurrentSession,
    getCurrentSession,
    router,
    updateSession,
  ]);

  const startInterview = async () => {
    try {
      const session = getCurrentSession();
      if (!session) return;

      setInterviewState((prev) => ({ ...prev, stage: "questions" }));

      // Initial greeting with introduction request
      const greeting = `Hello! I'm your AI interviewer today. I'll be asking you questions about ${session.jobTitle}. Before we begin, could you please introduce yourself?`;
      
      setInterviewer((prev) => ({
        ...prev,
        speaking: true,
        message: greeting,
        currentQuestion: "Could you please introduce yourself?",
      }));

      // Add the first question
      addQuestion(session.id, "Could you please introduce yourself?");

      await speak(greeting);
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Error", {
        description: "Failed to start the interview. Please try again.",
      });
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];

      // Get audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(audioStream);

      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        setIsProcessing(true);

        // Stop all tracks
        audioStream.getTracks().forEach((track) => track.stop());

        // Process the audio
        processAudio(audioBlob);
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setRecordingInterval(interval);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Microphone Error", {
        description:
          "Could not access your microphone. Please check your permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear timer
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }

      setRecordingTime(0);
    }
  };

  const processAudio = async (blob: Blob) => {
    try {
      // Get the current session
      const session = getCurrentSession();
      if (!session) return;

      // Save the answer
      const currentQuestion = session.questions[interviewState.questionIndex];
      if (currentQuestion) {
        // We'll update this with the transcript from Gemini later
        addAnswer(session.id, currentQuestion.id, "Processing...");
      }

      // Get AI response based on the audio
      await getNextQuestion(blob);

      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing audio:", error);
      setIsProcessing(false);
      toast.error("Error", {
        description: "Failed to process your response. Please try again.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const session = getCurrentSession();
  const userProfile = getUserProfile();

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Add this hidden audio element */}
      <audio ref={audioRef} className="hidden" />
      
      <div className="flex flex-col h-full">
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 p-4">
            {/* User Video */}
            <div className="relative rounded-lg overflow-hidden bg-black">
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-medium text-primary">
                      {userProfile?.name ? getInitials(userProfile.name) : "U"}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white font-medium">
                  {userProfile?.name || "You"}
                </p>
              </div>
            </div>

            {/* AI Interviewer */}
            <div className="relative rounded-lg overflow-hidden bg-black">
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl font-medium text-primary">
                    {interviewer.initials}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{interviewer.name}</p>
                  {isSpeaking && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-80 border-l bg-card hidden lg:block">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-medium">Interview Progress</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {interviewer.message && (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {interviewer.initials}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {interviewer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {interviewer.message}
                        </p>
                      </div>
                    </div>
                  )}
                  {interviewer.currentQuestion && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-foreground mb-2">
                        Current Question:
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {interviewer.currentQuestion}
                      </p>
                    </div>
                  )}
                  {transcript && (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground font-medium">
                          {userProfile?.name
                            ? getInitials(userProfile.name)
                            : "U"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {transcript}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-20 border-t bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={isMicOn ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  setIsMicOn(!isMicOn);
                  if (!isMicOn) {
                    startRecording();
                  } else {
                    stopRecording();
                  }
                }}
                disabled={isProcessing}
              >
                {isMicOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant={isCameraOn ? "default" : "outline"}
                size="icon"
                onClick={() => setIsCameraOn(!isCameraOn)}
              >
                {isCameraOn ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Question {interviewState.questionIndex + 1} of{" "}
                {interviewState.totalQuestions}
              </span>
              <Progress
                value={
                  (interviewState.questionIndex /
                    interviewState.totalQuestions) *
                  100
                }
                className="w-32 h-1"
              />
            </div>
            <Button
              variant="destructive"
              onClick={() => router.push("/dashboard")}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Job Details Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="fixed top-4 right-4 z-50">
            <Info className="h-4 w-4 mr-2" />
            Job Details
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Job Details</SheetTitle>
            <SheetDescription>
              Information about the position you're interviewing for
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{session?.jobTitle}</h3>
              {session?.companyName && (
                <p className="text-muted-foreground">{session.companyName}</p>
              )}
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Job Description</h4>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {session?.jobDescription}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
