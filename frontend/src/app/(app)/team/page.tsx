"use client";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { TeamDashboard } from "@/components/app/team-dashboard";
import { useAuth } from "@/hooks/use-auth";


export default function TeamPage() {
  const { isManager, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isManager) {
    return (
      <ErrorState
        error={new Error("You do not have permission to view this.")}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Team"
        description="Weekly submission status, workload and activity."
      />

      <TeamDashboard />
    </>
  );
}
