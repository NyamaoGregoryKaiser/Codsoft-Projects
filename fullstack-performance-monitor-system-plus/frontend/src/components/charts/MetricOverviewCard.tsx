import React from 'react';
import Card from '../common/Card';
import { MetricSummary } from '../../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusSmallIcon } from '@heroicons/react/24/solid';

interface MetricOverviewCardProps {
  title: string;
  metric: MetricSummary;
  unit?: string; // e.g., 'ms', '%'
  thresholdGood?: number; // Value below which is considered good
  thresholdPoor?: number; // Value above which is considered poor
  trend?: 'up' | 'down' | 'neutral'; // Optional trend indicator
}

const MetricOverviewCard: React.FC<MetricOverviewCardProps> = ({
  title,
  metric,
  unit = '',
  thresholdGood,
  thresholdPoor,
  trend,
}) => {
  const avgValue = metric.avg !== null ? metric.avg : 'N/A';

  const getStatusColor = (value: number | string) => {
    if (typeof value !== 'number') return 'text-gray-500';
    if (thresholdGood !== undefined && value <= thresholdGood) return 'text-success'; // Lower is better
    if (thresholdPoor !== undefined && value >= thresholdPoor) return 'text-danger'; // Higher is worse
    return 'text-accent'; // Warning/neutral
  };

  const renderTrendIcon = () => {
    if (trend === 'up') return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />;
    if (trend === 'down') return <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />;
    return <MinusSmallIcon className="h-5 w-5 text-gray-400" />;
  };

  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-text dark:text-dark-text">{title}</h3>
        {trend && renderTrendIcon()}
      </div>
      <div className="mt-4">
        <p className={
          `text-4xl font-bold ${typeof avgValue === 'number' ? getStatusColor(avgValue) : 'text-gray-500 dark:text-gray-400'}`
        }>
          {typeof avgValue === 'number' ? `${avgValue.toFixed(unit === '%' ? 1 : 0)}${unit}` : avgValue}
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex flex-wrap gap-x-4">
          {typeof metric.min === 'number' && <span>Min: {metric.min.toFixed(unit === '%' ? 1 : 0)}{unit}</span>}
          {typeof metric.max === 'number' && <span>Max: {metric.max.toFixed(unit === '%' ? 1 : 0)}{unit}</span>}
          <span>Count: {metric.count}</span>
        </div>
      </div>
    </Card>
  );
};

export default MetricOverviewCard;
```

```