import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getApplicationById,
  getPerformanceSnippet,
  refreshApiKey,
  createPage,
  getPagesByApplication,
  deletePage
} from '../../api/applications';
import { getApplicationOverview, getMetricTrends } from '../../api/reports';
import { Application, Page, ApplicationOverview, MetricTrendData } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LineChart from '../../components/charts/LineChart';
import { ClipboardDocumentIcon, PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'; // Icons

const ApplicationDetails: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [overview, setOverview] = useState<ApplicationOverview | null>(null);
  const [lcpTrends, setLcpTrends] = useState<MetricTrendData[]>([]);
  const [fcpTrends, setFcpTrends] = useState<MetricTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPagePathRegex, setNewPagePathRegex] = useState('');
  const [addPageLoading, setAddPageLoading] = useState(false);
  const [addPageError, setAddPageError] = useState<string | null>(null);

  const fetchApplicationData = async () => {
    if (!appId) return;
    setLoading(true);
    setError(null);
    try {
      const appData = await getApplicationById(appId);
      setApplication(appData);
      const pagesData = await getPagesByApplication(appId);
      setPages(pagesData);
      const overviewData = await getApplicationOverview(appId);
      setOverview(overviewData);
      const lcpTrendData = await getMetricTrends(appId, 'LCP');
      setLcpTrends(lcpTrendData);
      const fcpTrendData = await getMetricTrends(appId, 'FCP');
      setFcpTrends(fcpTrendData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch application details');
      console.error('Fetch application details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationData();
  }, [appId]);

  const handleCopySnippet = () => {
    if (application?.apiKey) {
      const snippet = getPerformanceSnippet(application.id, application.apiKey);
      navigator.clipboard.writeText(snippet);
      alert('Performance snippet copied to clipboard!');
    }
  };

  const handleRefreshApiKey = async () => {
    if (!appId || !window.confirm('Are you sure you want to refresh the API key? The old key will stop working immediately.')) return;
    try {
      setLoading(true);
      const updatedApp = await refreshApiKey(appId);
      setApplication(updatedApp);
      alert('API Key refreshed successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh API key');
      console.error('Refresh API key error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;
    setAddPageError(null);
    setAddPageLoading(true);
    try {
      const newPage = await createPage(appId, { name: newPageName, pathRegex: newPagePathRegex || undefined });
      setPages([...pages, newPage]);
      setShowAddPageModal(false);
      setNewPageName('');
      setNewPagePathRegex('');
      alert(`Page "${newPage.name}" created!`);
    } catch (err: any) {
      setAddPageError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create page');
      console.error('Create page error:', err);
    } finally {
      setAddPageLoading(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!appId || !window.confirm('Are you sure you want to delete this page and all its associated metrics?')) return;
    try {
      await deletePage(appId, pageId);
      setPages(pages.filter(page => page.id !== pageId));
      alert('Page deleted successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete page');
      console.error('Delete page error:', err);
    }
  };


  if (loading) return <div className="text-center py-8">Loading application details...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!application) return <div className="text-center py-8">Application not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{application.name}</h1>
      <p className="text-gray-600 mb-4">{application.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Overview (Last {overview?.periodDays || 7} Days)</h2>
          <p>Total Metrics: <span className="font-semibold">{overview?.totalMetrics || 0}</span></p>
          <p>Avg. LCP: <span className="font-semibold">{overview?.avgLCP ? overview.avgLCP.toFixed(2) + ' ms' : 'N/A'}</span></p>
          <p>Avg. FCP: <span className="font-semibold">{overview?.avgFCP ? overview.avgFCP.toFixed(2) + ' ms' : 'N/A'}</span></p>
          <p>Monitored Pages: <span className="font-semibold">{overview?.pageCount || 0}</span></p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-3">API Key & Snippet</h2>
            <p className="text-gray-700 text-sm mb-2">
              <strong>API Key:</strong> <span className="font-mono bg-gray-100 p-1 rounded text-xs break-all">{application.apiKey}</span>
            </p>
            <p className="text-gray-600 text-sm">Use this key in your client-side applications.</p>
          </div>
          <div className="flex flex-col space-y-2 mt-4">
            <Button variant="secondary" onClick={() => setShowSnippetModal(true)}>
              <ClipboardDocumentIcon className="h-5 w-5 mr-2 inline-block" /> View & Copy Snippet
            </Button>
            <Button variant="danger" size="sm" onClick={handleRefreshApiKey}>
              <ArrowPathIcon className="h-4 w-4 mr-2 inline-block" /> Refresh API Key
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChart data={lcpTrends} dataKey="averageValue" xDataKey="date" title="LCP Trend (30 Days)" yAxisLabel="Milliseconds" />
        <LineChart data={fcpTrends} dataKey="averageValue" xDataKey="date" title="FCP Trend (30 Days)" yAxisLabel="Milliseconds" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Monitored Pages</h2>
          <Button onClick={() => setShowAddPageModal(true)} variant="primary" size="sm">
            <PlusIcon className="h-4 w-4 mr-2 inline-block" /> Add Page
          </Button>
        </div>
        {pages.length === 0 ? (
          <p className="text-gray-600">No pages defined for this application yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => (
              <li key={page.id} className="py-3 flex justify-between items-center">
                <div>
                  <Link to={`/applications/${appId}/pages/${page.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                    {page.name}
                  </Link>
                  <p className="text-sm text-gray-500">{page.pathRegex || 'N/A'}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDeletePage(page.id)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={showSnippetModal} onClose={() => setShowSnippetModal(false)} title="Performance Tracking Snippet">
        <p className="text-sm text-gray-700 mb-4">
          Copy this JavaScript snippet and paste it just before the closing `&lt;/head&gt;` tag of your web application.
        </p>
        <pre className="bg-gray-100 p-4 rounded-md text-xs whitespace-pre-wrap break-all">
          <code>{application && getPerformanceSnippet(application.id, application.apiKey)}</code>
        </pre>
        <div className="flex justify-end mt-4">
          <Button variant="primary" onClick={handleCopySnippet}>
            <ClipboardDocumentIcon className="h-5 w-5 mr-2 inline-block" /> Copy Snippet
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showAddPageModal} onClose={() => setShowAddPageModal(false)} title="Add New Page">
        <form onSubmit={handleCreatePage}>
          {addPageError && <p className="text-red-500 text-sm mb-4">{addPageError}</p>}
          <Input
            id="pageName"
            label="Page Name"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            required
            placeholder="Homepage"
          />
          <Input
            id="pagePathRegex"
            label="Path Regex (e.g., /users/:id, /)"
            value={newPagePathRegex}
            onChange={(e) => setNewPagePathRegex(e.target.value)}
            placeholder="/products/.*"
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="secondary" onClick={() => setShowAddPageModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={addPageLoading}>
              {addPageLoading ? 'Creating...' : 'Create Page'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApplicationDetails;