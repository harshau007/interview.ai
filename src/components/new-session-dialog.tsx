"use client";

import { Briefcase, Building, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";

const templates = [
  {
    id: "frontend",
    title: "Frontend Developer",
    company: "Tech Corp",
    description:
      "Interview for a frontend developer position focusing on React, TypeScript, and modern web development practices.",
  },
  {
    id: "backend",
    title: "Backend Developer",
    company: "Data Systems",
    description:
      "Interview for a backend developer position focusing on Node.js, databases, and API design.",
  },
  {
    id: "fullstack",
    title: "Full Stack Developer",
    company: "StartupX",
    description:
      "Interview for a full stack developer position covering both frontend and backend technologies.",
  },
];

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSessionDialog({ open, onOpenChange }: NewSessionDialogProps) {
  const router = useRouter();
  const { createSession } = useStore();

  const [jobTitle, setJobTitle] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [jobDescription, setJobDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setJobTitle(template.title);
      setCompanyName(template.company);
      setJobDescription(template.description);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a new session and get the ID
      const sessionId = await createSession(
        jobTitle,
        jobDescription,
        companyName
      );

      // Show success toast
      toast.success("Interview session created", {
        description: "Your interview session has been created successfully.",
      });

      // Close dialog and reset form
      onOpenChange(false);
      setJobTitle("");
      setCompanyName("");
      setJobDescription("");

      // Redirect to the interview page
      router.push(`/interview/${sessionId}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Error", {
        description: "Failed to create interview session. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* <DialogTrigger asChild>
        <Button data-dialog-trigger>New Interview</Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Interview Session</DialogTitle>
          <DialogDescription>
            Enter the job details to start a personalized interview practice
            session
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid grid-cols-2 mx-6">
            <TabsTrigger value="custom">Custom Job</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="custom">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Frontend Developer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="flex items-center gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Company Name (Optional)
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Acme Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Enter the job description..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[100px] max-h-[300px] overflow-y-auto resize-none"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Session"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid gap-4 py-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => applyTemplate(template.id)}
                >
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {template.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building className="h-3 w-3" />
                    {template.company}
                  </p>
                  <p className="text-sm mt-2">{template.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
