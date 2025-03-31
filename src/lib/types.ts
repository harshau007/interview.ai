export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  url?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  question: string;
  answer?: string | null;
}

export interface InterviewSession {
  _id: string;
  userId: string;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  status: "not-started" | "in-progress" | "completed";
  questions: Question[];
  score?: number;
  feedback?: string;
  createdAt: Date;
  completedAt?: Date;
} 