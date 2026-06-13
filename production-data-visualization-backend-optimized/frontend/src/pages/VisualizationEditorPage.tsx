```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import ChartRenderer from '../components/ChartRenderer';
import { DataSource } from '../types/DataSource';
import { Visualization, ChartType, VisualizationConfig } from '../types/Visualization';
import './VisualizationEditorPage.css';

const CHART_COLORS = {
  defaultBar: 'rgba(75, 192, 192, 0.6)',
  defaultLine: 'rgba(153, 102, 255, 0.6)',
  defaultPie: [
    'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(120, 180, 100, 0.6)',
    'rgba(200, 50, 200, 0.6)'
  ],
  defaultBorder: {
    defaultBar: 'rgba(75, 192, 192, 1)',
    defaultLine: 'rgba(153, 102, 255, 1)',
    defaultPie: [
      'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
      'rgba(199, 199, 199, 1)', 'rgba(83, 102, 255, 1)', 'rgba(120, 180, 100, 1)',
      'rgba(200, 50, 200, 1)'
    ]
  }
};


const VisualizationEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>(); // Visualization ID for editing
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [dataSourceData, setDataSourceData] = useState<any[]>([]);

  const [vizName, setVizName] = useState('');
  const [chartType, setChartType] = useState<ChartType>(ChartType.Bar);
  const [config, setConfig] = useState<VisualizationConfig>({});

  const isEditing = !!id;

  // Helper to apply default colors based on chart type
  const applyDefaultColors = useCallback((type: ChartType, currentConfig: VisualizationConfig) => {
    let newConfig = { ...currentConfig };
    if (!currentConfig.backgroundColor) {
      if (type === ChartType.Bar || type === ChartType.Scatter) newConfig.backgroundColor = CHART_COLORS.defaultBar;
      else if (type === ChartType.Line) newConfig.backgroundColor = CHART_COLORS.defaultLine;
      else if (type === ChartType.Pie) newConfig.backgroundColor = CHART_COLORS.defaultPie;
    }
    if (!currentConfig.borderColor) {
      if (type === ChartType.Bar || type === ChartType.Scatter) newConfig.borderColor = CHART_COLORS.defaultBorder.defaultBar;
      else if (type === ChartType.Line) newConfig.borderColor = CHART_COLORS.defaultBorder.defaultLine;
      else if (type === ChartType.Pie) newConfig.borderColor = CHART_COLORS.defaultBorder.defaultPie;
    }
    return newConfig;
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dsResponse = await api.get('/data-sources');
        setDataSources(dsResponse.data);

        if (isEditing && id) {
          const vizResponse = await api.get<Visualization>(`/visualizations/${id}`);
          const fetchedViz = vizResponse.data;
          setVizName(fetchedViz.name);
          setChartType(fetchedViz.chart_type);
          setConfig(fetchedViz.config as VisualizationConfig);

          const matchedDataSource = dsResponse.data.find((ds: DataSource) => ds.id === fetchedViz.data_source_id);
          if (matchedDataSource) {
            setSelectedDataSource(matchedDataSource);
            const dataResponse = await api.get(`/data-sources/${matchedDataSource.id}/data`);
            setDataSourceData(dataResponse.data);
          } else {
            setError('Associated data source not found.');
          }
        } else if (dsResponse.data.length > 0) {
          // For new visualization, auto-select first data source if available
          const firstDs = dsResponse.data[0];
          setSelectedDataSource(firstDs);
          const dataResponse = await api.get(`/data-sources/${firstDs.id}/data`);
          setDataSourceData(dataResponse.data);
          // Apply default colors on initial load for new viz
          setConfig(prevConfig => applyDefaultColors(chartType, prevConfig));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load editor data.');
        console.error('Editor fetch error:', err.response?.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing, applyDefaultColors, chartType]);

  // Handle data source selection change
  useEffect(() => {
    const loadDataSourceData = async () => {
      if (selectedDataSource) {
        try {
          const response = await api.get(`/data-sources/${selectedDataSource.id}/data`);
          setDataSourceData(response.data);
          // Reset config when data source changes, but keep name/type if editing
          if (!isEditing) {
             setConfig(applyDefaultColors(chartType, {}));
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load data for selected source.');
          setDataSourceData([]);
          console.error('Data source data load error:', err.response?.data);
        }
      } else {
        setDataSourceData([]);
      }
    };
    loadDataSourceData();
  }, [selectedDataSource, isEditing, chartType, applyDefaultColors]);


  // Update config when chart type changes
  useEffect(() => {
    setConfig(prevConfig => {
      let newConfig = { ...prevConfig, title: vizName || prevConfig.title }; // Update title
      if (!isEditing) {
        // Only reset specific fields if not editing
        newConfig = { ...newConfig, x_axis: undefined, y_axis: undefined, label_column: undefined, data_column: undefined };
      }
      return applyDefaultColors(chartType, newConfig);
    });
  }, [chartType, vizName, isEditing, applyDefaultColors]);


  const handleConfigChange = (key: keyof