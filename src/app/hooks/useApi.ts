import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../services/api/client'

// Dashboard hooks
export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => apiClient.get('/dashboard/kpis'),
  })
}

export function useForecastTrend() {
  return useQuery({
    queryKey: ['dashboard', 'forecast-trend'],
    queryFn: () => apiClient.get('/dashboard/forecast-trend'),
  })
}

export function useSegmentDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'segment-distribution'],
    queryFn: () => apiClient.get('/dashboard/segment-distribution'),
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => apiClient.get('/dashboard/activity'),
  })
}

// Upload hooks
export function useUploadedFiles() {
  return useQuery({
    queryKey: ['uploads', 'files'],
    queryFn: () => apiClient.getUploadedFiles(),
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filename: string) => apiClient.deleteFile(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', 'files'] })
    },
  })
}

// RFMQ hooks
export function useRFMQSegments() {
  return useQuery({
    queryKey: ['rfmq', 'segments'],
    queryFn: () => apiClient.get('/rfmq/segments'),
  })
}

export function useRFMQCustomers(segment?: string) {
  return useQuery({
    queryKey: ['rfmq', 'customers', segment],
    queryFn: () => apiClient.get(`/rfmq/customers${segment ? `?segment=${segment}` : ''}`),
  })
}

// Analytics hooks
export function useAnalyticsForecastTrend() {
  return useQuery({
    queryKey: ['analytics', 'forecast-trend'],
    queryFn: () => apiClient.get('/analytics/forecast-trend'),
  })
}

export function useAnalyticsSegmentTrend() {
  return useQuery({
    queryKey: ['analytics', 'segment-trend'],
    queryFn: () => apiClient.get('/analytics/segment-trend'),
  })
}

// Model hooks
export function useActiveModel() {
  return useQuery({
    queryKey: ['models', 'active'],
    queryFn: () => apiClient.get('/models/active'),
  })
}

export function useModelMetrics() {
  return useQuery({
    queryKey: ['models', 'metrics'],
    queryFn: () => apiClient.get('/models/metrics'),
  })
}

export function useTrainingInfo() {
  return useQuery({
    queryKey: ['models', 'training-info'],
    queryFn: () => apiClient.get('/models/training-info'),
  })
}

// Admin hooks
export function useAdminDatasets() {
  return useQuery({
    queryKey: ['admin', 'datasets'],
    queryFn: () => apiClient.get('/admin/datasets'),
  })
}

export function useAdminFeatures() {
  return useQuery({
    queryKey: ['admin', 'features'],
    queryFn: () => apiClient.get('/admin/features'),
  })
}

export function useCreateFeature() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiClient.post('/admin/features', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'features'] })
    },
  })
}

export function useDeleteFeature() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (featureId: string) => apiClient.delete(`/admin/features/${featureId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'features'] })
    },
  })
}
