
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings, Wallet, LogOut } from "lucide-react";

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    // Mock logout logic
    console.log('User logged out');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 px-4 md:px-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Wallet className="h-6 w-6" />
          <span>FinTrack AI</span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2"> {/* Reduced space for more items */}
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </nav>
        </div>
      </div>
    </header>
  );
}
