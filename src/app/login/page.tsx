
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { KeyRound, Mail, Lock, Wallet, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, createUserProfile } from '@/services/userService'; // Import userService functions

// Simple inline SVG for Google icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.824 10.364C21.824 9.709 21.77 9.091 21.651 8.5H12.233V12.091H17.612C17.388 13.409 16.659 14.545 15.533 15.257V17.518H18.305C20.477 15.545 21.824 13.182 21.824 10.364Z"
      fill="#4285F4"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.233 22C14.915 22 17.134 21.091 18.305 19.518L15.533 17.518C14.624 18.127 13.521 18.5 12.233 18.5C9.763 18.5 7.659 16.873 6.891 14.636H3.995V16.945C5.249 19.909 8.485 22 12.233 22Z"
      fill="#34A853"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.891 14.636C6.677 14.027 6.549 13.364 6.549 12.682C6.549 12 6.677 11.336 6.891 10.727V8.418H3.995C3.485 9.455 3.176 10.636 3.176 11.864C3.176 13.091 3.485 14.273 3.995 15.309L6.891 14.636Z"
      fill="#FBBC05"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.233 6.86364C13.615 6.86364 14.988 7.36364 15.943 8.25455L18.366 5.83636C17.121 4.69091 14.902 3.90909 12.233 3.90909C8.485 3.90909 5.249 6.09091 3.995 9.05455L6.891 10.7273C7.659 8.49091 9.763 6.86364 12.233 6.86364Z"
      fill="#EA4335"
    />
  </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "default",
      });
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        const fullName = user.displayName || user.email?.split('@')[0] || 'New User';
        const email = user.email;
        if (!email) {
            throw new Error("Google Sign-In did not provide an email address.");
        }
        await createUserProfile(user.uid, fullName, email);
        toast({
          title: "Profile Created",
          description: "Your profile has been set up.",
          variant: "default"
        });
      }

      toast({
        title: "Sign-In Successful",
        description: `Welcome, ${user.displayName || user.email}!`,
        variant: "default",
      });
      router.push('/');
    } catch (error: any)
{
      console.error('Google Sign-In error:', error);
      let description = "Could not sign in with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        description = "Sign-in popup closed. Please try again.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with this email address but with a different sign-in method. Try logging in using that method.";
      } else if (error.code === 'auth/unauthorized-domain') {
        description = "This domain is not authorized for Google Sign-In. Please contact support.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        title: "Google Sign-In Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-2 text-2xl font-semibold text-primary mb-8">
        <Wallet className="h-8 w-8" />
        <span>FinTrack AI</span>
      </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                  disabled={isLoading || isLoadingGoogle}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLoading && !isLoadingGoogle) router.push('/forgot-password');
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isLoading || isLoadingGoogle}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading || isLoadingGoogle}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <div className="relative w-full">
              <Separator className="my-2" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isLoadingGoogle}
            >
              {isLoadingGoogle ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {isLoadingGoogle ? "Signing in..." : "Sign in with Google"}
            </Button>

            <p className="mt-3 text-xs text-center text-muted-foreground">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="underline hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLoading && !isLoadingGoogle) router.push('/signup');
                }}
              >
                Sign up
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
