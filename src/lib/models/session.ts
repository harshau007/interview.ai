import type { ObjectId } from "mongodb";
import clientPromise from "../mongodb";

export type Question = {
  id: string;
  question: string;
  answer?: string;
};

export type InterviewSession = {
  _id?: ObjectId;
  id: string;
  userId: string;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  questions: Question[];
  status: "not-started" | "in-progress" | "completed";
  score?: number;
  feedback?: string;
  createdAt: Date;
  completedAt?: Date;
};

export async function getSessionsCollection() {
  const client = await (await clientPromise)();
  if (!client) {
    throw new Error("Failed to connect to MongoDB");
  }
  const db = client.db("interview-prep");
  return db.collection<InterviewSession>("sessions");
}

export async function getAllSessions(userId: string) {
  const collection = await getSessionsCollection();
  const sessions = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return sessions.map((session: InterviewSession) => ({
    ...session,
    id: session.id.toString(),
  }));
}

export async function getSessionById(id: string) {
  const collection = await getSessionsCollection();
  const session = await collection.findOne({ id });
  if (!session) return null;
  return {
    ...session,
    id: session.id.toString(),
  };
}

export async function createSession(session: Omit<InterviewSession, "_id">) {
  const collection = await getSessionsCollection();
  const result = await collection.insertOne(session);
  return {
    ...session,
    _id: result.insertedId,
  };
}

export async function updateSession(
  id: string,
  update: Partial<InterviewSession>
) {
  const collection = await getSessionsCollection();
  await collection.updateOne({ id }, { $set: update });
  return getSessionById(id);
}

export async function addQuestion(sessionId: string, question: string) {
  const collection = await getSessionsCollection();
  const questionId = Date.now().toString();
  await collection.updateOne(
    { id: sessionId },
    { $push: { questions: { id: questionId, question } } }
  );
  return questionId;
}

export async function addAnswer(
  sessionId: string,
  questionId: string,
  answer: string
) {
  const collection = await getSessionsCollection();
  await collection.updateOne(
    { id: sessionId, "questions.id": questionId },
    { $set: { "questions.$.answer": answer } }
  );
}

export async function completeSession(sessionId: string) {
  const collection = await getSessionsCollection();
  await collection.updateOne(
    { id: sessionId },
    {
      $set: {
        status: "completed",
        completedAt: new Date(),
      },
    }
  );
}

export async function deleteSession(sessionId: string) {
  const collection = await getSessionsCollection();
  await collection.deleteOne({ id: sessionId });
}

export async function setScore(
  sessionId: string,
  score: number,
  feedback: string
) {
  const collection = await getSessionsCollection();
  await collection.updateOne({ id: sessionId }, { $set: { score, feedback } });
}
