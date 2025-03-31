"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type {
  Certification,
  Education,
  Experience,
  Project,
  UserProfile,
} from "@/lib/types";
import { X } from "lucide-react";

// Add validation schema
const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  experience: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      company: z.string().optional(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      description: z.string().optional(),
      employmentType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]).optional(),
      industry: z.string().optional(),
      achievements: z.array(z.string()).optional(),
    })
  ).optional(),
  education: z.array(
    z.object({
      id: z.string(),
      school: z.string().optional(),
      degree: z.string().optional(),
      field: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      description: z.string().optional(),
      gpa: z.string().optional(),
      honors: z.array(z.string()).optional(),
      relevantCoursework: z.array(z.string()).optional(),
    })
  ).optional(),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      technologies: z.array(z.string()).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      url: z.string().optional(),
      githubUrl: z.string().optional(),
      liveUrl: z.string().optional(),
      keyFeatures: z.array(z.string()).optional(),
      role: z.string().optional(),
    })
  ).optional(),
  certifications: z.array(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      issuer: z.string().optional(),
      date: z.string().optional(),
      url: z.string().optional(),
      expiryDate: z.string().optional(),
      credentialId: z.string().optional(),
      level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).optional(),
    })
  ).optional(),
});

export default function SettingsPage() {
  const router = useRouter();
  const { userProfile, updateUserProfile, init, isLoading } = useStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [isClient, setIsClient] = React.useState(false);

  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
    },
  });

  // Handle client-side hydration
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize store and load user profile
  useEffect(() => {
    const initializeStore = async () => {
      try {
        await init();
        if (userProfile) {
          form.reset(userProfile);
        }
      } catch (error) {
        console.error("Error initializing store:", error);
        toast.error("Error", {
          description: "Failed to load your profile. Please try again.",
        });
      } finally {
        setIsPageLoading(false);
      }
    };

    if (isClient) {
      initializeStore();
    }
  }, [init, isClient, form]);

  // Update form data when userProfile changes, but only if it's different
  useEffect(() => {
    if (userProfile && isClient) {
      form.reset(userProfile);
    }
  }, [userProfile, isClient, form]);

  const handleInputChange = (
    field: keyof z.infer<typeof userProfileSchema>,
    value: z.infer<typeof userProfileSchema>[keyof z.infer<
      typeof userProfileSchema
    >]
  ) => {
    form.setValue(field, value, { shouldDirty: true });
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string | boolean
  ) => {
    const currentExperiences = form.getValues().experience || [];
    const newExperiences = [...currentExperiences];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    form.setValue("experience", newExperiences, { shouldDirty: true });
  };

  const handleEducationChange = (
    index: number,
    field: keyof Education,
    value: string
  ) => {
    const currentEducation = form.getValues().education || [];
    const newEducation = [...currentEducation];
    newEducation[index] = { ...newEducation[index], [field]: value };
    form.setValue("education", newEducation, { shouldDirty: true });
  };

  const handleProjectChange = (
    index: number,
    field: keyof Project,
    value: string | string[]
  ) => {
    const currentProjects = form.getValues().projects || [];
    const newProjects = [...currentProjects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    form.setValue("projects", newProjects, { shouldDirty: true });
  };

  const handleCertificationChange = (
    index: number,
    field: keyof Certification,
    value: string
  ) => {
    const currentCertifications = form.getValues().certifications || [];
    const newCertifications = [...currentCertifications];
    newCertifications[index] = { ...newCertifications[index], [field]: value };
    form.setValue("certifications", newCertifications, { shouldDirty: true });
  };

  const addExperience = () => {
    const currentExperiences = form.getValues().experience || [];
    form.setValue("experience", [
      ...currentExperiences,
      {
        id: Date.now().toString(),
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        employmentType: "Full-time",
        industry: "",
        achievements: [],
      },
    ], { shouldDirty: true });
  };

  const addEducation = () => {
    const currentEducation = form.getValues().education || [];
    form.setValue("education", [
      ...currentEducation,
      {
        id: Date.now().toString(),
        school: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        gpa: "",
        honors: [],
        relevantCoursework: [],
      },
    ], { shouldDirty: true });
  };

  const addProject = () => {
    const currentProjects = form.getValues().projects || [];
    form.setValue("projects", [
      ...currentProjects,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        technologies: [],
        startDate: "",
        endDate: "",
        current: false,
        url: "",
        githubUrl: "",
        liveUrl: "",
        keyFeatures: [],
        role: "",
      },
    ], { shouldDirty: true });
  };

  const addCertification = () => {
    const currentCertifications = form.getValues().certifications || [];
    form.setValue("certifications", [
      ...currentCertifications,
      {
        id: Date.now().toString(),
        name: "",
        issuer: "",
        date: "",
        url: "",
        expiryDate: "",
        credentialId: "",
        level: "Intermediate",
      },
    ], { shouldDirty: true });
  };

  const removeExperience = (index: number) => {
    form.setValue(
      "experience",
      (form.getValues().experience || []).filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const removeEducation = (index: number) => {
    form.setValue(
      "education",
      (form.getValues().education || []).filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const removeProject = (index: number) => {
    form.setValue(
      "projects",
      (form.getValues().projects || []).filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const removeCertification = (index: number) => {
    form.setValue(
      "certifications",
      (form.getValues().certifications || []).filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const handleSave = async (values: z.infer<typeof userProfileSchema>) => {
    try {
      setIsSubmitting(true);
      await updateUserProfile(values as unknown as Partial<UserProfile>);
      toast.success("Success", {
        description: "Your profile has been updated successfully.",
      });
      form.reset(values); // Reset form with current values to mark as clean
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error", {
        description: "Failed to save your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || isPageLoading || isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="grid gap-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills <span className="text-destructive">*</span></CardTitle>
              <CardDescription>
                Your technical and professional skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a skill"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const skill = input.value.trim();
                                if (skill) {
                                  handleInputChange("skills", [
                                    ...(form.getValues().skills || []),
                                    skill,
                                  ]);
                                  input.value = "";
                                }
                              }
                            }}
                          />
                          <Button
                            onClick={() => {
                              const input = document.querySelector(
                                'input[placeholder="Add a skill"]'
                              ) as HTMLInputElement;
                              if (input) {
                                const skill = input.value.trim();
                                if (skill) {
                                  handleInputChange("skills", [
                                    ...(form.getValues().skills || []),
                                    skill,
                                  ]);
                                  input.value = "";
                                }
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  {(form.getValues().skills || []).map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => {
                          const newSkills = [
                            ...(form.getValues().skills || []),
                          ];
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
                {(form.getValues().experience || []).map((exp, index) => (
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
                      <FormField
                        control={form.control}
                        name={`experience.${index}.current`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">I currently work here</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.employmentType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Type</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.industry`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.location`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experience.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`experience.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  disabled={form.getValues().experience?.[index]?.current}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`experience.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.achievements`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Achievements</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {(field.value || []).map((achievement, i) => (
                                  <div key={i} className="flex gap-2">
                                    <Input
                                      value={achievement}
                                      onChange={(e) => {
                                        const newAchievements = [...(field.value || [])];
                                        newAchievements[i] = e.target.value;
                                        field.onChange(newAchievements);
                                      }}
                                      placeholder="Enter achievement"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newAchievements = field.value?.filter((_, idx) => idx !== i);
                                        field.onChange(newAchievements);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    field.onChange([...(field.value || []), ""]);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Achievement
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addExperience}>
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
                {(form.getValues().education || []).map((edu, index) => (
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
                      <FormField
                        control={form.control}
                        name={`education.${index}.current`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">I currently study here</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.school`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School/University</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.degree`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Degree</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.field`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field of Study</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  disabled={form.getValues().education?.[index]?.current}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`education.${index}.gpa`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GPA (if applicable)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.honors`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Honors & Awards</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {(field.value || []).map((honor, i) => (
                                  <div key={i} className="flex gap-2">
                                    <Input
                                      value={honor}
                                      onChange={(e) => {
                                        const newHonors = [...(field.value || [])];
                                        newHonors[i] = e.target.value;
                                        field.onChange(newHonors);
                                      }}
                                      placeholder="Enter honor or award"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newHonors = field.value?.filter((_, idx) => idx !== i);
                                        field.onChange(newHonors);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    field.onChange([...(field.value || []), ""]);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Honor
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.relevantCoursework`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relevant Coursework</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {(field.value || []).map((course, i) => (
                                  <div key={i} className="flex gap-2">
                                    <Input
                                      value={course}
                                      onChange={(e) => {
                                        const newCourses = [...(field.value || [])];
                                        newCourses[i] = e.target.value;
                                        field.onChange(newCourses);
                                      }}
                                      placeholder="Enter course name"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newCourses = field.value?.filter((_, idx) => idx !== i);
                                        field.onChange(newCourses);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    field.onChange([...(field.value || []), ""]);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Course
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Information</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addEducation}>
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
                {(form.getValues().projects || []).map((project, index) => (
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
                      <FormField
                        control={form.control}
                        name={`projects.${index}.current`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Currently working on this project</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`projects.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`projects.${index}.role`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Role</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Lead Developer, UI Designer" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`projects.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`projects.${index}.technologies`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Technologies Used</FormLabel>
                            <FormControl>
                              <Input
                                value={field.value?.join(", ") || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.split(",").map((t) => t.trim())
                                  )
                                }
                                placeholder="e.g., React, Node.js, MongoDB"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`projects.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`projects.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  disabled={form.getValues().projects?.[index]?.current}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`projects.${index}.keyFeatures`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Features</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {(field.value || []).map((feature, i) => (
                                  <div key={i} className="flex gap-2">
                                    <Input
                                      value={feature}
                                      onChange={(e) => {
                                        const newFeatures = [...(field.value || [])];
                                        newFeatures[i] = e.target.value;
                                        field.onChange(newFeatures);
                                      }}
                                      placeholder="Enter feature"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newFeatures = field.value?.filter((_, idx) => idx !== i);
                                        field.onChange(newFeatures);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    field.onChange([...(field.value || []), ""]);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Feature
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`projects.${index}.githubUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://github.com/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`projects.${index}.liveUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Live Demo URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addProject}>
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
                {(form.getValues().certifications || []).map((cert, index) => (
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
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.issuer`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issuing Organization</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.level`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.expiryDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (if applicable)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.credentialId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credential ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., ABC123" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.url`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={addCertification}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <div className="mt-6 flex justify-end">
        <Button 
          type="submit" 
          onClick={form.handleSubmit(handleSave)} 
          disabled={isSubmitting || !form.formState.isDirty}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
