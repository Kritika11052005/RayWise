import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "./components/theme-provider";
import { ConvexClientProvider } from "./components/ConvexClientProvider";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Toaster } from "sonner";
import "./globals.css";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RayWise - Solar Rooftop Analysis",
  description: "AI-powered solar rooftop analysis and recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ea580c',
          colorBackground: '#0f172a',
          colorInputBackground: '#1e293b',
          colorInputText: '#f1f5f9',
          colorText: '#ffffff',
          colorTextSecondary: '#94a3b8',
        },
        elements: {
          card: 'bg-slate-900 border border-orange-500/20 shadow-2xl',
          headerTitle: 'text-white font-bold',
          headerSubtitle: 'text-gray-300',
          socialButtonsBlockButton: 'border border-gray-700 hover:border-orange-500/50 bg-slate-800 hover:bg-slate-700 transition-all',
          socialButtonsBlockButtonText: 'text-white font-medium',
          formButtonPrimary: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/50',
          footerActionLink: 'text-orange-400 hover:text-orange-300',
          formFieldInput: 'bg-slate-800 border-gray-700 text-white focus:border-orange-500',
          formFieldLabel: 'text-gray-300',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-orange-400 hover:text-orange-300',
          dividerLine: 'bg-gray-700',
          dividerText: 'text-gray-400',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
          
            <ThemeProvider 
              attribute="class" 
              defaultTheme="system" 
              enableSystem
              disableTransitionOnChange
            >
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <Toaster 
                position="top-right"
                richColors
                closeButton
                theme="dark"
              />
            </ThemeProvider>
            
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}