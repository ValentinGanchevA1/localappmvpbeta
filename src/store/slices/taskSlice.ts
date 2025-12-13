// src/store/slices/taskSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Task, CreateTaskDto, UpdateTaskDto } from '@/types/task';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
  // In a real app, you'd fetch this from an API
  const mockTasks: Task[] = [
    { id: '1', title: 'Implement login screen', description: 'Use React Native and Redux', priority: 'high', status: 'completed' },
    { id: '2', title: 'Fix bug in profile page', description: 'Avatar is not updating', priority: 'medium', status: 'in_progress' },
    { id: '3', title: 'Add push notifications', description: 'Use Firebase Cloud Messaging', priority: 'low', status: 'pending' },
  ];
  return mockTasks;
});

export const createTask = createAsyncThunk('tasks/createTask', async (task: CreateTaskDto) => {
  // In a real app, you'd make an API call to create the task
  const newTask: Task = {
    id: Math.random().toString(36).substr(2, 9),
    title: task.title,
    description: task.description,
    priority: task.priority ?? 'medium',
    status: 'pending',
    ...(task.dueDate ? { dueDate: task.dueDate } : {}),
  };
  return newTask;
});

export const updateTask = createAsyncThunk('tasks/updateTask', async (task: { id: string, data: UpdateTaskDto }) => {
  // In a real app, you'd make an API call to update the task
  return task;
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (taskId: string) => {
  // In a real app, you'd make an API call to delete the task
  return taskId;
});

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    selectTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.tasks = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.tasks.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create task';
      })
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<{ id: string, data: UpdateTaskDto }>) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = { ...state.tasks[index], ...action.payload.data };
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update task';
      })
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete task';
      });
  },
});

export const { selectTask } = taskSlice.actions;
export default taskSlice.reducer;
