"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Settings } from "lucide-react";
import { useState, useEffect } from "react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { UserProfile, Experience, Education, Project, Certification } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<UserProfile>>({
    _id: "", // This will be set when saving
    name: "",
    email: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    createdAt: new Date(),
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current && userProfile) {
      setFormData(userProfile);
      setIsLoading(false);
      isInitialMount.current = false;
    }
  }, [userProfile]);

  const handleInputChange = (
    field: keyof UserProfile,
    value: string | string[] | boolean | Date
  ) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string | boolean) => {
    if (!formData) return;
    const newExperiences = [...(formData.experience || [])];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    setFormData({ ...formData, experience: newExperiences });
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    if (!formData) return;
    const newEducation = [...(formData.education || [])];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData({ ...formData, education: newEducation });
  };

  const handleProjectChange = (index: number, field: keyof Project, value: string | string[]) => {
    if (!formData) return;
    const newProjects = [...(formData.projects || [])];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setFormData({ ...formData, projects: newProjects });
  };

  const handleCertificationChange = (index: number, field: keyof Certification, value: string) => {
    if (!formData) return;
    const newCertifications = [...(formData.certifications || [])];
    newCertifications[index] = { ...newCertifications[index], [field]: value };
    setFormData({ ...formData, certifications: newCertifications });
  };

  const addExperience = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      experience: [
        ...(formData.experience || []),
        {
          id: Date.now().toString(),
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    });
  };

  const addEducation = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      education: [
        ...(formData.education || []),
        {
          id: Date.now().toString(),
          school: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
    });
  };

  const addProject = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      projects: [
        ...(formData.projects || []),
        {
          id: Date.now().toString(),
          name: "",
          description: "",
          technologies: [],
          startDate: "",
          endDate: "",
          url: "",
        },
      ],
    });
  };

  const addCertification = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      certifications: [
        ...(formData.certifications || []),
        {
          id: Date.now().toString(),
          name: "",
          issuer: "",
          date: "",
          url: "",
        },
      ],
    });
  };

  const removeExperience = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      experience: (formData.experience || []).filter((_: Experience, i: number) => i !== index),
    });
  };

  const removeEducation = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      education: (formData.education || []).filter((_: Education, i: number) => i !== index),
    });
  };

  const removeProject = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      projects: (formData.projects || []).filter((_: Project, i: number) => i !== index),
    });
  };

  const removeCertification = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      certifications: (formData.certifications || []).filter((_: Certification, i: number) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSubmitting(true);

    try {
      // Generate a unique ID if not present
      const profileData = {
        ...formData,
        _id: formData._id || Date.now().toString(),
        updatedAt: new Date(),
      };

      // Update the store
      await updateUserProfile(profileData);
      
      toast.success("Profile updated successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your profile...</p>
            </div>
          </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
      </div>

      <div className="grid gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                value={formData.summary || ""}
                onChange={(e) => handleInputChange("summary", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Your technical and professional skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const skill = input.value.trim();
                      if (skill) {
                        handleInputChange("skills", [...(formData.skills || []), skill]);
                        input.value = "";
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add a skill"]') as HTMLInputElement;
                    if (input) {
                      const skill = input.value.trim();
                      if (skill) {
                        handleInputChange("skills", [...(formData.skills || []), skill]);
                        input.value = "";
                      }
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.skills || []).map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => {
                        const newSkills = [...(formData.skills || [])];
                        newSkills.splice(index, 1);
                        handleInputChange("skills", newSkills);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
            <CardDescription>Your work experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(formData.experience || []).map((exp, index) => (
                <div key={exp.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Experience {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          handleExperienceChange(index, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          handleExperienceChange(index, "company", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) =>
                          handleExperienceChange(index, "location", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) =>
                            handleExperienceChange(index, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={exp.endDate}
                          onChange={(e) =>
                            handleExperienceChange(index, "endDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) =>
                          handleExperienceChange(index, "description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addExperience}>
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
            <CardDescription>Your educational background</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(formData.education || []).map((edu, index) => (
                <div key={edu.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Education {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEducation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>School</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) =>
                          handleEducationChange(index, "school", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          handleEducationChange(index, "degree", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) =>
                          handleEducationChange(index, "field", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={edu.startDate}
                          onChange={(e) =>
                            handleEducationChange(index, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={edu.endDate}
                          onChange={(e) =>
                            handleEducationChange(index, "endDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={edu.description}
                        onChange={(e) =>
                          handleEducationChange(index, "description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addEducation}>
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Your personal and professional projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(formData.projects || []).map((project, index) => (
                <div key={project.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Project {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProject(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={project.name}
                        onChange={(e) =>
                          handleProjectChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) =>
                          handleProjectChange(index, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Technologies</Label>
                      <Input
                        value={project.technologies.join(", ")}
                        onChange={(e) =>
                          handleProjectChange(
                            index,
                            "technologies",
                            e.target.value.split(",").map((t) => t.trim())
                          )
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={project.startDate}
                          onChange={(e) =>
                            handleProjectChange(index, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={project.endDate}
                          onChange={(e) =>
                            handleProjectChange(index, "endDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={project.url || ""}
                        onChange={(e) =>
                          handleProjectChange(index, "url", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addProject}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
            <CardDescription>Your professional certifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(formData.certifications || []).map((cert, index) => (
                <div key={cert.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Certification {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCertification(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) =>
                          handleCertificationChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuer</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) =>
                          handleCertificationChange(index, "issuer", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={cert.date}
                        onChange={(e) =>
                          handleCertificationChange(index, "date", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={cert.url || ""}
                        onChange={(e) =>
                          handleCertificationChange(index, "url", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addCertification}>
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
