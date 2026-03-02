import axios from './axiosConfig';
import { Application, Page, PerformanceMetric } from '../types';

export const createApplication = async (appData: { name: string; description?: string }): Promise<Application> => {
  const response = await axios.post('/applications', appData);
  return response.data;
};

export const getApplications = async (): Promise<Application[]> => {
  const response = await axios.get('/applications');
  return response.data;
};

export const getApplicationById = async (appId: string): Promise<Application> => {
  const response = await axios.get(`/applications/${appId}`);
  return response.data;
};

export const updateApplication = async (appId: string, appData: Partial<Application>): Promise<Application> => {
  const response = await axios.put(`/applications/${appId}`, appData);
  return response.data;
};

export const deleteApplication = async (appId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/applications/${appId}`);
  return response.data;
};

export const refreshApiKey = async (appId: string): Promise<Application> => {
  const response = await axios.post(`/applications/${appId}/refresh-api-key`);
  return response.data;
};

// Pages
export const createPage = async (appId: string, pageData: { name: string; pathRegex?: string }): Promise<Page> => {
  const response = await axios.post(`/applications/${appId}/pages`, pageData);
  return response.data;
};

export const getPagesByApplication = async (appId: string): Promise<Page[]> => {
  const response = await axios.get(`/applications/${appId}/pages`);
  return response.data;
};

export const getPageById = async (appId: string, pageId: string): Promise<Page> => {
  const response = await axios.get(`/applications/${appId}/pages/${pageId}`);
  return response.data;
};

export const updatePage = async (appId: string, pageId: string, pageData: Partial<Page>): Promise<Page> => {
  const response = await axios.put(`/applications/${appId}/pages/${pageId}`, pageData);
  return response.data;
};

export const deletePage = async (appId: string, pageId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/applications/${appId}/pages/${pageId}`);
  return response.data;
};

// Performance data snippet (client-side JS) generation (conceptual)
export const getPerformanceSnippet = (appId: string, apiKey: string): string => {
  const backendUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  return `
<!-- PerfMon Performance Tracking Snippet for Application: ${appId} -->
<script>
  (function() {
    const API_ENDPOINT = '${backendUrl}/performance/metrics';
    const API_KEY = '${apiKey}';
    const APP_ID = '${appId}';
    const SESSION_ID = localStorage.getItem('perfmon_session_id') || crypto.randomUUID();
    localStorage.setItem('perfmon_session_id', SESSION_ID);

    function sendMetric(metricType, value, pageName = document.title, url = window.location.href) {
      const data = {
        applicationId: APP_ID,
        metricType: metricType,
        value: value,
        pageName: pageName,
        url: url,
        userSessionId: SESSION_ID,
        browser: navigator.userAgentData?.brands?.[0]?.brand || navigator.appName,
        os: navigator.platform,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        // country: Geolocation API or IP lookup service can be integrated here
        timestamp: new Date().toISOString()
      };

      navigator.sendBeacon(API_ENDPOINT, JSON.stringify({ metrics: [data] }));
      // Use fetch/axios with debounce/batching for more critical metrics or if sendBeacon is insufficient
      // Example for fetch (could be debounced/batched):
      /*
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY
        },
        body: JSON.stringify({ metrics: [data] })
      }).catch(console.error);
      */
    }

    // --- Core Web Vitals ---
    if ('PerformanceObserver' in window) {
      // First Contentful Paint (FCP)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          sendMetric('FCP', entry.startTime);
        }
      }).observe({ type: 'paint', buffered: true });

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          sendMetric('LCP', entry.startTime);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // Cumulative Layout Shift (CLS)
      let cls = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
      window.addEventListener('beforeunload', () => sendMetric('CLS', cls));
      // For more accurate CLS tracking, consider the web-vitals library or more complex logic

      // Interaction to Next Paint (INP) (Experimental)
      // new PerformanceObserver((entryList) => {
      //   for (const entry of entryList.getEntries()) {
      //     sendMetric('INP', entry.duration); // Duration of the interaction
      //   }
      // }).observe({ type: 'event', buffered: true, durationThreshold: 0 }); // Observe all events
    }

    // Time to First Byte (TTFB) - approximated
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        sendMetric('TTFB', navTiming.responseStart - navTiming.requestStart);
      }
    });

    // Example custom metric
    window.PerfMon = {
      sendCustomMetric: (name, value) => {
        sendMetric(name, value);
      }
    };

    // Send initial page load metric
    window.addEventListener('load', () => {
      sendMetric('PageLoadTime', performance.now());
    });
  })();
</script>
<!-- End PerfMon Snippet -->
  `;
};