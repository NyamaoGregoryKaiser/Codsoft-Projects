import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useProjectSummary, useMetricsTimeline, useRecentErrors } from '../hooks/useMetrics';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Card from '../components/common/Card';
import MetricOverviewCard from '../components/charts/MetricOverviewCard';
import MetricChart from '../components/charts/MetricChart';
import Button from '../components/common/Button';
import { MetricPeriod, MetricType } from '../types';
import moment from 'moment';
import { ArrowLeftIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';
import { twMerge } from 'tailwind-merge';

const metricConfigs: { [key in MetricType]?: { title: string; unit: string; color: string; thresholdGood?: number; thresholdPoor?: number } } = {
  LCP: { title: 'Largest Contentful Paint', unit: 'ms', color: '#f97316', thresholdGood: 2500, thresholdPoor: 4000 },
  FID: { title: 'First Input Delay', unit: 'ms', color: '#fde047', thresholdGood: 100, thresholdPoor: 300 },
  CLS: { title: 'Cumulative Layout Shift', unit: '', color: '#16a34a', thresholdGood: 0.1, thresholdPoor: 0.25 },
  API_RESPONSE: { title: 'API Response Time', unit: 'ms', color: '#60a5fa', thresholdGood: 200, thresholdPoor: 500 },
};

const periods: { label: string; value: MetricPeriod }[] = [
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 6 Hours', value: '6h' },
  { label: 'Last 12 Hours', value: '12h' },
  { label: 'Last 24 Hours', value: '1d' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
];

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<MetricPeriod>('1d');
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>('LCP');

  const { project, isLoadingProject, isErrorProject, errorProject } = useProject(projectId || '');
  const { summary, isLoadingSummary } = useProjectSummary(projectId || '', selectedPeriod);
  const { timelineData, isLoadingTimeline } = useMetricsTimeline(projectId || '', selectedMetricType, selectedPeriod);
  const { recentErrors, isLoadingRecentErrors } = useRecentErrors(projectId || '');

  if (isLoadingProject) {
    return <LoadingSpinner className="h-48" />;
  }

  if (isErrorProject) {
    addToast(`Error: ${errorProject?.message}`, 'error');
    navigate('/projects'); // Redirect to projects list if project not found or access denied
    return null;
  }

  if (!project) {
    return <div className="text-danger">Project not found.</div>;
  }

  const handleCopyApiKey = async () => {
    if (project?.apikey) {
      await navigator.clipboard.writeText(project.apikey);
      addToast('API Key copied to clipboard!', 'success');
    }
  };

  const currentMetricConfig = metricConfigs[selectedMetricType];

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-3xl font-bold text-text dark:text-dark-text">{project.name}</h1>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-md max-w-full overflow-x-auto text-sm font-mono text-gray-700 dark:text-gray-300">
          API Key: <span className="flex-shrink-0">{project.apikey}</span>
          <Button size="sm" variant="text" onClick={handleCopyApiKey} title="Copy API Key">
            <ClipboardDocumentIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex space-x-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={selectedPeriod === p.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-text dark:text-dark-text mb-4">Summary Metrics</h2>
        {isLoadingSummary ? (
          <LoadingSpinner className="h-32" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summary && (
              <>
                <MetricOverviewCard
                  title="LCP Avg"
                  metric={summary.LCP}
                  unit="ms"
                  thresholdGood={metricConfigs.LCP?.thresholdGood}
                  thresholdPoor={metricConfigs.LCP?.thresholdPoor}
                />
                <MetricOverviewCard
                  title="FID Avg"
                  metric={summary.FID}
                  unit="ms"
                  thresholdGood={metricConfigs.FID?.thresholdGood}
                  thresholdPoor={metricConfigs.FID?.thresholdPoor}
                />
                <MetricOverviewCard
                  title="CLS Avg"
                  metric={summary.CLS}
                  unit=""
                  thresholdGood={metricConfigs.CLS?.thresholdGood}
                  thresholdPoor={metricConfigs.CLS?.thresholdPoor}
                />
                <MetricOverviewCard
                  title="Total Errors"
                  metric={{ avg: summary.totalErrors, min: summary.totalErrors, max: summary.totalErrors, count: summary.totalErrors }}
                  unit=""
                />
              </>
            )}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-text dark:text-dark-text mb-4">Metric Timeline</h2>
        <div className="mb-4 flex space-x-2">
          {Object.entries(metricConfigs).map(([type, config]) => (
            <Button
              key={type}
              variant={selectedMetricType === type ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetricType(type as MetricType)}
            >
              {config?.title}
            </Button>
          ))}
        </div>
        {isLoadingTimeline ? (
          <LoadingSpinner className="h-80" />
        ) : (
          <MetricChart
            title={`${currentMetricConfig?.title || selectedMetricType} over time`}
            data={timelineData || []}
            dataKey="value"
            unit={currentMetricConfig?.unit}
            color={currentMetricConfig?.color}
          />
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text dark:text-dark-text mb-4">Recent Errors</h2>
        {isLoadingRecentErrors ? (
          <LoadingSpinner className="h-32" />
        ) : recentErrors && recentErrors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentErrors.map((error) => (
              <Card key={error.id} className="relative overflow-hidden group">
                <p className="text-red-600 dark:text-red-400 font-semibold text-lg mb-2">{error.context.message}</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1 break-all">URL: {error.context.url}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {moment(error.timestamp).fromNow()} ({moment(error.timestamp).format('MMM Do, HH:mm:ss')})
                </p>
                {error.context.stack && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-95 text-white p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{error.context.stack}</pre>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-500 dark:text-gray-400">No recent errors for this project.</p>
          </Card>
        )}
      </section>
    </div>
  );
};

export default ProjectDetailPage;
```

```