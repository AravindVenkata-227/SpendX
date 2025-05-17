
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, UserCircle, Bell, Palette, Loader2, Sun, Moon, Laptop, Sparkles } from 'lucide-react';

type Theme = "light" | "dark" | "system";
const INVESTMENT_CARD_VISIBLE_KEY = 'feature_showInvestmentIdeasCard';

export default function SettingsPage() {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  // Mock states for preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  
  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const [showInvestmentCard, setShowInvestmentCard] = useState(false);

  useEffect(() => {
    const savedVisibility = localStorage.getItem(INVESTMENT_CARD_VISIBLE_KEY);
    setShowInvestmentCard(savedVisibility === 'true');
  }, []);

  const handleInvestmentCardToggle = (checked: boolean) => {
    setShowInvestmentCard(checked);
    localStorage.setItem(INVESTMENT_CARD_VISIBLE_KEY, String(checked));
    // Dispatch a storage event so other tabs/components can react if needed
    window.dispatchEvent(new StorageEvent('storage', { key: INVESTMENT_CARD_VISIBLE_KEY, newValue: String(checked) }));
  };

  const applyTheme = useCallback((theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      localStorage.setItem("theme", "system");
    } else {
      root.classList.add(theme);
      localStorage.setItem("theme", theme);
    }
    setCurrentTheme(theme);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      applyTheme("system"); // Default to system if no theme saved
    }
  }, [applyTheme]);

  useEffect(() => {
    if (currentTheme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system"); // Re-apply system theme to reflect OS change
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [currentTheme, applyTheme]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login'); // Redirect to login if not authenticated
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);


  if (isLoadingAuth || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <Button variant="outline" onClick={() => router.push('/')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Separator />

          {/* Account Settings Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserCircle className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Account</CardTitle>
              </div>
              <CardDescription>Manage your account details and profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                View and edit your personal information, or manage your account security.
              </p>
              <Button asChild variant="secondary">
                <Link href="/profile">
                  Go to Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Notifications</CardTitle>
              </div>
              <CardDescription>Customize how you receive notifications from FinTrack AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-md">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Receive important updates and summaries via email.
                  </span>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  aria-label="Toggle email notifications"
                />
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-md">
                <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                  <span>Push Notifications</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Get real-time alerts on your devices (coming soon).
                  </span>
                </Label>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  disabled // Placeholder for future feature
                  aria-label="Toggle push notifications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Appearance</CardTitle>
              </div>
              <CardDescription>Personalize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-md">
                <Label htmlFor="theme-select">Theme</Label>
                 <div className="flex gap-2 mt-2">
                    <Button 
                        variant={currentTheme === 'light' ? 'default' : 'outline'} 
                        onClick={() => applyTheme('light')}
                        className="flex-1"
                    >
                        <Sun className="mr-2 h-4 w-4" /> Light
                    </Button>
                    <Button 
                        variant={currentTheme === 'dark' ? 'default' : 'outline'} 
                        onClick={() => applyTheme('dark')}
                        className="flex-1"
                    >
                        <Moon className="mr-2 h-4 w-4" /> Dark
                    </Button>
                    <Button 
                        variant={currentTheme === 'system' ? 'default' : 'outline'} 
                        onClick={() => applyTheme('system')}
                        className="flex-1"
                    >
                        <Laptop className="mr-2 h-4 w-4" /> System
                    </Button>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Experimental Features Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Experimental Features</CardTitle>
              </div>
              <CardDescription>Enable or disable new and experimental features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-md">
                <Label htmlFor="show-investment-card" className="flex flex-col space-y-1">
                  <span>AI Investment Idea Generator</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Show the AI-powered investment idea generator on the dashboard.
                  </span>
                  <span className="text-xs text-destructive font-semibold">
                    FOR ILLUSTRATIVE AND EDUCATIONAL PURPOSES ONLY. NOT FINANCIAL ADVICE.
                  </span>
                </Label>
                <Switch
                  id="show-investment-card"
                  checked={showInvestmentCard}
                  onCheckedChange={handleInvestmentCardToggle}
                  aria-label="Toggle AI Investment Idea Generator visibility"
                />
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
      <footer className="py-6 px-4 md:px-6 border-t mt-12">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinTrack AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
