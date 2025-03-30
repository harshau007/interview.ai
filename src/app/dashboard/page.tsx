"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type InterviewSession } from "@/lib/models/session";
import { useInterviewStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  BarChart,
  Building,
  CheckCircle,
  Clock,
  Eye,
  Hourglass,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewSessionDialog } from "@/components/new-session-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const router = useRouter();
  const { sessions, setCurrentSession, fetchSessions, isLoading, config } =
    useInterviewStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getStatusBadge = (status: InterviewSession["status"]) => {
    switch (status) {
      case "not-started":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Hourglass className="h-3 w-3" /> Not Started
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleContinueSession = (sessionId: string) => {
    setCurrentSession(sessionId);
    router.push(`/interview/${sessionId}`);
  };

  const handleViewResults = (sessionId: string) => {
    setCurrentSession(sessionId);
    router.push(`/results/${sessionId}`);
  };

  const filteredSessions = sessions.filter(
    (session) =>
      session.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.jobDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedSessions = filteredSessions.filter(
    (session) => session.status === "completed"
  );
  const inProgressSessions = filteredSessions.filter(
    (session) => session.status === "in-progress"
  );
  const notStartedSessions = filteredSessions.filter(
    (session) => session.status === "not-started"
  );

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <NewSessionDialog />
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6 w-full max-w-md mx-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="not-started">Not Started</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <SessionSkeleton />
            ) : filteredSessions.length === 0 ? (
              <EmptyState
                onCreateNew={() => router.push("/new-session")}
                searchTerm={searchTerm}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onContinue={handleContinueSession}
                    onViewResults={handleViewResults}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {isLoading ? (
              <SessionSkeleton />
            ) : completedSessions.length === 0 ? (
              <EmptyState
                onCreateNew={() => router.push("/new-session")}
                searchTerm={searchTerm}
                type="completed"
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onContinue={handleContinueSession}
                    onViewResults={handleViewResults}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="in-progress">
            {isLoading ? (
              <SessionSkeleton />
            ) : inProgressSessions.length === 0 ? (
              <EmptyState
                onCreateNew={() => router.push("/new-session")}
                searchTerm={searchTerm}
                type="in-progress"
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onContinue={handleContinueSession}
                    onViewResults={handleViewResults}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="not-started">
            {isLoading ? (
              <SessionSkeleton />
            ) : notStartedSessions.length === 0 ? (
              <EmptyState
                onCreateNew={() => router.push("/new-session")}
                searchTerm={searchTerm}
                type="not-started"
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notStartedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onContinue={handleContinueSession}
                    onViewResults={handleViewResults}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

type SessionCardProps = {
  session: InterviewSession;
  onContinue: (id: string) => void;
  onViewResults: (id: string) => void;
  getStatusBadge: (status: InterviewSession["status"]) => React.ReactNode;
  formatDate: (date: Date) => string;
};

function SessionCard({
  session,
  onContinue,
  onViewResults,
  getStatusBadge,
  formatDate,
}: SessionCardProps) {
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1 text-base">
            {session.jobTitle}
          </CardTitle>
          {getStatusBadge(session.status)}
        </div>
        <CardDescription>
          <div className="flex items-center gap-1 text-xs">
            {session.companyName && (
              <>
                <Building className="h-3 w-3" />
                <span>{session.companyName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>{formatDate(session.createdAt)}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow py-2">
        <div className="space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
            {session.jobDescription}
          </p>

          {session.status === "completed" && (
            <div className="mt-4 flex items-center gap-2">
              <BarChart className="h-4 w-4 text-primary" />
              <p className="font-semibold">Score: {session.score}/100</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        {session.status === "completed" ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onViewResults(session.id)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Results
          </Button>
        ) : (
          <Button className="w-full" onClick={() => onContinue(session.id)}>
            {session.status === "not-started" ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Start Interview
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function SessionSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex flex-col h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-2 mt-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardHeader>
          <CardContent className="flex-grow py-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

type EmptyStateProps = {
  onCreateNew: () => void;
  searchTerm: string;
  type?: "completed" | "in-progress" | "not-started";
};

function EmptyState({ onCreateNew, searchTerm, type }: EmptyStateProps) {
  let message = "No interview sessions yet";
  let description = "Create your first interview session to start practicing";
  let icon = <BarChart className="h-12 w-12 text-muted-foreground mb-2" />;

  if (searchTerm) {
    message = "No matching sessions found";
    description = `No sessions match your search for "${searchTerm}"`;
    icon = <Search className="h-12 w-12 text-muted-foreground mb-2" />;
  } else if (type) {
    switch (type) {
      case "completed":
        message = "No completed interviews";
        description = "Complete an interview to see results here";
        icon = <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />;
        break;
      case "in-progress":
        message = "No interviews in progress";
        description = "Start an interview to see it here";
        icon = <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />;
        break;
      case "not-started":
        message = "No pending interviews";
        description = "Create a new interview session to get started";
        icon = <Hourglass className="h-12 w-12 text-muted-foreground mb-2" />;
        break;
    }
  }

  return (
    <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg shadow">
      <div className="flex flex-col items-center">
        {icon}
        <h2 className="text-xl font-semibold mb-2">{message}</h2>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">{description}</p>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Session
        </Button>
      </div>
    </div>
  );
}
