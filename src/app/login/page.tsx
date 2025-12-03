
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});


export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    await signInWithGoogle();
    // No need to set isSubmitting to false, as the redirect will happen
  }

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    const success = await signInWithEmail(values.email, values.password);
    if (!success) {
      toast({
        title: "Sign-in Failed",
        description: "Please check your email and password.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    const success = await signUpWithEmail(values.email, values.password);
    if (!success) {
      toast({
        title: "Sign-up Failed",
        description: "This email might already be in use. Please try another one.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-md border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Logo className="h-10 w-10" />
              <h1 className="text-3xl font-bold font-headline tracking-tight text-white">
                Triggered App
              </h1>
            </div>
            <p className="text-gray-400">
              Sign in to schedule and manage your webhooks with ease.
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-white">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6 space-y-4">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl><Input placeholder="name@example.com" {...field} className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Password</FormLabel>
                        <FormControl><Input type="password" placeholder="********" {...field} className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(255,95,31,0.3)]" disabled={isSubmitting}>Sign In</Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="signup" className="mt-6 space-y-4">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl><Input placeholder="name@example.com" {...field} className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Password</FormLabel>
                        <FormControl><Input type="password" placeholder="At least 8 characters" {...field} className="bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(255,95,31,0.3)]" disabled={isSubmitting}>Create Account</Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/60 px-2 text-gray-400 backdrop-blur-xl">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-black hover:bg-gray-200"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C297.1 113.5 273.5 104 248 104c-73.8 0-134.3 60.5-134.3 134.3s60.5 134.3 134.3 134.3c83.5 0 119.3-61.4 122.3-92.8H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-sm text-gray-400 drop-shadow-md">
        &copy; {new Date().getFullYear()} Triggered App
      </p>
    </div>
  );
}
