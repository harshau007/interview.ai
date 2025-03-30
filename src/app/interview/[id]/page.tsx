"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useInterviewStore } from "@/lib/store";
import { Mic, Video, MicOff, VideoOff, Send, X } from "lucide-react";

export default function InterviewPage() {
  const params = useParams();
  const { currentSession, setCurrentSession, addQuestion, addAnswer } = useInterviewStore();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (params.id) {
      setCurrentSession(params.id as string);
    }
  }, [params.id, setCurrentSession]);

  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error("Error accessing camera:", error);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await addAnswer(currentSession?.id || "", Date.now().toString(), message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* User Video */}
        <div className="relative bg-muted rounded-lg overflow-hidden">
          {isCameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
              {getInitials("User")}
            </div>
          )}
        </div>

        {/* AI Video */}
        <div className="relative bg-muted rounded-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
            AI
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {currentSession?.questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Question:</p>
                <p>{q.question}</p>
              </div>
              {q.answer && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm font-medium">Your Answer:</p>
                  <p>{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={isMicOn ? "default" : "outline"}
              size="icon"
              onClick={() => setIsMicOn(!isMicOn)}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={isCameraOn ? "default" : "outline"}
              size="icon"
              onClick={() => setIsCameraOn(!isCameraOn)}
            >
              {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-md border"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
