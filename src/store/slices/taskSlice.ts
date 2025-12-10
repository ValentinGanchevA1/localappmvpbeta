// src/store/slices/taskSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Task } from '@/types/task';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  loading: false,
};

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
  // In a real app, you'd fetch this from an API
  const mockTasks: Task[] = [
    { id: '1', title: 'Implement login screen', description: 'Use React Native and Redux', completed: true, priority: 'high', status: 'done' },
    { id: '2', title: 'Fix bug in profile page', description: 'Avatar is not updating', completed: false, priority: 'medium', status: 'in-progress' },
    { id: '3', title: 'Add push notifications', description: 'Use Firebase Cloud Messaging', completed: false, priority: 'low', status: 'todo' },
  ];
  return mockTasks;
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
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.tasks = action.payload;
        state.loading = false;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      });
  },
});

export const { selectTask } = taskSlice.actions;
export default taskSlice.reducer;
