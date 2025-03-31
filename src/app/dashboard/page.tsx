"use client";

import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  LayoutDashboard,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { NewSessionDialog } from "@/components/new-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import type { InterviewSession, UserProfile } from "@/lib/types";

export default function Dashboard() {
  const {
    sessions,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    deleteSession,
    setCurrentSession,
    init,
    userProfile,
    createSession,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const router = useRouter();

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize store and fetch sessions
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await init();
        await fetchSessions();
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        toast.error("Error", {
          description: "Failed to load your dashboard. Please try again.",
        });
      } finally {
        setIsPageLoading(false);
      }
    };

    if (isClient) {
      initializeDashboard();
    }
  }, [init, fetchSessions, isClient]);

  const handleSessionClick = (session: InterviewSession) => {
    setCurrentSession(session._id);
    router.push(`/interview/${session._id}`);
  };

  const handleSessionDelete = async (session: InterviewSession) => {
    try {
      await deleteSession(session._id);
      toast.success("Success", {
        description: "Interview session deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Error", {
        description:
          "Failed to delete the interview session. Please try again.",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not-started":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not-started":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="mr-1 h-3 w-3" /> Not Started
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <AlertCircle className="mr-1 h-3 w-3" /> In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="mr-1 h-3 w-3" /> Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" /> Unknown
          </Badge>
        );
    }
  };

  const filteredSessions = sessions
    .filter((session: InterviewSession) => {
      if (activeTab === "all") return true;
      return session.status === activeTab;
    })
    .filter((session: InterviewSession) => {
      if (!searchQuery) return true;
      return (
        session.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const handleNewInterview = async () => {
    try {
      // Check if required fields are filled
      const requiredFields: (keyof UserProfile)[] = [
        "name",
        "email",
        "skills",
      ];
      const missingFields = requiredFields.filter((field) => {
        return !userProfile?.[field];
      });

      if (missingFields.length > 0) {
        toast.error("Profile Incomplete", {
          description: `Please complete your profile by adding: ${missingFields.join(
            ", "
          )}`,
          action: {
            label: "Go to Settings",
            onClick: () => router.push("/settings"),
          },
        });
        return;
      }

      // If profile is complete, show the new session dialog
      setShowNewSessionDialog(true);
    } catch (error) {
      console.error("Error checking profile:", error);
      toast.error("Error", {
        description: "Failed to check profile. Please try again.",
      });
    }
  };

  if (!isClient || isPageLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Interview Sessions</h1>
        </div>
        <Button onClick={handleNewInterview}>
          <Plus className="h-4 w-4 mr-2" />
          New Interview
        </Button>
      </div>

      <NewSessionDialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog} />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs
          defaultValue="all"
          className="w-full sm:w-auto"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="not-started">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Not Started</span>
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">In Progress</span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Completed</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No sessions found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery
              ? "Try a different search term"
              : "Create a new session to get started"}
          </p>
          {/* <NewSessionDialog /> */}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session: InterviewSession) => (
            <Card
              key={session._id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-medium line-clamp-1">
                    {session.jobTitle}
                  </CardTitle>
                  {getStatusBadge(session.status)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Building className="h-3.5 w-3.5 mr-1.5" />
                  {session.companyName}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {new Date(
                    session.createdAt || Date.now()
                  ).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => handleSessionClick(session)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => handleSessionDelete(session)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
