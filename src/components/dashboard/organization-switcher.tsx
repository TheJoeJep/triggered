"use client"

import * as React from "react"
import { ChevronsUpDown, PlusCircle, User as UserIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useOrganizations } from "@/hooks/use-organizations"
import { useSelectedOrg } from "@/hooks/use-selected-org"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddOrganizationDialog } from "./add-organization-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export function OrganizationSwitcher() {
  const { organizations, loading, createOrganization } = useOrganizations();
  const { selectedOrgId, setSelectedOrgId } = useSelectedOrg();
  const { user } = useAuth();
  const [isOrgDialogOpen, setIsOrgDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const selectedOrganization = organizations.find(org => org.id === selectedOrgId);

  const handleCreateOrg = async (name: string) => {
    await createOrganization(name);
    toast({
        title: "Organization Created",
        description: `The "${name}" organization has been successfully created.`,
    });
  };

  if (loading) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        </div>
    )
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-auto justify-start p-2 h-auto"
        >
          <div className="flex items-center gap-2">
            {selectedOrganization ? (
                <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedOrganization?.owner.photoURL} alt={selectedOrganization?.name} />
                    <AvatarFallback>{selectedOrganization?.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            ) : (
                <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                    <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                </Avatar>
            )}
            <span className="truncate font-semibold text-sm max-w-[150px]">
              {selectedOrganization?.name || user?.displayName || "Personal Account"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>{user?.displayName || "My Account"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Organizations</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setSelectedOrgId(org.id)}
              className="text-sm"
              disabled={org.id === selectedOrgId}
            >
              <Avatar className="mr-2 h-5 w-5">
                <AvatarImage src={org.owner.photoURL} alt={org.name} />
                <AvatarFallback>{org.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{org.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setIsOrgDialogOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AddOrganizationDialog isOpen={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen} onAddOrganization={handleCreateOrg} />
    </>
  )
}
