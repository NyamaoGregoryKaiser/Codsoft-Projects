```typescript jsx
import React, { useEffect, useState } from 'react';
import { getMetricsForService, MetricResponseDTO, Service } from '../api/api';
import MetricChart from '../components/MetricChart';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricResponseDTO[]>([]);
  const [services, setServices] = useState<Service[]>([]); // Assuming we fetch this somewhere, or get from prop
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // In a real app, `services` would be fetched from the backend (e.g., using `getAllServices`)
  // For this demo, let's use a dummy or assume it's loaded from context/prop.
  // For now, hardcode a service ID for testing purposes (e.g., first service in db/init.sql)
  useEffect(() => {
    // In a real app, you'd fetch all services first, then allow user to select.
    // For demo simplicity, let's assume service ID 1 exists or fetch services here.
    const fetchServicesAndSetDefault = async () => {
        try {
            // This call would actually be to getAllServices, but let's simulate for now
            // For the demo, we assume service ID 1 is the default "WebApp Service 1"
            // For production: fetch all services using getAllServices, then set `selectedServiceId` to the first one or a user preference.
            // const fetchedServices = await getAllServices();
            // if (fetchedServices.length > 0) {
            //     setServices(fetchedServices);
            //     setSelectedServiceId(fetchedServices[0].id);
            // }
            setServices([{ id: 1, name: "WebApp Service 1", description: "Main customer-facing web application backend." }]);
            setSelectedServiceId(1); // Set a default for initial load
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to fetch services.");
            setLoading(false);
        }
    }
    fetchServicesAndSetDefault();
  }, []);


  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedServiceId) return;

      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // Metrics from the last hour

        const fetchedMetrics = await getMetricsForService(selectedServiceId, {
          start_time: oneHourAgo.toISOString().slice(0, -5) + 'Z', // YYYY-MM-DDTHH:MM:SSZ
          end_time: now.toISOString().slice(0, -5) + 'Z',
          limit: 200, // Fetch up to 200 metrics
        });
        setMetrics(fetchedMetrics);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [selectedServiceId]);

  if (loading && !metrics.length) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (error) {
    return <div className="app-alert app-alert-error">{error}</div>;
  }

  const availableMetricTypes = Array.from(new Set(metrics.map(m => m.metric_type)));

  return (
    <main>
      <div className="flex-container">
        <h2>PerfoMetrics Dashboard</h2>
        {services.length > 0 && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="service-select">Select Service:</label>
            <select
              id="service-select"
              value={selectedServiceId || ''}
              onChange={(e) => setSelectedServiceId(Number(e.target.value))}
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedServiceId ? (
        <div className="grid-container">
          {availableMetricTypes.map(type => (
            <MetricChart
              key={type}
              title={`${type.replace(/_/g, ' ')} for Service ${selectedServiceId}`}
              metrics={metrics}
              metricType={type}
            />
          ))}
        </div>
      ) : (
        <p className="app-alert app-alert-info">No services available or selected. Please add a service first.</p>
      )}

    </main>
  );
};

export default Dashboard;
```