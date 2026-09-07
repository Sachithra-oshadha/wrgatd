"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RequiredMark } from "@/components/app/required-mark";
import { useCreateUser } from "@/hooks/use-users";
import {
  userCreateSchema,
  type UserCreateValues,
} from "@/lib/validation/user";
import type { UserRole } from "@/lib/types";


const ROLE_LABELS: Record<UserRole, string> = {
  TEAM_MEMBER: "Team Member",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

const DEFAULT_VALUES: UserCreateValues = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "TEAM_MEMBER",
};


export function UserCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const role = watch("role");

  useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [open, reset]);


  async function onSubmit(values: UserCreateValues) {
    await create.mutateAsync(values);
    onOpenChange(false);
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>

          <DialogDescription>
            New accounts start out active. They can sign in with the email
            and password you set here.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-first-name">
                First name
                <RequiredMark />
              </Label>

              <Input id="user-first-name" {...register("first_name")} />

              {errors.first_name && (
                <p className="text-sm text-status-late">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-last-name">
                Last name
                <RequiredMark />
              </Label>

              <Input id="user-last-name" {...register("last_name")} />

              {errors.last_name && (
                <p className="text-sm text-status-late">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">
              Email
              <RequiredMark />
            </Label>

            <Input id="user-email" type="email" {...register("email")} />

            {errors.email && (
              <p className="text-sm text-status-late">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              Password
              <RequiredMark />
            </Label>

            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />

            {errors.password && (
              <p className="text-sm text-status-late">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>

            <Select
              value={role}
              onValueChange={(value) =>
                setValue("role", value as UserRole, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>

              <SelectContent>
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {ROLE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.role && (
              <p className="text-sm text-status-late">
                {errors.role.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
