
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Wallet, Users, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile } from '@/services/userService';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        try {
          await createUserProfile(userCredential.user.uid, fullName, email);
          toast({
            title: "Account Created",
            description: "Welcome! Your profile has been created. Please login to continue.",
            variant: "default",
          });
        } catch (profileError: any) {
          console.error('Profile creation error after signup:', profileError);
          toast({
            title: "Account Created, Profile Issue",
            description: profileError.message || "Your account was created, but we couldn't save your profile information. Please try logging in. If issues persist, contact support.",
            variant: "destructive",
          });
        }
      } else {
         toast({
          title: "Account Created (Profile Skipped)",
          description: "Welcome! Please login to continue. (User object missing for profile creation)",
          variant: "default",
        });
      }
      router.push('/login');
    } catch (authError: any) {
      console.error('Signup auth error:', authError);
      let toastTitle = "Signup Failed";
      let errorMessage = "Could not create account. Please try again.";

      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use. Please try a different email or login.';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please use a stronger password (at least 6 characters).';
      } else if (authError.message) {
        errorMessage = authError.message;
      }

      toast({
        title: toastTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-2 text-2xl font-semibold text-primary mb-8">
        <Wallet className="h-8 w-8" />
        <span>FinTrack AI</span>
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join FinTrack AI to manage your finances smartly.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="•••••••• (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="mt-4 text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <a
                href="/login"
                className="underline hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLoading) router.push('/login');
                }}
              >
                Login
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
      <footer className="py-6 px-4 md:px-6 mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinTrack AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
