import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { InterviewSession } from "./models/session";
import type { UserProfile } from "./models/user";

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  url: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface Config {
  geminiApiKey: string;
  mongodbUri: string;
  elevenLabsApiKey: string;
}

interface Store {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useStore = create<Store>((set) => ({
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
}));

interface InterviewStore {
  sessions: InterviewSession[];
  currentSession: InterviewSession | null;
  userProfile: UserProfile | null;
  userId: string;
  isLoading: boolean;
  error: string | null;
  config: Config | null;
  isConfigReady: boolean;
  isAppReady: boolean;

  // Initialization
  init: () => Promise<void>;

  // Session methods
  fetchSessions: () => Promise<void>;
  createSession: (
    jobTitle: string,
    jobDescription: string,
    companyName: string
  ) => Promise<string>;
  updateSession: (
    session: Partial<InterviewSession> & { id: string }
  ) => Promise<void>;
  addQuestion: (sessionId: string, question: string) => Promise<string>;
  addAnswer: (
    sessionId: string,
    questionId: string,
    answer: string
  ) => Promise<void>;
  setScore: (
    sessionId: string,
    score: number,
    feedback: string
  ) => Promise<void>;
  getCurrentSession: () => InterviewSession | null;
  setCurrentSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Profile methods
  fetchUserProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  getUserProfile: () => UserProfile | null;
  addSkill: (skill: string) => Promise<void>;
  removeSkill: (skill: string) => Promise<void>;
  addExperience: (
    experience: Omit<UserProfile["experience"][0], "id">
  ) => Promise<void>;
  updateExperience: (experience: UserProfile["experience"][0]) => Promise<void>;
  removeExperience: (id: string) => Promise<void>;
  addEducation: (
    education: Omit<UserProfile["education"][0], "id">
  ) => Promise<void>;
  updateEducation: (education: UserProfile["education"][0]) => Promise<void>;
  removeEducation: (id: string) => Promise<void>;
  addProject: (
    project: Omit<UserProfile["projects"][0], "id">
  ) => Promise<void>;
  updateProject: (project: UserProfile["projects"][0]) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  addCertification: (
    certification: Omit<UserProfile["certifications"][0], "id">
  ) => Promise<void>;
  updateCertification: (
    certification: UserProfile["certifications"][0]
  ) => Promise<void>;
  removeCertification: (id: string) => Promise<void>;
  setResumeUrl: (url: string) => Promise<void>;

  // Configuration methods
  updateConfig: (config: Config) => void;
  checkConfig: () => boolean;
  isReady: () => boolean;
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      userProfile: null,
      userId: "",
      isLoading: false,
      error: null,
      config: null,
      isConfigReady: false,
      isAppReady: false,

      // Configuration methods
      updateConfig: (config) => {
        set({ config, isConfigReady: true });
        // After config is updated, try to fetch data
        if (get().isReady()) {
          get().fetchSessions();
          get().fetchUserProfile();
        }
      },

      checkConfig: () => {
        const { config } = get();
        return !!(config?.geminiApiKey && config?.mongodbUri && config?.elevenLabsApiKey);
      },

      isReady: () => {
        const { userId, checkConfig } = get();
        return !!userId && checkConfig();
      },

      // Initialize user ID if not already set
      init: async () => {
        const { userId, isReady } = get();
        if (!userId) {
          const newUserId = uuidv4();
          set({ userId: newUserId });
        }

        // Only proceed with API calls if everything is ready
        if (isReady()) {
          set({ isAppReady: true });
          await get().fetchSessions();
          await get().fetchUserProfile();
        }
      },

      // Session methods
      fetchSessions: async () => {
        try {
          if (!get().isReady()) {
            return;
          }

          set({ isLoading: true, error: null });
          const { userId } = get();
          const response = await fetch(`/api/sessions?userId=${userId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch sessions");
          }
          const sessions = await response.json();
          set({ sessions, isLoading: false });
        } catch (error) {
          console.error("Error fetching sessions:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch sessions",
            isLoading: false,
          });
        }
      },

      createSession: async (jobTitle, jobDescription, companyName) => {
        try {
          if (!get().isReady()) {
            throw new Error("Please configure your API settings first");
          }

          set({ isLoading: true, error: null });
          const { userId } = get();
          const id = uuidv4();
          const newSession: Omit<InterviewSession, "_id"> = {
            id,
            userId,
            jobTitle,
            jobDescription,
            companyName,
            questions: [],
            status: "not-started",
            createdAt: new Date(),
          };

          const response = await fetch("/api/sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newSession),
          });

          if (!response.ok) {
            throw new Error("Failed to create session");
          }

          const session = await response.json();
          await get().fetchSessions();
          set({ currentSession: session, isLoading: false });

          return id;
        } catch (error) {
          console.error("Error creating session:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to create session",
            isLoading: false,
          });
          throw error;
        }
      },

      updateSession: async (updatedSession) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch("/api/sessions", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedSession),
          });

          if (!response.ok) {
            throw new Error("Failed to update session");
          }

          await get().fetchSessions();
          const { currentSession } = get();
          if (currentSession?.id === updatedSession.id) {
            const updated = await response.json();
            set({ currentSession: updated });
          }

          set({ isLoading: false });
        } catch (error) {
          console.error("Error updating session:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update session",
            isLoading: false,
          });
        }
      },

      addQuestion: async (sessionId, question) => {
        try {
          set({ isLoading: true, error: null });
          const questionId = Date.now().toString();
          const response = await fetch("/api/sessions", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: sessionId,
              questions: [{ id: questionId, question }],
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add question");
          }

          // Update local state
          const session = await response.json();
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? session : s
            ),
            currentSession:
              state.currentSession?.id === sessionId
                ? session
                : state.currentSession,
          }));

          set({ isLoading: false });
          return questionId;
        } catch (error) {
          console.error("Error adding question:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to add question",
            isLoading: false,
          });
          throw error;
        }
      },

      addAnswer: async (sessionId, questionId, answer) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch("/api/sessions", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: sessionId,
              questions: [{ id: questionId, answer }],
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add answer");
          }

          // Update local state
          const session = await response.json();
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? session : s
            ),
            currentSession:
              state.currentSession?.id === sessionId
                ? session
                : state.currentSession,
          }));

          set({ isLoading: false });
        } catch (error) {
          console.error("Error adding answer:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to add answer",
            isLoading: false,
          });
        }
      },

      setScore: async (sessionId, score, feedback) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch("/api/sessions", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: sessionId,
              score,
              feedback,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to set score");
          }

          // Update local state
          const session = await response.json();
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? session : s
            ),
            currentSession:
              state.currentSession?.id === sessionId
                ? session
                : state.currentSession,
          }));

          set({ isLoading: false });
        } catch (error) {
          console.error("Error setting score:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to set score",
            isLoading: false,
          });
        }
      },

      getCurrentSession: () => {
        return get().currentSession;
      },

      setCurrentSession: async (sessionId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/sessions?userId=${get().userId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch sessions");
          }
          const sessions = await response.json();
          const session = sessions.find((s: InterviewSession) => s.id === sessionId);
          set({ currentSession: session, isLoading: false });
        } catch (error) {
          console.error("Error setting current session:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to set current session",
            isLoading: false,
          });
        }
      },

      completeSession: async (sessionId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch("/api/sessions", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: sessionId,
              status: "completed",
              completedAt: new Date(),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to complete session");
          }

          // Update local state
          const session = await response.json();
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? session : s
            ),
            currentSession:
              state.currentSession?.id === sessionId
                ? session
                : state.currentSession,
          }));

          set({ isLoading: false });
        } catch (error) {
          console.error("Error completing session:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to complete session",
            isLoading: false,
          });
        }
      },

      deleteSession: async (sessionId: string) => {
        try {
          if (!get().isReady()) {
            throw new Error("Please configure your API settings first");
          }

          set({ isLoading: true, error: null });
          const { userId } = get();
          
          const response = await fetch(`/api/sessions/${sessionId}?userId=${userId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete session");
          }

          await get().fetchSessions();
          set({ isLoading: false });
        } catch (error) {
          console.error("Error deleting session:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to delete session",
            isLoading: false,
          });
          throw error;
        }
      },

      // Profile methods
      fetchUserProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          const { userId } = get();
          if (!userId) return;

          const response = await fetch(`/api/users?id=${userId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch user profile");
          }
          const profile = await response.json();
          set({ userProfile: profile, isLoading: false });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch user profile",
            isLoading: false,
          });
        }
      },

      setUserProfile: async (profile) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profile),
          });

          if (!response.ok) {
            throw new Error("Failed to create user profile");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error setting user profile:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to set user profile",
            isLoading: false,
          });
        }
      },

      updateUserProfile: async (profile) => {
        try {
          set({ isLoading: true, error: null });
          const { userId } = get();
          if (!userId) {
            throw new Error("User ID not found");
          }

          // Remove _id from the update data if it exists
          const { _id, ...updateData } = profile;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              ...updateData,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update user profile");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error updating user profile:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to update user profile",
            isLoading: false,
          });
          throw error;
        }
      },

      getUserProfile: () => {
        return get().userProfile;
      },

      addSkill: async (skill) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              skills: [...userProfile.skills, skill],
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add skill");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error adding skill:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to add skill",
            isLoading: false,
          });
        }
      },

      removeSkill: async (skill) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              skills: userProfile.skills.filter((s) => s !== skill),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to remove skill");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error removing skill:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to remove skill",
            isLoading: false,
          });
        }
      },

      addExperience: async (experience) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              experience: [...userProfile.experience, { id: Date.now().toString(), ...experience }],
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add experience");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error adding experience:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to add experience",
            isLoading: false,
          });
        }
      },

      updateExperience: async (experience) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              experience: userProfile.experience.map((e) =>
                e.id === experience.id ? experience : e
              ),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update experience");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error updating experience:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to update experience",
            isLoading: false,
          });
        }
      },

      removeExperience: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              experience: userProfile.experience.filter((e) => e.id !== id),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to remove experience");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error removing experience:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to remove experience",
            isLoading: false,
          });
        }
      },

      addEducation: async (education) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              education: [...userProfile.education, { id: Date.now().toString(), ...education }],
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add education");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error adding education:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to add education",
            isLoading: false,
          });
        }
      },

      updateEducation: async (education) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              education: userProfile.education.map((e) =>
                e.id === education.id ? education : e
              ),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update education");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error updating education:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to update education",
            isLoading: false,
          });
        }
      },

      removeEducation: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              education: userProfile.education.filter((e) => e.id !== id),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to remove education");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error removing education:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to remove education",
            isLoading: false,
          });
        }
      },

      addProject: async (project) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              projects: [...userProfile.projects, { id: Date.now().toString(), ...project }],
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add project");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error adding project:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to add project",
            isLoading: false,
          });
        }
      },

      updateProject: async (project) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              projects: userProfile.projects.map((p) =>
                p.id === project.id ? project : p
              ),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update project");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error updating project:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to update project",
            isLoading: false,
          });
        }
      },

      removeProject: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              projects: userProfile.projects.filter((p) => p.id !== id),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to remove project");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error removing project:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to remove project",
            isLoading: false,
          });
        }
      },

      addCertification: async (certification) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              certifications: [...userProfile.certifications, { id: Date.now().toString(), ...certification }],
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to add certification");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error adding certification:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to add certification",
            isLoading: false,
          });
        }
      },

      updateCertification: async (certification) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              certifications: userProfile.certifications.map((c) =>
                c.id === certification.id ? certification : c
              ),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update certification");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error updating certification:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to update certification",
            isLoading: false,
          });
        }
      },

      removeCertification: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              certifications: userProfile.certifications.filter((c) => c.id !== id),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to remove certification");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error removing certification:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to remove certification",
            isLoading: false,
          });
        }
      },

      setResumeUrl: async (url) => {
        try {
          set({ isLoading: true, error: null });
          const { userProfile, userId } = get();
          if (!userProfile || !userId) return;

          const response = await fetch("/api/users", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              resumeUrl: url,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update resume URL");
          }

          const result = await response.json();
          set({ userProfile: result, isLoading: false });
        } catch (error) {
          console.error("Error updating resume URL:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to update resume URL",
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "interview-store",
    }
  )
);
