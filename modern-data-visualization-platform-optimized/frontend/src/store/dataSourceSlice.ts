import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DataSource } from '../types';
import { getDataSourcesApi, getDataSourceByIdApi, createDataSourceApi, updateDataSourceApi, deleteDataSourceApi } from '../api/dataSources.api';

interface DataSourceState {
  dataSources: DataSource[];
  selectedDataSource: DataSource | null;
  loading: boolean;
  error: string | null;
}

const initialState: DataSourceState = {
  dataSources: [],
  selectedDataSource: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchDataSources = createAsyncThunk('dataSources/fetchDataSources', async (_, { rejectWithValue }) => {
  try {
    const response = await getDataSourcesApi();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchDataSourceById = createAsyncThunk('dataSources/fetchDataSourceById', async (id: number, { rejectWithValue }) => {
  try {
    const response = await getDataSourceByIdApi(id);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createDataSource = createAsyncThunk('dataSources/createDataSource', async (newDataSource: Omit<DataSource, 'id' | 'ownerUsername' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
  try {
    const response = await createDataSourceApi(newDataSource);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateDataSource = createAsyncThunk('dataSources/updateDataSource', async ({ id, updatedFields }: { id: number, updatedFields: Partial<DataSource> }, { rejectWithValue }) => {
  try {
    const response = await updateDataSourceApi(id, updatedFields);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteDataSource = createAsyncThunk('dataSources/deleteDataSource', async (id: number, { rejectWithValue }) => {
  try {
    await deleteDataSourceApi(id);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});


const dataSourceSlice = createSlice({
  name: 'dataSources',
  initialState,
  reducers: {
    setSelectedDataSource: (state, action: PayloadAction<DataSource | null>) => {
      state.selectedDataSource = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch DataSources
      .addCase(fetchDataSources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDataSources.fulfilled, (state, action: PayloadAction<DataSource[]>) => {
        state.loading = false;
        state.dataSources = action.payload;
      })
      .addCase(fetchDataSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch DataSource by ID
      .addCase(fetchDataSourceById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedDataSource = null;
      })
      .addCase(fetchDataSourceById.fulfilled, (state, action: PayloadAction<DataSource>) => {
        state.loading = false;
        state.selectedDataSource = action.payload;
      })
      .addCase(fetchDataSourceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create DataSource
      .addCase(createDataSource.fulfilled, (state, action: PayloadAction<DataSource>) => {
        state.dataSources.push(action.payload);
      })
      // Update DataSource
      .addCase(updateDataSource.fulfilled, (state, action: PayloadAction<DataSource>) => {
        const index = state.dataSources.findIndex((ds) => ds.id === action.payload.id);
        if (index !== -1) {
          state.dataSources[index] = action.payload;
        }
        if (state.selectedDataSource?.id === action.payload.id) {
          state.selectedDataSource = action.payload;
        }
      })
      // Delete DataSource
      .addCase(deleteDataSource.fulfilled, (state, action: PayloadAction<number>) => {
        state.dataSources = state.dataSources.filter((ds) => ds.id !== action.payload);
        if (state.selectedDataSource?.id === action.payload) {
          state.selectedDataSource = null;
        }
      });
  },
});

export const { setSelectedDataSource } = dataSourceSlice.actions;
export default dataSourceSlice.reducer;