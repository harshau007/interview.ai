import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  UserProfile,
  InterviewSession,
  Experience,
  Education,
  Project,
  Certification,
} from "./types";
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  addQuestion,
  addAnswer,
  setScore,
  completeSession,
  deleteSession,
} from "./models/session";

interface StoreState {
  userId: string;
  userProfile: UserProfile | null;
  sessions: InterviewSession[];
  currentSession: InterviewSession | null;
  isLoading: boolean;
  error: string | null;

  // Initialization
  init: () => Promise<void>;

  // User methods
  setUserId: (id: string) => void;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;

  // Session methods
  fetchSessions: () => Promise<void>;
  createSession: (jobTitle: string, jobDescription: string, companyName: string) => Promise<string>;
  updateSession: (session: InterviewSession) => Promise<void>;
  addQuestion: (sessionId: string, question: string) => Promise<string>;
  addAnswer: (sessionId: string, questionId: string, answer: string) => Promise<void>;
  setScore: (sessionId: string, score: number, feedback: string) => Promise<void>;
  getCurrentSession: () => InterviewSession | null;
  setCurrentSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      userId: "",
      userProfile: null,
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,

      // Initialization
      init: async () => {
        try {
          set({ isLoading: true, error: null });
          const { userId } = get();

          if (!userId) {
            const newUserId = uuidv4();
            set({ userId: newUserId });
          }

          const defaultUser: UserProfile = {
            _id: get().userId,
            name: "",
            email: "",
            skills: [],
            experience: [],
            education: [],
            projects: [],
            certifications: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set({ userProfile: defaultUser, isLoading: false });
        } catch (error) {
          console.error("Error initializing store:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to initialize store",
            isLoading: false,
          });
        }
      },

      // User methods
      setUserId: (id: string) => {
        set({ userId: id });
      },

      fetchUserProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          const { userId } = get();
          if (!userId) return;

          const profile = await fetch(`/api/users/${userId}`).then((res) =>
            res.json()
          );
          set({ userProfile: profile, isLoading: false });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to fetch user profile",
            isLoading: false,
          });
        }
      },

      updateUserProfile: async (profile: Partial<UserProfile>) => {
        try {
          set({ isLoading: true, error: null });
          const { userId } = get();
          if (!userId) return;

          const updatedProfile = await fetch(`/api/users/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile),
          }).then((res) => res.json());

          set({ userProfile: updatedProfile, isLoading: false });
        } catch (error) {
          console.error("Error updating user profile:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to update user profile",
            isLoading: false,
          });
        }
      },

      // Session methods
      fetchSessions: async () => {
        try {
          set({ isLoading: true, error: null });
          const { userId } = get();
          if (!userId) return;

          const sessions = await getAllSessions(userId);
          set({ sessions, isLoading: false });
        } catch (error) {
          console.error("Error fetching sessions:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to fetch sessions",
            isLoading: false,
          });
        }
      },

      createSession: async (jobTitle: string, jobDescription: string, companyName: string) => {
        try {
          set({ isLoading: true, error: null });
          const { userId } = get();
          if (!userId) throw new Error("User not initialized");

          const session = await createSession({
            userId,
            jobTitle,
            jobDescription,
            companyName,
            status: "not-started",
            questions: [],
            createdAt: new Date(),
          });

          set((state) => ({
            sessions: [...state.sessions, session],
            isLoading: false,
          }));

          return session._id;
        } catch (error) {
          console.error("Error creating session:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to create session",
            isLoading: false,
          });
          throw error;
        }
      },

      updateSession: async (session: InterviewSession) => {
        try {
          set({ isLoading: true, error: null });
          const { _id, ...update } = session;
          await updateSession(_id, update);
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s._id === session._id ? session : s
            ),
            currentSession:
              state.currentSession?._id === session._id ? session : state.currentSession,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error updating session:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to update session",
            isLoading: false,
          });
        }
      },

      addQuestion: async (sessionId: string, question: string) => {
        try {
          set({ isLoading: true, error: null });
          const questionId = await addQuestion(sessionId, question);
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s._id === sessionId
                ? {
                    ...s,
                    questions: [
                      ...s.questions,
                      { id: questionId, question, answer: null },
                    ],
                  }
                : s
            ),
            currentSession:
              state.currentSession?._id === sessionId
                ? {
                    ...state.currentSession,
                    questions: [
                      ...state.currentSession.questions,
                      { id: questionId, question, answer: null },
                    ],
                  }
                : state.currentSession,
            isLoading: false,
          }));
          return questionId;
        } catch (error) {
          console.error("Error adding question:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to add question",
            isLoading: false,
          });
          throw error;
        }
      },

      addAnswer: async (sessionId: string, questionId: string, answer: string) => {
        try {
          set({ isLoading: true, error: null });
          await addAnswer(sessionId, questionId, answer);
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s._id === sessionId
                ? {
                    ...s,
                    questions: s.questions.map((q) =>
                      q.id === questionId ? { ...q, answer } : q
                    ),
                  }
                : s
            ),
            currentSession:
              state.currentSession?._id === sessionId
                ? {
                    ...state.currentSession,
                    questions: state.currentSession.questions.map((q) =>
                      q.id === questionId ? { ...q, answer } : q
                    ),
                  }
                : state.currentSession,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error adding answer:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to add answer",
            isLoading: false,
          });
        }
      },

      setScore: async (sessionId: string, score: number, feedback: string) => {
        try {
          set({ isLoading: true, error: null });
          await setScore(sessionId, score, feedback);
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s._id === sessionId
                ? {
                    ...s,
                    score,
                    feedback,
                  }
                : s
            ),
            currentSession:
              state.currentSession?._id === sessionId
                ? {
                    ...state.currentSession,
                    score,
                    feedback,
                  }
                : state.currentSession,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error setting score:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to set score",
            isLoading: false,
          });
        }
      },

      getCurrentSession: () => {
        return get().currentSession;
      },

      setCurrentSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });
          const session = await getSessionById(sessionId);
          if (!session) throw new Error("Session not found");
          set({ currentSession: session, isLoading: false });
        } catch (error) {
          console.error("Error setting current session:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to set current session",
            isLoading: false,
          });
        }
      },

      completeSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });
          await completeSession(sessionId);
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s._id === sessionId
                ? {
                    ...s,
                    status: "completed",
                    completedAt: new Date(),
                  }
                : s
            ),
            currentSession:
              state.currentSession?._id === sessionId
                ? {
                    ...state.currentSession,
                    status: "completed",
                    completedAt: new Date(),
                  }
                : state.currentSession,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error completing session:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to complete session",
            isLoading: false,
          });
        }
      },

      deleteSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });
          await deleteSession(sessionId);
          set((state) => ({
            sessions: state.sessions.filter((s) => s._id !== sessionId),
            currentSession:
              state.currentSession?._id === sessionId
                ? null
                : state.currentSession,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error deleting session:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to delete session",
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
