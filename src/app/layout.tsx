"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "AI Interview Prep",
//   description: "Practice interviews with AI",
// };

function MainContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 transition-all duration-300",
        state === "expanded" ? "lg:pl-[240px]" : "lg:pl-[70px]"
      )}
    >
      <div className="container mx-auto p-4">
        {/* <SidebarTrigger/> */}
        {children}
      </div>
    </main>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Interview.ai</title>
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <MainContent>{children}</MainContent>
            <Toaster richColors />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
