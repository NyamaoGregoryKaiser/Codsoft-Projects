import { api } from './index';
import { OptimizationSuggestion, OptimizationSuggestionCreate, OptimizationSuggestionUpdate } from '@types';

export const suggestionsApi = {
  getSuggestionsByDatabaseId: (dbId: number) =>
    api.get<OptimizationSuggestion[]>(`/suggestions/${dbId}`),
  createSuggestion: (data: OptimizationSuggestionCreate) =>
    api.post<OptimizationSuggestion, OptimizationSuggestionCreate>('/suggestions/', data),
  updateSuggestion: (suggestionId: number, data: OptimizationSuggestionUpdate) =>
    api.put<OptimizationSuggestion, OptimizationSuggestionUpdate>(`/suggestions/${suggestionId}`, data),
  deleteSuggestion: (suggestionId: number) =>
    api.delete<OptimizationSuggestion>(`/suggestions/${suggestionId}`),
  analyzeSlowQueries: (dbId: number) =>
    api.post<OptimizationSuggestion[], {}> (`/suggestions/analyze/${dbId}`, {}),
};