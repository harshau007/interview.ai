import type { InterviewSession, Question } from "../types";

// Local storage functions
const STORAGE_KEY = "interview-sessions";

export function getAllSessions(userId: string): InterviewSession[] {
  if (typeof window === "undefined") return [];
  
  const sessions = localStorage.getItem(STORAGE_KEY);
  if (!sessions) return [];
  
  return JSON.parse(sessions).filter((session: InterviewSession) => session.userId === userId);
}

export function getSessionById(id: string): InterviewSession | null {
  if (typeof window === "undefined") return null;
  
  const sessions = localStorage.getItem(STORAGE_KEY);
  if (!sessions) return null;
  
  return JSON.parse(sessions).find((session: InterviewSession) => session._id === id) || null;
}

export function createSession(session: Omit<InterviewSession, "_id">): InterviewSession {
  if (typeof window === "undefined") throw new Error("Cannot create session on server");
  
  const sessions = localStorage.getItem(STORAGE_KEY);
  const existingSessions = sessions ? JSON.parse(sessions) : [];
  
  const newSession: InterviewSession = {
    ...session,
    _id: crypto.randomUUID(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existingSessions, newSession]));
  return newSession;
}

export function updateSession(id: string, update: Partial<InterviewSession>): InterviewSession | null {
  if (typeof window === "undefined") return null;
  
  const sessions = localStorage.getItem(STORAGE_KEY);
  if (!sessions) return null;
  
  const existingSessions = JSON.parse(sessions);
  const sessionIndex = existingSessions.findIndex((s: InterviewSession) => s._id === id);
  
  if (sessionIndex === -1) return null;
  
  const updatedSession = {
    ...existingSessions[sessionIndex],
    ...update,
  };
  
  existingSessions[sessionIndex] = updatedSession;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSessions));
  
  return updatedSession;
}

export function addQuestion(sessionId: string, question: string): string {
  if (typeof window === "undefined") throw new Error("Cannot add question on server");
  
  const questionId = Date.now().toString();
  const session = getSessionById(sessionId);
  
  if (!session) throw new Error("Session not found");
  
  const updatedSession = {
    ...session,
    questions: [...session.questions, { id: questionId, question }],
  };
  
  updateSession(sessionId, updatedSession);
  return questionId;
}

export function addAnswer(sessionId: string, questionId: string, answer: string): void {
  if (typeof window === "undefined") return;
  
  const session = getSessionById(sessionId);
  if (!session) return;
  
  const updatedSession = {
    ...session,
    questions: session.questions.map((q) =>
      q.id === questionId ? { ...q, answer } : q
    ),
  };
  
  updateSession(sessionId, updatedSession);
}

export function completeSession(sessionId: string): void {
  if (typeof window === "undefined") return;
  
  const session = getSessionById(sessionId);
  if (!session) return;
  
  updateSession(sessionId, {
    status: "completed",
    completedAt: new Date(),
  });
}

export function deleteSession(sessionId: string): void {
  if (typeof window === "undefined") return;
  
  const sessions = localStorage.getItem(STORAGE_KEY);
  if (!sessions) return;
  
  const existingSessions = JSON.parse(sessions);
  const updatedSessions = existingSessions.filter((s: InterviewSession) => s._id !== sessionId);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
}

export function setScore(sessionId: string, score: number, feedback: string): void {
  if (typeof window === "undefined") return;
  
  updateSession(sessionId, { score, feedback });
} 