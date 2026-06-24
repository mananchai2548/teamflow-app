export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Task = {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  due_date: string | null;
  tags: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: { id: string, is_completed: boolean }[];
  task_comments?: { id: string }[];
};

export type TeamMember = {
  team_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profiles?: Profile; // joined relation
};

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type Subtask = {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
};

export type TaskAttachment = {
  id: string;
  task_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
  profiles?: Profile;
};
