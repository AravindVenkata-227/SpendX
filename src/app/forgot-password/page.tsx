
"use client";

import { useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Wallet, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Link Sent',
        description: `If an account exists for ${email}, a password reset link has been sent. Please check your inbox.`,
        variant: 'default',
      });
      setEmail(''); 
      router.push('/login'); 
    } catch (error: any) {
      console.error('Forgot password error:', error);
      let errorMessage = "Could not send password reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
        // We typically don't reveal if an email exists or not for security reasons,
        // so we can use the same generic message as the success case.
        // Or, if preferred, a slightly different one, but this is a common practice.
        toast({
            title: 'Password Reset Link Sent',
            description: `If an account exists for ${email}, a password reset link has been sent. Please check your inbox.`,
            variant: 'default',
        });
        setEmail('');
        router.push('/login');
        // Early return because we don't want to show a generic error toast below in this specific case.
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Error Sending Reset Link",
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
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Forgot Password?</CardTitle>
          <CardDescription className="text-center">
            No worries! Enter your email and we'll send you a reset link.
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
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { if (!isLoading) router.push('/login')}}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </Card>
      <footer className="py-6 px-4 md:px-6 mt-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinTrack AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default ForgotPasswordPage;
