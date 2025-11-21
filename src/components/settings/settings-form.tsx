
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Copy, Eye, EyeOff, RefreshCcw } from "lucide-react";
import { useOrganizations } from "@/hooks/use-organizations";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supportedTimezones } from "@/lib/timezones";
import { ScrollArea } from "@/components/ui/scroll-area";


function ApiKeyCard() {
  const { selectedOrganization, regenerateApiKey } = useOrganizations();
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();
  
  const apiKey = selectedOrganization?.apiKey;

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Copied to Clipboard",
      description: "Your API key has been copied.",
    });
  }

  const handleRegenerate = async () => {
    if (!selectedOrganization) return;
    setIsRegenerating(true);
    try {
        await regenerateApiKey();
        toast({
            title: "API Key Regenerated",
            description: "Your new API key is now active.",
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to regenerate API key. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsRegenerating(false);
    }
  }

  if (!selectedOrganization) {
    return null; // Or a loading/skeleton state
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>
          Use this key to authenticate requests to the Triggered App API. Keep it secret!
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex gap-2 items-center max-w-sm">
            <Input 
              type={isApiKeyVisible ? "text" : "password"} 
              readOnly 
              value={apiKey || "Generating..."} 
              className="font-mono"
              disabled={!apiKey}
            />
            <Button variant="ghost" size="icon" onClick={() => setIsApiKeyVisible(!isApiKeyVisible)} disabled={!apiKey}>
              {isApiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{isApiKeyVisible ? 'Hide API Key' : 'Show API Key'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!apiKey}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy API Key</span>
            </Button>
         </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex justify-between items-center w-full">
            <p className="text-sm text-muted-foreground">
                Regenerate your key if you believe it has been compromised.
            </p>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isRegenerating}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {isRegenerating ? "Regenerating..." : "Regenerate API Key"}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Regenerating your API key will permanently invalidate the old key. You will need to update any services or applications using the old key.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerate}>Regenerate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )
}

function TimezoneCard() {
    const { selectedOrganization, updateOrganizationTimezone } = useOrganizations();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const timezoneSchema = z.object({
        timezone: z.string().min(1, "Timezone is required."),
    });
    
    const timezoneForm = useForm<z.infer<typeof timezoneSchema>>({
        resolver: zodResolver(timezoneSchema),
        values: {
            timezone: selectedOrganization?.timezone || "UTC",
        },
    });

    async function onTimezoneSubmit(values: z.infer<typeof timezoneSchema>) {
        setIsSaving(true);
        try {
            await updateOrganizationTimezone(values.timezone);
            toast({
                title: "Timezone Updated",
                description: "The default timezone for this organization has been updated.",
            });
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to update timezone. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }
    
    if (!selectedOrganization) {
      return null;
    }

    return (
        <Card className="shadow-lg">
            <Form {...timezoneForm}>
                 <form onSubmit={timezoneForm.handleSubmit(onTimezoneSubmit)}>
                    <CardHeader>
                        <CardTitle>Organization Timezone</CardTitle>
                        <CardDescription>
                            Set the default timezone for all triggers in this organization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={timezoneForm.control}
                            name="timezone"
                            render={({ field }) => (
                            <FormItem className="max-w-sm">
                                <FormLabel>Timezone</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a timezone" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <ScrollArea className="h-72">
                                    {supportedTimezones.map(tz => (
                                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                    ))}
                                    </ScrollArea>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                         <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Timezone"}
                        </Button>
                    </CardFooter>
                 </form>
            </Form>
        </Card>
    )
}

export function SettingsForm() {
  const { user, updateDisplayName, linkPassword } = useAuth();
  const { toast } = useToast();

  const profileSchema = z.object({
    displayName: z.string().min(2, {
      message: "Display name must be at least 2 characters.",
    }),
  });

  const passwordSchema = z.object({
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    const success = await updateDisplayName(values.displayName);
    if (success) {
      toast({
        title: "Profile Updated",
        description: "Your display name has been successfully updated.",
      });
    } else {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    const success = await linkPassword(values.password);
    if (success) {
      toast({
        title: "Password Set",
        description: "You can now sign in with your email and password.",
      });
      passwordForm.reset();
    } else {
       toast({
        title: "Error",
        description: "Could not set password. You may need to re-authenticate to perform this action.",
        variant: "destructive",
      });
    }
  }
  
  const isPasswordProvider = user?.providerData.some(
    (provider) => provider.providerId === "password"
  );

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="relative w-fit">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="text-3xl">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Change profile picture</span>
                </Button>
            </div>

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-sm">
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Email" disabled value={user?.email || ''} />
                    </FormControl>
              </FormItem>
              <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Separator />

      <TimezoneCard />
      
      <Separator />
      
      <ApiKeyCard />

      <Separator />

      {!isPasswordProvider && (
         <Card className="shadow-lg">
            <CardHeader>
            <CardTitle>Set a Password</CardTitle>
            <CardDescription>
                You are currently signing in with a social provider. You can set a password to be able to sign in with your email as well.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-sm">
                <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="At least 8 characters" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? "Saving..." : "Set Password"}
                </Button>
                </form>
            </Form>
            </CardContent>
      </Card>
      )}
    </div>
  );
}
