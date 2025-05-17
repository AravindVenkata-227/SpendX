
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, Wallet, LogOut, Loader2 } from "lucide-react";
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { getUserProfile, type UserProfile } from '@/services/userService';

export default function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    setIsLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile in header:", error);
          // Optionally show a toast if profile fetch fails, e.g.:
          // toast({ title: "Profile Error", description: "Could not load user profile.", variant: "destructive" });
        }
      } else {
        setUserProfile(null); // Clear profile if user logs out
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);


  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
      setUserProfile(null); // Clear profile on logout
      router.push('/login');
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: error.message || "Could not log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const names = name.split(' ');
      if (names.length === 1) return names[0].charAt(0).toUpperCase();
      return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Wallet className="h-6 w-6" />
          <span>FinTrack AI</span>
        </div>
        <nav className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" aria-label="Notifications" disabled={isLoggingOut || isLoadingAuth}>
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings" disabled={isLoggingOut || isLoadingAuth}>
            <Settings className="h-5 w-5" />
          </Button>
          {currentUser && (
            <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout} disabled={isLoggingOut || isLoadingAuth}>
              {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser ? `https://placehold.co/40x40.png?text=${getInitials(userProfile?.fullName, currentUser.email)}` : "https://placehold.co/40x40.png"} alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>
              {isLoadingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : getInitials(userProfile?.fullName, currentUser?.email)}
            </AvatarFallback>
          </Avatar>
        </nav>
      </div>
    </header>
  );
}
