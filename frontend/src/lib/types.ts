export type UserRole = "TEAM_MEMBER" | "MANAGER" | "ADMIN";

export type ReportStatus = "DRAFT" | "SUBMITTED" | "NEEDS_CORRECTION" | "APPROVED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type ReviewAction = "APPROVED" | "REQUEST_CHANGES";

export interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
}

export interface UserDetail extends User {
    created_at: string;
    updated_at: string;
}

export interface LoginResponse {
    message: string;
    user: User;
}

export interface Project {
  project_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_member_id: number;
  project_id: number;
  user: User;
  assigned_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export function fullName(user: Pick<User, "first_name" | "last_name">): string {
    return `${user.first_name} ${user.last_name}`.trim();
}