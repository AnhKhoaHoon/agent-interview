export const INTERVIEW_ROLES = ['devops', 'dba'] as const;

export type InterviewRole = typeof INTERVIEW_ROLES[number];

export function isInterviewRole(value: string): value is InterviewRole {
  return (INTERVIEW_ROLES as readonly string[]).includes(value);
}
