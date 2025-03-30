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
import { type UserProfile } from "@/lib/models/user";
import { useInterviewStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const { userProfile, updateUserProfile, fetchUserProfile } = useInterviewStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<UserProfile>({
    id: "", // This will be set when saving
    name: "",
    email: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchUserProfile();
        if (userProfile) {
          setFormData(userProfile);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        // Don't show error toast, just continue with empty form
      } finally {
        setIsLoading(false);
      }
    };

    if (isInitialMount.current) {
      loadProfile();
      isInitialMount.current = false;
    }
  }, [fetchUserProfile, userProfile]);

  const handleInputChange = (
    field: keyof UserProfile,
    value: string | string[] | boolean
  ) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleExperienceChange = (index: number, field: string, value: string | boolean) => {
    if (!formData) return;
    const newExperiences = [...formData.experience];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    setFormData({ ...formData, experience: newExperiences });
  };

  const handleEducationChange = (index: number, field: string, value: string | boolean) => {
    if (!formData) return;
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData({ ...formData, education: newEducation });
  };

  const handleProjectChange = (index: number, field: string, value: string | string[]) => {
    if (!formData) return;
    const newProjects = [...formData.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setFormData({ ...formData, projects: newProjects });
  };

  const handleCertificationChange = (index: number, field: string, value: string) => {
    if (!formData) return;
    const newCertifications = [...formData.certifications];
    newCertifications[index] = { ...newCertifications[index], [field]: value };
    setFormData({ ...formData, certifications: newCertifications });
  };

  const addExperience = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      experience: [
        ...formData.experience,
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
        ...formData.education,
        {
          id: Date.now().toString(),
          degree: "",
          institution: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
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
        ...formData.projects,
        {
          id: Date.now().toString(),
          title: "",
          description: "",
          technologies: [],
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
        ...formData.certifications,
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
      experience: formData.experience.filter((_, i) => i !== index),
    });
  };

  const removeEducation = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index),
    });
  };

  const removeProject = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index),
    });
  };

  const removeCertification = (index: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSubmitting(true);

    try {
      // Generate a unique ID if not present
      const profileData = {
        ...formData,
        id: formData.id || Date.now().toString(),
      };

      // First update the store
      await updateUserProfile(profileData);
      
      // Then save to MongoDB
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save changes");
      }

      const result = await response.json();
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Add your technical skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary/10 rounded-md">{skill}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSkills = formData.skills.filter((_, i) => i !== index);
                        handleInputChange("skills", newSkills);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSkill = prompt("Enter a new skill");
                    if (newSkill) {
                      handleInputChange("skills", [...formData.skills, newSkill]);
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experience</CardTitle>
              <CardDescription>Add your work experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.experience.map((exp, index) => (
                <div key={exp.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Experience {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => handleExperienceChange(index, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, "company", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) => handleExperienceChange(index, "location", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => handleExperienceChange(index, "startDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => handleExperienceChange(index, "endDate", e.target.value)}
                        disabled={exp.current}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Position</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => handleExperienceChange(index, "current", e.target.checked)}
                        />
                        <span>I currently work here</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(index, "description", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button onClick={addExperience}>
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Add your educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.education.map((edu, index) => (
                <div key={edu.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Education {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={edu.location}
                        onChange={(e) => handleEducationChange(index, "location", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) => handleEducationChange(index, "startDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={edu.endDate}
                        onChange={(e) => handleEducationChange(index, "endDate", e.target.value)}
                        disabled={edu.current}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currently Studying</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={edu.current}
                          onChange={(e) => handleEducationChange(index, "current", e.target.checked)}
                        />
                        <span>I am currently studying here</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={edu.description}
                      onChange={(e) => handleEducationChange(index, "description", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button onClick={addEducation}>
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Add your personal projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.projects.map((project, index) => (
                <div key={project.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Project {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={project.title}
                        onChange={(e) => handleProjectChange(index, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={project.url}
                        onChange={(e) => handleProjectChange(index, "url", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={project.description}
                      onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Technologies</Label>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, techIndex) => (
                        <div key={techIndex} className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-primary/10 rounded-md">{tech}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newTechs = project.technologies.filter((_, i) => i !== techIndex);
                              handleProjectChange(index, "technologies", newTechs);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newTech = prompt("Enter a new technology");
                          if (newTech) {
                            handleProjectChange(index, "technologies", [...project.technologies, newTech]);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Technology
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addProject}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Add your certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.certifications.map((cert, index) => (
                <div key={cert.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Certification {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => handleCertificationChange(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuer</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => handleCertificationChange(index, "issuer", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={cert.date}
                        onChange={(e) => handleCertificationChange(index, "date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={cert.url}
                        onChange={(e) => handleCertificationChange(index, "url", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={addCertification}>
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
