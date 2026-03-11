import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store/store';
import { fetchDashboardById, updateDashboard, addVisualizationToDashboard, updateVisualizationInDashboard, removeVisualizationFromDashboard, updateVisualizationLayout } from '../store/dashboardSlice';
import { fetchDataSources } from '../store/dataSourceSlice';
import { DataQueryResponse, DataSource, LayoutItem, Visualization } from '../types';
import { toast } from 'react-toastify';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ChartWrapper from '../components/ChartWrapper';
import { getVisualizationDataApi } from '../api/visualizations.api';

// Grid layout component
const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { selectedDashboard, loading, error } = useSelector((state: RootState) => state.dashboards);
  const { dataSources } = useSelector((state: RootState) => state.dataSources);
  const { user } = useSelector((state: RootState) => state.auth);

  const [editTitle, setEditTitle] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');

  const [isAddingVisualization, setIsAddingVisualization] = useState(false);
  const [newVizTitle, setNewVizTitle] = useState('');
  const [newVizType, setNewVizType] = useState('BAR_CHART');
  const [newVizDataSourceId, setNewVizDataSourceId] = useState<number | ''>('');
  const [newVizQuery, setNewVizQuery] = useState('');
  const [newVizConfig, setNewVizConfig] = useState('{}'); // JSON string for chart config

  const [editingViz, setEditingViz] = useState<Visualization | null>(null);
  const [vizDataCache, setVizDataCache] = useState<Record<number, DataQueryResponse>>({});

  useEffect(() => {
    if (id) {
      dispatch(fetchDashboardById(Number(id)));
      dispatch(fetchDataSources()); // Fetch data sources for new visualizations
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (selectedDashboard) {
      setDashboardTitle(selectedDashboard.title);
      setDashboardDescription(selectedDashboard.description || '');
      // Fetch data for all visualizations
      selectedDashboard.visualizations.forEach(viz => fetchVisualizationData(viz.id!));
    }
  }, [selectedDashboard, id]); // Re-fetch data if dashboard changes

  const fetchVisualizationData = useCallback(async (vizId: number) => {
    try {
      const response = await getVisualizationDataApi(vizId);
      if (response.data.success) {
        setVizDataCache(prev => ({ ...prev, [vizId]: response.data }));
      } else {
        toast.error(`Failed to load data for visualization ${vizId}: ${response.data.message}`);
      }
    } catch (err: any) {
      toast.error(`Error fetching data for visualization ${vizId}: ${err.response?.data?.message || err.message}`);
    }
  }, []);

  const handleUpdateDashboardTitle = async () => {
    if (!selectedDashboard || !user?.id) return;
    if (dashboardTitle.trim() === '') {
      toast.error('Dashboard title cannot be empty.');
      return;
    }
    try {
      const result = await dispatch(updateDashboard({
        id: selectedDashboard.id!,
        updatedFields: { title: dashboardTitle, description: dashboardDescription, ownerId: user.id },
      }));
      if (updateDashboard.fulfilled.match(result)) {
        toast.success('Dashboard updated successfully!');
        setEditTitle(false);
      } else {
        toast.error(`Failed to update dashboard: ${result.payload}`);
      }
    } catch (err) {
      toast.error('An unexpected error occurred while updating dashboard.');
      console.error(err);
    }
  };

  const handleAddVisualization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDashboard || !user?.id || !newVizDataSourceId) {
      toast.error('Missing required fields for visualization.');
      return;
    }

    try {
      // Basic validation for JSON config
      try {
        JSON.parse(newVizConfig);
      } catch (err) {
        toast.error('Invalid JSON in chart configuration.');
        return;
      }

      const result = await dispatch(addVisualizationToDashboard({
        title: newVizTitle,
        description: '',
        type: newVizType,
        dataSourceId: Number(newVizDataSourceId),
        query: newVizQuery,
        config: newVizConfig,
        position: selectedDashboard.visualizations.length + 1, // Simple position increment
        sizeX: 4, // Default width
        sizeY: 3, // Default height
        dashboardId: selectedDashboard.id!,
        ownerId: user.id,
      }));
      if (addVisualizationToDashboard.fulfilled.match(result)) {
        toast.success(`Visualization "${newVizTitle}" added!`);
        setIsAddingVisualization(false);
        setNewVizTitle('');
        setNewVizType('BAR_CHART');
        setNewVizDataSourceId('');
        setNewVizQuery('');
        setNewVizConfig('{}');
        fetchVisualizationData(result.payload.id!); // Fetch data for the new visualization
      } else {
        toast.error(`Failed to add visualization: ${result.payload}`);
      }
    } catch (err) {
      toast.error('An unexpected error occurred while adding visualization.');
      console.error(err);
    }
  };

  const handleEditVisualization = (viz: Visualization) => {
    setEditingViz(viz);
    setNewVizTitle(viz.title);
    setNewVizType(viz.type);
    setNewVizDataSourceId(viz.dataSourceId);
    setNewVizQuery(viz.query);
    setNewVizConfig(viz.config);
  };

  const handleUpdateVisualization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingViz || !user?.id || !newVizDataSourceId) {
      toast.error('Missing required fields for visualization update.');
      return;
    }
    try {
      JSON.parse(newVizConfig);
    } catch (err) {
      toast.error('Invalid JSON in chart configuration.');
      return;
    }

    const updatedViz: Partial<Visualization> = {
      title: newVizTitle,
      type: newVizType,
      dataSourceId: Number(newVizDataSourceId),
      query: newVizQuery,
      config: newVizConfig,
      ownerId: user.id, // Ensure ownerId is carried over, or implicitly handled by backend
      dashboardId: editingViz.dashboardId // Ensure dashboardId is carried over
    };

    try {
      const result = await dispatch(updateVisualizationInDashboard({ vizId: editingViz.id!, updatedFields: updatedViz }));
      if (updateVisualizationInDashboard.fulfilled.match(result)) {
        toast.success(`Visualization "${newVizTitle}" updated!`);
        setEditingViz(null); // Exit edit mode
        setNewVizTitle('');
        setNewVizType('BAR_CHART');
        setNewVizDataSourceId('');
        setNewVizQuery('');
        setNewVizConfig('{}');
        fetchVisualizationData(result.payload.id!); // Re-fetch data for the updated visualization
      } else {
        toast.error(`Failed to update visualization: ${result.payload}`);
      }
    } catch (err) {
      toast.error('An unexpected error occurred while updating visualization.');
      console.error(err);
    }
  };

  const handleRemoveVisualization = async (vizId: number, vizTitle: string) => {
    if (!selectedDashboard) return;
    if (window.confirm(`Are you sure you want to remove visualization "${vizTitle}"?`)) {
      try {
        const result = await dispatch(removeVisualizationFromDashboard(vizId));
        if (removeVisualizationFromDashboard.fulfilled.match(result)) {
          toast.success(`Visualization "${vizTitle}" removed.`);
          // Remove from cache
          setVizDataCache(prev => {
            const newCache = { ...prev };
            delete newCache[vizId];
            return newCache;
          });
        } else {
          toast.error(`Failed to remove visualization: ${result.payload}`);
        }
      } catch (err) {
        toast.error('An unexpected error occurred while removing visualization.');
        console.error(err);
      }
    }
  };

  const onLayoutChange = (layout: LayoutItem[]) => {
    if (!selectedDashboard) return;

    // Dispatch updates for position and size to backend
    layout.forEach(layoutItem => {
        const viz = selectedDashboard.visualizations.find(v => v.id === Number(layoutItem.i));
        if (viz && (viz.position !== layoutItem.x || viz.sizeX !== layoutItem.w || viz.sizeY !== layoutItem.h)) {
            dispatch(updateVisualizationInDashboard({
                vizId: Number(layoutItem.i),
                updatedFields: {
                    position: layoutItem.x, // Assuming position means x-coordinate for simplicity
                    sizeX: layoutItem.w,
                    sizeY: layoutItem.h,
                    dashboardId: viz.dashboardId, // Retain critical IDs
                    dataSourceId: viz.dataSourceId,
                    ownerId: viz.ownerId,
                }
            }));
            // Also update local state for immediate visual feedback
            dispatch(updateVisualizationLayout({ vizId: Number(layoutItem.i), x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }));
        }
    });
  };

  if (loading) return <div className="text-center mt-8">Loading dashboard...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  if (!selectedDashboard) return <div className="text-center mt-8">Dashboard not found.</div>;

  const layout: LayoutItem[] = selectedDashboard.visualizations.map(viz => ({
    i: viz.id!.toString(),
    x: viz.position, // We used position for x, you might need a proper x,y for grid
    y: viz.position, // Placeholder, needs actual Y in real implementation
    w: viz.sizeX,
    h: viz.sizeY,
    minW: 2, minH: 2 // Minimum size for charts
  }));

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        {editTitle ? (
          <div className="flex-grow flex items-center space-x-2">
            <input
              type="text"
              className="text-3xl font-bold border-b border-gray-300 focus:outline-none focus:border-blue-500"
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
            />
            <button onClick={handleUpdateDashboardTitle} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm">Save</button>
            <button onClick={() => { setEditTitle(false); setDashboardTitle(selectedDashboard.title); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-md text-sm">Cancel</button>
          </div>
        ) : (
          <h1 className="text-3xl font-bold flex items-center">
            {selectedDashboard.title}
            <button onClick={() => setEditTitle(true)} className="ml-3 text-blue-500 hover:text-blue-700 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-1.75 2.121l-7.742 7.742a2 2 0 00-.594.894l-1.383 4.15a.5.5 0 00.627.627l4.15-1.383a2 2 0 00.894-.594l7.742-7.742-2.828-2.828z" />
              </svg>
            </button>
          </h1>
        )}
        <button
          onClick={() => setIsAddingVisualization(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-lg"
        >
          Add Visualization
        </button>
      </div>
      <p className="text-gray-600 mb-6">{selectedDashboard.description || 'No description provided.'}</p>

      {isAddingVisualization && (
        <div className="bg-gray-100 p-6 rounded-lg shadow-inner mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{editingViz ? `Edit Visualization: ${editingViz.title}` : 'Add New Visualization'}</h2>
          <form onSubmit={editingViz ? handleUpdateVisualization : handleAddVisualization} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vizTitle" className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" id="vizTitle" value={newVizTitle} onChange={(e) => setNewVizTitle(e.target.value)}
                     className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="vizType" className="block text-sm font-medium text-gray-700">Chart Type</label>
              <select id="vizType" value={newVizType} onChange={(e) => setNewVizType(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option value="BAR_CHART">Bar Chart</option>
                <option value="LINE_CHART">Line Chart</option>
                <option value="PIE_CHART">Pie Chart</option>
                <option value="TABLE">Table</option>
              </select>
            </div>
            <div>
              <label htmlFor="vizDataSource" className="block text-sm font-medium text-gray-700">Data Source</label>
              <select id="vizDataSource" value={newVizDataSourceId} onChange={(e) => setNewVizDataSourceId(Number(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
                <option value="">Select a Data Source</option>
                {dataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vizQuery" className="block text-sm font-medium text-gray-700">Query (SQL or API Path)</label>
              <textarea id="vizQuery" value={newVizQuery} onChange={(e) => setNewVizQuery(e.target.value)}
                        rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required></textarea>
            </div>
            <div className="col-span-full">
              <label htmlFor="vizConfig" className="block text-sm font-medium text-gray-700">Chart Configuration (JSON)</label>
              <textarea id="vizConfig" value={newVizConfig} onChange={(e) => setNewVizConfig(e.target.value)}
                        rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-xs"></textarea>
              <p className="text-xs text-gray-500 mt-1">e.g., {"{ \"keys\": [\"value\"], \"indexBy\": \"category\" }"}</p>
            </div>
            <div className="col-span-full flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setIsAddingVisualization(false); setEditingViz(null); }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md shadow"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow"
              >
                {editingViz ? 'Update Visualization' : 'Add Visualization'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedDashboard.visualizations.length === 0 ? (
        <p className="text-center text-gray-600 mt-10">No visualizations on this dashboard yet. Add one!</p>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100} // Base height for a grid row
          onLayoutChange={onLayoutChange}
          containerPadding={[10, 10]}
          itemMargin={[10, 10]}
          draggableHandle=".drag-handle"
        >
          {selectedDashboard.visualizations.map((viz) => (
            <div key={viz.id!.toString()} className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 relative">
              <div className="drag-handle absolute top-0 left-0 p-1 cursor-grab bg-gray-200 rounded-br-lg text-gray-600 text-xs">☰</div>
              <h3 className="text-lg font-semibold mb-2 ml-6">{viz.title}</h3>
              <div className="flex justify-end space-x-2 absolute top-2 right-2">
                <button
                  onClick={() => { handleEditVisualization(viz); setIsAddingVisualization(true); }}
                  className="text-blue-500 hover:text-blue-700 text-sm p-1"
                  title="Edit Visualization"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-1.75 2.121l-7.742 7.742a2 2 0 00-.594.894l-1.383 4.15a.5.5 0 00.627.627l4.15-1.383a2 2 0 00.894-.594l7.742-7.742-2.828-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemoveVisualization(viz.id!, viz.title)}
                  className="text-red-500 hover:text-red-700 text-sm p-1"
                  title="Remove Visualization"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="mt-8 h-[calc(100%-4rem)]"> {/* Adjust height for chart content */}
                 <ChartWrapper visualization={viz} data={vizDataCache[viz.id!]?.data || []} />
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
};

export default DashboardEditorPage;