"use client";

import { Button } from "@/components/ui/button";
import { NewSessionDialog } from "@/components/new-session-dialog";
import { useStore } from "@/lib/store";
import type { InterviewSession } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const {
    sessions,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    deleteSession,
    setCurrentSession,
  } = useStore();

  const [activeTab, setActiveTab] = useState("all");

  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSessionClick = (session: InterviewSession) => {
    setCurrentSession(session._id);
    router.push(`/interview/${session._id}`);
  };

  const handleSessionDelete = async (session: InterviewSession) => {
    try {
      await deleteSession(session._id);
      toast.success("Session deleted successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const filteredSessions = sessions.filter((session: InterviewSession) => {
    if (activeTab === "all") return true;
    return session.status === activeTab;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <NewSessionDialog />
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => setActiveTab("all")}
        >
          All Sessions
        </Button>
        <Button
          variant={activeTab === "not-started" ? "default" : "outline"}
          onClick={() => setActiveTab("not-started")}
        >
          Not Started
        </Button>
        <Button
          variant={activeTab === "in-progress" ? "default" : "outline"}
          onClick={() => setActiveTab("in-progress")}
        >
          In Progress
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "outline"}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredSessions.length === 0 ? (
        <div>No sessions found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session: InterviewSession) => (
            <div
              key={session._id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold">{session.jobTitle}</h3>
              <p className="text-sm text-gray-600">{session.companyName}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSessionClick(session)}
                >
                  View
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleSessionDelete(session)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 