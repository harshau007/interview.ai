import type { ObjectId } from "mongodb";
import clientPromise from "../mongodb";

export type UserProfile = {
  _id?: ObjectId;
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }[];
  education: {
    id: string;
    degree: string;
    institution: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  projects: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    url?: string;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }[];
  resumeUrl?: string;
};

export async function getUsersCollection() {
  const client = await clientPromise;
  const db = client.db("interview-prep");
  return db.collection<UserProfile>("users");
}

export async function getUserById(id: string) {
  const collection = await getUsersCollection();
  const user = await collection.findOne({ id });
  return user;
}

export async function createUser(user: Omit<UserProfile, "_id">) {
  const collection = await getUsersCollection();
  const result = await collection.insertOne(user);
  return {
    ...user,
    _id: result.insertedId,
  };
}

export async function updateUser(id: string, update: Partial<UserProfile>) {
  const collection = await getUsersCollection();
  await collection.updateOne({ id }, { $set: update });
  return getUserById(id);
}

export async function addSkill(userId: string, skill: string) {
  const collection = await getUsersCollection();
  await collection.updateOne({ id: userId }, { $addToSet: { skills: skill } });
}

export async function removeSkill(userId: string, skill: string) {
  const collection = await getUsersCollection();
  await collection.updateOne({ id: userId }, { $pull: { skills: skill } });
}

export async function addExperience(
  userId: string,
  experience: Omit<UserProfile["experience"][0], "id">
) {
  const collection = await getUsersCollection();
  const id = Date.now().toString();
  await collection.updateOne(
    { id: userId },
    { $push: { experience: { id, ...experience } } }
  );
}

export async function updateExperience(
  userId: string,
  experience: UserProfile["experience"][0]
) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId, "experience.id": experience.id },
    { $set: { "experience.$": experience } }
  );
}

export async function removeExperience(userId: string, experienceId: string) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId },
    { $pull: { experience: { id: experienceId } } }
  );
}

// Similar functions for education, projects, and certifications
export async function addEducation(
  userId: string,
  education: Omit<UserProfile["education"][0], "id">
) {
  const collection = await getUsersCollection();
  const id = Date.now().toString();
  await collection.updateOne(
    { id: userId },
    { $push: { education: { id, ...education } } }
  );
}

export async function updateEducation(
  userId: string,
  education: UserProfile["education"][0]
) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId, "education.id": education.id },
    { $set: { "education.$": education } }
  );
}

export async function removeEducation(userId: string, educationId: string) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId },
    { $pull: { education: { id: educationId } } }
  );
}

export async function addProject(
  userId: string,
  project: Omit<UserProfile["projects"][0], "id">
) {
  const collection = await getUsersCollection();
  const id = Date.now().toString();
  await collection.updateOne(
    { id: userId },
    { $push: { projects: { id, ...project } } }
  );
}

export async function updateProject(
  userId: string,
  project: UserProfile["projects"][0]
) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId, "projects.id": project.id },
    { $set: { "projects.$": project } }
  );
}

export async function removeProject(userId: string, projectId: string) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId },
    { $pull: { projects: { id: projectId } } }
  );
}

export async function addCertification(
  userId: string,
  certification: Omit<UserProfile["certifications"][0], "id">
) {
  const collection = await getUsersCollection();
  const id = Date.now().toString();
  await collection.updateOne(
    { id: userId },
    { $push: { certifications: { id, ...certification } } }
  );
}

export async function updateCertification(
  userId: string,
  certification: UserProfile["certifications"][0]
) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId, "certifications.id": certification.id },
    { $set: { "certifications.$": certification } }
  );
}

export async function removeCertification(
  userId: string,
  certificationId: string
) {
  const collection = await getUsersCollection();
  await collection.updateOne(
    { id: userId },
    { $pull: { certifications: { id: certificationId } } }
  );
}

export async function setResumeUrl(userId: string, url: string) {
  const collection = await getUsersCollection();
  await collection.updateOne({ id: userId }, { $set: { resumeUrl: url } });
}

export async function deleteUser(userId: string) {
  const collection = await getUsersCollection();
  await collection.deleteOne({ id: userId });
}
