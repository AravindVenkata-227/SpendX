
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
import { ChevronLeft, UserCircle, Bell, Palette, Loader2, Sun, Moon, Laptop, Sparkles, MessageSquareQuote, AlertTriangle } from 'lucide-react';
import { getUserProfile, updateUserProfile, type UserProfile, type NotificationPreferences } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';


type Theme = "light" | "dark" | "system";
const INVESTMENT_CARD_VISIBLE_KEY = 'feature_showInvestmentIdeasCard';
const defaultNotificationPrefs: NotificationPreferences = {
  onOverspending: true,
  onLargeTransactions: true,
  onSavingsOpportunities: true,
};


export default function SettingsPage() {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(defaultNotificationPrefs);
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentTheme, setCurrentTheme] = useState<Theme>("system");
  const [showInvestmentCard, setShowInvestmentCard] = useState(false);

  useEffect(() => {
    const savedVisibility = localStorage.getItem(INVESTMENT_CARD_VISIBLE_KEY);
    setShowInvestmentCard(savedVisibility === 'true');
  }, []);

  const handleInvestmentCardToggle = (checked: boolean) => {
    setShowInvestmentCard(checked);
    localStorage.setItem(INVESTMENT_CARD_VISIBLE_KEY, String(checked));
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
      applyTheme("system"); 
    }
  }, [applyTheme]);

  useEffect(() => {
    if (currentTheme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system"); 
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [currentTheme, applyTheme]);

  const fetchProfileForSettings = useCallback(async (user: User) => {
    setIsLoadingProfile(true);
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      if (profile?.notificationPreferences) {
        setNotificationPrefs(profile.notificationPreferences);
      } else {
        // If profile exists but prefs don't, still set to default to ensure UI consistency
        // This could happen if prefs were not added at user creation for older users
        setNotificationPrefs(defaultNotificationPrefs);
      }
    } catch (error) {
      console.error("Error fetching profile in settings:", error);
      toast({ title: "Error Loading Profile", description: "Could not load profile settings.", variant: "destructive" });
      setUserProfile(null); // Ensure profile is null on error
      setNotificationPrefs(defaultNotificationPrefs); // Reset to defaults
    } finally {
      setIsLoadingProfile(false);
    }
  }, [toast]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchProfileForSettings(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsLoadingProfile(false);
        router.push('/login'); 
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, toast, fetchProfileForSettings]);

  const handleNotificationPrefChange = async (prefKey: keyof NotificationPreferences, value: boolean) => {
    if (!currentUser) {
        toast({ title: "Authentication Error", description: "You must be logged in to change preferences.", variant: "destructive" });
        return;
    }
    // Check if profile is loaded. If still loading, perhaps wait or disable action.
    // If not loading and profile is null, it means fetch failed or no profile.
    if (!isLoadingProfile && !userProfile) {
        toast({ 
            title: "Profile Data Missing", 
            description: "Your user profile could not be loaded. Preferences cannot be saved at this time.", 
            variant: "destructive" 
        });
        // Optionally revert the switch UI state if desired, though re-fetching on error does this
        await fetchProfileForSettings(currentUser); // Attempt to re-fetch to reset UI
        return;
    }


    const updatedPrefs = { ...notificationPrefs, [prefKey]: value };
    setNotificationPrefs(updatedPrefs); // Optimistic update

    try {
      await updateUserProfile(currentUser.uid, { notificationPreferences: updatedPrefs });
      toast({ title: "Preferences Updated", description: "Your notification preferences have been saved." });
    } catch (error: any) {
      console.error("Error updating notification preferences:", error);
      let description = error.message || "Could not save notification preferences. Please try again.";
      // Check for specific error message content from userService
      if (error.message && error.message.includes("No document to update")) {
          description = "Your user profile document was not found. Cannot save preferences. Please try logging out and back in, or contact support if this persists.";
      } else if (error.message && error.message.toLowerCase().includes('permission denied')) {
        description = "Permission Denied: Could not save preferences. Please ensure Firestore rules are deployed correctly and allow updates to 'notificationPreferences'.";
      }
      
      toast({
        title: "Error Updating Preferences",
        description: description,
        variant: "destructive",
      });
      
      // Revert optimistic UI update by re-fetching profile data
      if (currentUser) {
        await fetchProfileForSettings(currentUser);
      }
    }
  };


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
          
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquareQuote className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Insight & Notification Preferences</CardTitle>
              </div>
              <CardDescription>Customize the AI insights and notifications you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingProfile ? (
                <div className="flex items-center justify-center text-muted-foreground py-4">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading preferences...
                </div>
              ) : !userProfile ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-4 p-3 bg-destructive/10 rounded-md">
                  <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                  <p className="font-semibold">Profile Not Found</p>
                  <p className="text-sm">Your user profile data could not be loaded. Notification preferences cannot be set at this time. Please try logging out and back in, or contact support if the issue persists.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-md">
                    <Label htmlFor="overspending-alerts" className="flex flex-col space-y-1">
                      <span>Overspending Alerts</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        Get notified about significant overspending in categories.
                      </span>
                    </Label>
                    <Switch
                      id="overspending-alerts"
                      checked={notificationPrefs.onOverspending}
                      onCheckedChange={(checked) => handleNotificationPrefChange('onOverspending', checked)}
                      aria-label="Toggle overspending alerts"
                      disabled={!userProfile || isLoadingProfile}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-md">
                    <Label htmlFor="large-transaction-alerts" className="flex flex-col space-y-1">
                      <span>Large Transaction Alerts</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        Receive alerts for unusually large transactions.
                      </span>
                    </Label>
                    <Switch
                      id="large-transaction-alerts"
                      checked={notificationPrefs.onLargeTransactions}
                      onCheckedChange={(checked) => handleNotificationPrefChange('onLargeTransactions', checked)}
                      aria-label="Toggle large transaction alerts"
                      disabled={!userProfile || isLoadingProfile}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-md">
                    <Label htmlFor="savings-opportunity-alerts" className="flex flex-col space-y-1">
                      <span>Savings Opportunity Alerts</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        Get insights on potential savings opportunities.
                      </span>
                    </Label>
                    <Switch
                      id="savings-opportunity-alerts"
                      checked={notificationPrefs.onSavingsOpportunities}
                      onCheckedChange={(checked) => handleNotificationPrefChange('onSavingsOpportunities', checked)}
                      aria-label="Toggle savings opportunity alerts"
                      disabled={!userProfile || isLoadingProfile}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>


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

    