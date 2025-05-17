
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, type UserProfile } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, User as UserIcon, ArrowLeft, Loader2, AlertTriangle, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formattedJoinedDate, setFormattedJoinedDate] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          console.log('Fetched profile in ProfilePage:', profile); // Diagnostic log
          setUserProfile(profile);
        } catch (error: any) {
          console.error("Error fetching user profile in ProfilePage:", error);
          toast({
            title: "Error",
            description: "Could not load your profile information due to an unexpected error.",
            variant: "destructive",
          });
          setUserProfile(null);
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  useEffect(() => {
    if (userProfile?.createdAt) {
      // Format date client-side to avoid hydration issues
      setFormattedJoinedDate(new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString());
    } else if (currentUser && !userProfile && !isLoading) {
      // If auth user exists but no firestore profile, and not loading
      setFormattedJoinedDate('Not available');
    }
  }, [userProfile, currentUser, isLoading]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be caught by the onAuthStateChanged redirect,
    // but it's a good fallback during the brief period before redirection.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 pt-10 sm:pt-16">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
            <AvatarImage
              src={currentUser ? `https://placehold.co/96x96.png?text=${getInitials(userProfile?.fullName, currentUser.email)}` : "https://placehold.co/96x96.png"}
              alt="User Avatar"
              data-ai-hint="user avatar large"
            />
            <AvatarFallback className="text-3xl">
              {getInitials(userProfile?.fullName, currentUser?.email)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">
            {userProfile?.fullName || currentUser?.displayName || 'Your Profile'}
          </CardTitle>
          <CardDescription>
            View and manage your account details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {userProfile ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" /> Full Name
                </Label>
                <p className="text-lg p-3 bg-muted rounded-md shadow-sm">{userProfile.fullName}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <Mail className="mr-2 h-4 w-4" /> Email Address
                </Label>
                <p className="text-lg p-3 bg-muted rounded-md shadow-sm">{userProfile.email}</p>
              </div>
               <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" /> Joined On
                </Label>
                <p className="text-lg p-3 bg-muted rounded-md shadow-sm">
                  {formattedJoinedDate || <Loader2 className="h-4 w-4 animate-spin inline-block" />}
                </p>
              </div>
              <Button variant="outline" className="w-full mt-6" disabled>
                Edit Profile (Coming Soon)
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
              <p className="font-semibold">Profile Information Not Available</p>
              <p className="text-xs mt-1">
                We couldn't load your detailed profile information (e.g., Full Name, Joined Date) from our records.
                This might happen if the profile wasn't created during signup or if there's an issue accessing it.
              </p>
              {currentUser?.email && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center justify-center">
                    <Mail className="mr-2 h-4 w-4" /> Registered Email Address
                  </Label>
                  <p className="text-lg p-3 bg-muted rounded-md shadow-sm">{currentUser.email}</p>
                </div>
              )}
               <p className="text-xs mt-3">
                If you just signed up, it might take a moment for the full profile to be created. Otherwise, please check your server console logs for any Firestore errors and contact support if this persists.
              </p>
            </div>
          )}
          <Button variant="ghost" className="w-full mt-4" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
       <footer className="py-6 px-4 md:px-6 mt-12">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinTrack AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// Re-export Label to ensure it's correctly picked up if there are multiple Label definitions in scope.
import { Label as ShadLabel } from "@/components/ui/label";
const Label = ShadLabel;
