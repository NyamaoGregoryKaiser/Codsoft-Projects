import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Dashboard, Visualization, DataSource } from '../types';
import { getDashboardsApi, getDashboardByIdApi, createDashboardApi, updateDashboardApi, deleteDashboardApi } from '../api/dashboards.api';
import { getVisualizationsByDashboardApi } from '../api/dashboards.api';
import { createVisualizationApi, updateVisualizationApi, deleteVisualizationApi } from '../api/visualizations.api';

interface DashboardState {
  dashboards: Dashboard[];
  selectedDashboard: Dashboard | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  dashboards: [],
  selectedDashboard: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchDashboards = createAsyncThunk('dashboards/fetchDashboards', async (_, { rejectWithValue }) => {
  try {
    const response = await getDashboardsApi();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchDashboardById = createAsyncThunk('dashboards/fetchDashboardById', async (id: number, { rejectWithValue }) => {
  try {
    const response = await getDashboardByIdApi(id);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createDashboard = createAsyncThunk('dashboards/createDashboard', async (newDashboard: Omit<Dashboard, 'id' | 'ownerUsername' | 'createdAt' | 'updatedAt' | 'visualizations'>, { rejectWithValue }) => {
  try {
    const response = await createDashboardApi(newDashboard);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateDashboard = createAsyncThunk('dashboards/updateDashboard', async ({ id, updatedFields }: { id: number, updatedFields: Partial<Omit<Dashboard, 'visualizations'>> }, { rejectWithValue }) => {
  try {
    const response = await updateDashboardApi(id, updatedFields);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteDashboard = createAsyncThunk('dashboards/deleteDashboard', async (id: number, { rejectWithValue }) => {
  try {
    await deleteDashboardApi(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addVisualizationToDashboard = createAsyncThunk(
  'dashboards/addVisualization',
  async (newVisualization: Omit<Visualization, 'id' | 'dataSourceName' | 'ownerUsername' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await createVisualizationApi(newVisualization);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateVisualizationInDashboard = createAsyncThunk(
  'dashboards/updateVisualization',
  async ({ vizId, updatedFields }: { vizId: number, updatedFields: Partial<Visualization> }, { rejectWithValue }) => {
    try {
      const response = await updateVisualizationApi(vizId, updatedFields);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeVisualizationFromDashboard = createAsyncThunk(
  'dashboards/removeVisualization',
  async (vizId: number, { rejectWithValue }) => {
    try {
      await deleteVisualizationApi(vizId);
      return vizId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


const dashboardSlice = createSlice({
  name: 'dashboards',
  initialState,
  reducers: {
    setSelectedDashboard: (state, action: PayloadAction<Dashboard | null>) => {
      state.selectedDashboard = action.payload;
    },
    updateVisualizationLayout: (state, action: PayloadAction<{ vizId: number; x: number; y: number; w: number; h: number }>) => {
        if (state.selectedDashboard) {
            const { vizId, x, y, w, h } = action.payload;
            const vizIndex = state.selectedDashboard.visualizations.findIndex(v => v.id === vizId);
            if (vizIndex !== -1) {
                state.selectedDashboard.visualizations[vizIndex].position = x; // Example mapping, adjust as per your entity
                state.selectedDashboard.visualizations[vizIndex].sizeX = w;
                state.selectedDashboard.visualizations[vizIndex].sizeY = h;
            }
        }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboards
      .addCase(fetchDashboards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboards.fulfilled, (state, action: PayloadAction<Dashboard[]>) => {
        state.loading = false;
        state.dashboards = action.payload;
      })
      .addCase(fetchDashboards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Dashboard by ID
      .addCase(fetchDashboardById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedDashboard = null; // Clear previous selection
      })
      .addCase(fetchDashboardById.fulfilled, (state, action: PayloadAction<Dashboard>) => {
        state.loading = false;
        state.selectedDashboard = action.payload;
      })
      .addCase(fetchDashboardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Dashboard
      .addCase(createDashboard.fulfilled, (state, action: PayloadAction<Dashboard>) => {
        state.dashboards.push(action.payload);
      })
      // Update Dashboard
      .addCase(updateDashboard.fulfilled, (state, action: PayloadAction<Dashboard>) => {
        const index = state.dashboards.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.dashboards[index] = action.payload;
        }
        if (state.selectedDashboard?.id === action.payload.id) {
          state.selectedDashboard = action.payload;
        }
      })
      // Delete Dashboard
      .addCase(deleteDashboard.fulfilled, (state, action: PayloadAction<number>) => {
        state.dashboards = state.dashboards.filter((d) => d.id !== action.payload);
        if (state.selectedDashboard?.id === action.payload) {
          state.selectedDashboard = null;
        }
      })
      // Add Visualization
      .addCase(addVisualizationToDashboard.fulfilled, (state, action: PayloadAction<Visualization>) => {
        if (state.selectedDashboard && state.selectedDashboard.id === action.payload.dashboardId) {
          state.selectedDashboard.visualizations.push(action.payload);
        }
      })
      // Update Visualization
      .addCase(updateVisualizationInDashboard.fulfilled, (state, action: PayloadAction<Visualization>) => {
        if (state.selectedDashboard && state.selectedDashboard.id === action.payload.dashboardId) {
          const vizIndex = state.selectedDashboard.visualizations.findIndex(v => v.id === action.payload.id);
          if (vizIndex !== -1) {
            state.selectedDashboard.visualizations[vizIndex] = action.payload;
          }
        }
      })
      // Remove Visualization
      .addCase(removeVisualizationFromDashboard.fulfilled, (state, action: PayloadAction<number>) => {
        if (state.selectedDashboard) {
          state.selectedDashboard.visualizations = state.selectedDashboard.visualizations.filter(v => v.id !== action.payload);
        }
      });
  },
});

export const { setSelectedDashboard, updateVisualizationLayout } = dashboardSlice.actions;
export default dashboardSlice.reducer;
```
```typescript