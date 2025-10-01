
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }

    // If finished loading and there's no user, redirect to login (unless already there)
    if (!user && pathname !== "/login") {
      router.push("/login");
    }
    
    // If finished loading and there IS a user, but they are on the login page, redirect to home
    if (user && pathname === "/login") {
      router.push("/");
    }

  }, [user, loading, router, pathname]);

  // While loading, show a spinner
  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If there's no user and we're not on the login page, we're about to redirect, so show a spinner.
  if (!user && pathname !== "/login") {
     return (
       <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  // If there is a user, or if there's no user but we are on the login page, show the children.
  if (user || pathname === '/login') {
    return <>{children}</>;
  }

  return null;
}
