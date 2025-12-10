// src/types/task.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string; // ISO string
}

export type CreateTaskDto = {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO string
};
export type UpdateTaskDto = Partial<CreateTaskDto> & { status?: 'pending' | 'in_progress' | 'completed' };
