
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
import { Mail, User as UserIcon, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          toast({
            title: "Error",
            description: "Could not load your profile information.",
            variant: "destructive",
          });
        }
      } else {
        router.push('/login'); // Redirect if not authenticated
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

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
    // This state should ideally be brief due to the redirect in useEffect
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
            <AvatarImage src={currentUser ? `https://placehold.co/96x96.png?text=${getInitials(userProfile?.fullName, currentUser.email)}` : "https://placehold.co/96x96.png"} alt="User Avatar" data-ai-hint="user avatar large" />
            <AvatarFallback className="text-3xl">
              {getInitials(userProfile?.fullName, currentUser?.email)}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">
            {userProfile ? userProfile.fullName : 'Your Profile'}
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
                  <ShieldAlert className="mr-2 h-4 w-4" /> Account UID
                </Label>
                <p className="text-sm p-3 bg-muted rounded-md shadow-sm text-muted-foreground break-all">{currentUser.uid}</p>
              </div>
               <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" /> Joined On
                </Label>
                <p className="text-lg p-3 bg-muted rounded-md shadow-sm">
                  {userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'Not available'}
                </p>
              </div>
              {/* Placeholder for edit button - to be implemented next */}
              <Button variant="outline" className="w-full mt-6" disabled>
                Edit Profile (Coming Soon)
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p>Loading profile information...</p>
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

// Re-export Label for use within this page component if not globally available via form
import { Label as ShadLabel } from "@/components/ui/label";
const Label = ShadLabel;
