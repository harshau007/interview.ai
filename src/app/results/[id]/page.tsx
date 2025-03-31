"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";
import { ArrowLeft, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { getCurrentSession } = useStore();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = getCurrentSession();
        if (!session) {
          throw new Error("Session not found");
        }
        setSession(session);
      } catch (error) {
        console.error("Error loading session:", error);
        toast.error("Error", {
          description: "Failed to load interview results. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [getCurrentSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Interview Results</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Score Card */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Score</h2>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <Progress
                    value={session.score || 0}
                    className="absolute inset-0 w-full h-full rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{session.score || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Job Title</h3>
                  <p className="text-muted-foreground">{session.jobTitle}</p>
                </div>
                {session.companyName && (
                  <div>
                    <h3 className="font-medium mb-2">Company</h3>
                    <p className="text-muted-foreground">{session.companyName}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium mb-2">Date</h3>
                  <p className="text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Feedback</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">{session.feedback}</p>
              </div>
            </CardContent>
          </Card>

          {/* Questions and Answers */}
          <Card className="md:col-span-2 bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Questions & Answers</h2>
              <div className="space-y-6">
                {session.questions.map((q: any, index: number) => (
                  <div key={q.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <Badge variant="outline" className="text-xs">
                        {q.category || "General"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{q.question}</p>
                    <div className="pl-4 border-l-2 border-primary/20">
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{q.answer}</p>
                      {q.feedback && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium text-primary">Feedback:</p>
                          <p className="text-muted-foreground">{q.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
        </div>
      </div>
    </div>
  );
}
