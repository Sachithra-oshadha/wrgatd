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

export function fullName(
  user: Pick<User, "first_name" | "last_name">
): string {
  const firstName =
    user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1);

  const lastName =
    user.last_name.charAt(0).toUpperCase() + user.last_name.slice(1);

  return `${firstName} ${lastName}`;
}

export interface ReportTask {
  task_id: number;
  task_name: string;
  priority: Priority;
  planned_percent: string | null;
  actual_percent: string | null;
  status: TaskStatus;
  time_planned: string | null;
  time_spent: string | null;
  deliverable: string | null;
}

export interface NextWeekTask {
  next_task_id: number;
  description: string;
  priority: Priority;
}

export interface ReportBlocker {
  blocker_id: number;
  description: string;
  is_key_issue: boolean;
}

export interface ReportAchievement {
  achievement_id: number;
  description: string;
  is_key_achievement: boolean;
}

export interface ReportHours {
  hours_id: number;
  task_type: string;
  hours: string;
}

export interface ReportVersion {
  version_id: number;
  version_number: number;
  submitted_at: string | null;
  created_at: string;
  tasks: ReportTask[];
  next_week_tasks: NextWeekTask[];
  blockers: ReportBlocker[];
  achievements: ReportAchievement[];
  hours: ReportHours[];
}

export interface ReportSummary {
  report_id: number;
  week_start: string;
  week_end: string;
  status: ReportStatus;
  submitted_at: string | null;
  approved_at: string | null;
  updated_at: string;
  user: User;
  project: Project;
  current_version_number: number;
}

export interface Report extends ReportSummary {
  notes: string | null;
  links: string | null;
  created_at: string;
  current_version: ReportVersion;
  version_count: number;
  latest_review: ReviewComment | null;
}

export interface ReviewComment {
  review_id: number;
  report_id: number;
  version_id: number;
  version_number: number;
  action: ReviewAction;
  comment: string | null;
  created_at: string;
  reviewer: User;
}

export interface VersionHistoryEntry {
  version_id: number;
  version_number: number;
  submitted_at: string | null;
  created_at: string;
  is_current: boolean;
  tasks: ReportTask[];
  next_week_tasks: NextWeekTask[];
  blockers: ReportBlocker[];
  achievements: ReportAchievement[];
  hours: ReportHours[];
  review: ReviewComment | null;
}

export interface VersionHistory {
  report_id: number;
  versions: VersionHistoryEntry[];
}

export interface PersonalSummary {
  week_start: string;
  week_end: string;
  current_week_report: ReportSummary | null;
  total_reports: number;
  draft_count: number;
  submitted_count: number;
  needs_correction_count: number;
  approved_count: number;
  approval_rate: number;
  needs_correction_reports: ReportSummary[];
}

export interface TeamSummary {
  week_start: string;
  week_end: string;
  expected_reports: number;
  submitted_count: number;
  draft_count: number;
  approved_count: number;
  needs_correction_count: number;
  awaiting_review_count: number;
  not_started_count: number;
  compliance_percent: number;
  open_blockers: number;
}

export interface TasksTrendPoint {
  week_start: string;
  completed_tasks: number;
}

export interface WorkloadPoint {
  project: string;
  hours: number;
  report_count: number;
}

export interface HoursPoint {
  task_type: string;
  hours: number;
}

export interface MemberSubmission {
  user_id: number;
  first_name: string;
  last_name: string;
  report_id: number | null;
  project: string | null;
  status: ReportStatus | "NOT_STARTED" | "LATE";
}

export interface ActivityEvent {
  report_id: number;
  at: string;
  kind: "SUBMITTED" | "APPROVED" | "REQUEST_CHANGES";
  actor: string;
}

export interface MemberStats {
  total_reports: number;
  submitted_count: number;
  approved_count: number;
  needs_correction_count: number;
  draft_count: number;
  expected_reports: number;
  compliance_percent: number;
}

export type SectionType =
  | "blockers"
  | "achievements"
  | "tasks"
  | "next_week_tasks";

export interface SectionItem {
  description: string;
  is_key: boolean;
  priority: Priority | null;
  status: TaskStatus | null;
}

export interface MemberSection {
  user_id: number;
  first_name: string;
  last_name: string;
  report_id: number | null;
  project: string | null;
  status: ReportStatus | "NOT_STARTED" | "LATE";
  items: SectionItem[];
}
