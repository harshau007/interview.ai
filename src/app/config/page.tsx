"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { useInterviewStore } from "@/lib/store";

export default function ConfigPage() {
  const router = useRouter();
  const { config, updateConfig } = useInterviewStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    geminiApiKey: config?.geminiApiKey || "",
    mongodbUri: config?.mongodbUri || "",
    elevenLabsApiKey: config?.elevenLabsApiKey || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save configuration
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      // Update store
      updateConfig(formData);

      toast.success("Configuration saved successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Configure your API keys and database settings
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  value={formData.geminiApiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, geminiApiKey: e.target.value })
                  }
                  required
                  placeholder="Enter your Gemini API key"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mongodbUri">MongoDB Connection URI</Label>
                <Input
                  id="mongodbUri"
                  type="password"
                  value={formData.mongodbUri}
                  onChange={(e) =>
                    setFormData({ ...formData, mongodbUri: e.target.value })
                  }
                  required
                  placeholder="mongodb+srv://..."
                />
                <p className="text-sm text-muted-foreground">
                  Get your connection string from{" "}
                  <a
                    href="https://www.mongodb.com/cloud/atlas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    MongoDB Atlas
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="elevenLabsApiKey">ElevenLabs API Key</Label>
                <Input
                  id="elevenLabsApiKey"
                  type="password"
                  value={formData.elevenLabsApiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, elevenLabsApiKey: e.target.value })
                  }
                  required
                  placeholder="Enter your ElevenLabs API key"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ElevenLabs
                  </a>
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Configuration"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 