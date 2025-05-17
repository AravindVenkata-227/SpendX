
"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, Wallet, LogOut, Loader2, User as UserIcon, LayoutDashboard } from "lucide-react";
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
        }
      } else {
        setUserProfile(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
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
      setUserProfile(null);
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
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Wallet className="h-6 w-6" />
          <span>FinTrack AI</span>
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" aria-label="Notifications" disabled={isLoggingOut || isLoadingAuth}>
            <Bell className="h-5 w-5" />
          </Button>
          <Link href="/settings" passHref legacyBehavior>
            <Button variant="ghost" size="icon" aria-label="Settings" disabled={isLoggingOut || isLoadingAuth}>
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          
          {isLoadingAuth ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={userProfile?.photoURL || `https://placehold.co/40x40.png?text=${getInitials(userProfile?.fullName, currentUser.email)}`}
                      alt={userProfile?.fullName || currentUser.email || "User Avatar"}
                      data-ai-hint="user avatar"
                    />
                    <AvatarFallback>{getInitials(userProfile?.fullName, currentUser.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.fullName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button asChild>
                <Link href="/login">Login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
