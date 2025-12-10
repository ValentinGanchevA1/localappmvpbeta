// src/types/task.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
}

export type CreateTaskDto = {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: Task['status'];
  dueDate?: string | Date;
};
export type UpdateTaskDto = Partial<CreateTaskDto> & { id: string };
