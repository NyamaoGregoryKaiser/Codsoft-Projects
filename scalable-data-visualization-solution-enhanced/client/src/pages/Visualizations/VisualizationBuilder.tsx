```typescript
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Paper, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Divider, Switch, FormControlLabel
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  visualizationApi, datasetApi, Visualization, Dataset, ChartType, ChartConfig
} from 'api/api';
import LoadingSpinner from 'components/common/LoadingSpinner';
import ChartRenderer from 'components/charts/ChartRenderer';

// Helper to generate a random hex color
const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

const VisualizationBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // visualization ID
  const navigate = useNavigate();

  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [datasetData, setDatasetData] = useState<any[]>([]); // Parsed raw data from selected dataset

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState<ChartType>(ChartType.BAR);
  const [config, setConfig] = useState<ChartConfig>({
    labelsField: '',
    dataField: '',
    title: '',
    backgroundColor: getRandomColor(),
    borderColor: '#000000',
    borderWidth: 1,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [chartPreviewData, setChartPreviewData] = useState<any | null>(null); // Data for ChartRenderer


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPreviewError(null);

      const datasetsRes = await datasetApi.getDatasets();
      setDatasets(datasetsRes.data);

      if (id === 'new') {
        setVisualization(null);
        setName('');
        setDescription('');
        setChartType(ChartType.BAR);
        setConfig({
          labelsField: '',
          dataField: '',
          title: '',
          backgroundColor: getRandomColor(),
          borderColor: '#000000',
          borderWidth: 1,
        });
        setSelectedDatasetId(datasetsRes.data.length > 0 ? datasetsRes.data[0].id : '');
      } else {
        const vizRes = await visualizationApi.getVisualizationById(id!);
        setVisualization(vizRes.data);
        setName(vizRes.data.name);
        setDescription(vizRes.data.description || '');
        setChartType(vizRes.data.chartType);
        setConfig(vizRes.data.config);
        setSelectedDatasetId(vizRes.data.datasetId || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch initial data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch dataset data when selectedDatasetId changes
  useEffect(() => {
    const fetchDatasetRawData = async () => {
      if (selectedDatasetId) {
        try {
          const res = await datasetApi.getDatasetData(selectedDatasetId);
          setDatasetData(res.data);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch dataset raw data.');
          setDatasetData([]);
        }
      } else {
        setDatasetData([]);
      }
    };
    fetchDatasetRawData();
  }, [selectedDatasetId]);


  // Helper to get available fields from datasetData
  const availableFields = useMemo(() => {
    if (datasetData.length === 0) return [];
    return Object.keys(datasetData[0]);
  }, [datasetData]);

  // Handle config changes
  const handleConfigChange = useCallback((field: keyof ChartConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update chart preview data whenever config or dataset data changes
  useEffect(() => {
    const updatePreview = async () => {
      setPreviewError(null);
      if (!selectedDatasetId || !config.labelsField || !config.dataField || datasetData.length === 0) {
        setChartPreviewData(null);
        return;
      }

      try {
        // Mock a visualization object to pass to processDataForChart
        const mockViz: Visualization = {
          id: 'preview',
          name: name || 'Preview Chart',
          description: description,
          chartType: chartType,
          config: config,
          userId: '', // Not needed for data processing
          datasetId: selectedDatasetId,
          dataset: {
            id: selectedDatasetId,
            name: datasets.find(d => d.id === selectedDatasetId)?.name || '',
            fileType: datasets.find(d => d.id === selectedDatasetId)?.fileType || ChartType.CSV, // Default to CSV
            data: '', // Actual data is in datasetData, not needed here
            userId: '',
            createdAt: '',
            updatedAt: '',
          }
        };
        const processedData = await visualizationApi.getVisualizationData(mockViz.id, {
            params: {
                datasetData: JSON.stringify(datasetData),
                mockVizConfig: JSON.stringify(config),
                mockChartType: chartType,
                mockDatasetType: datasets.find(d => d.id === selectedDatasetId)?.fileType || ChartType.CSV
            }
        } as any); // Temporarily bypass type for this mock call
        // In a real scenario, client-side chart generation functions would be used here.
        // For this full-stack example, we're simulating the backend processing for simplicity.
        // A direct client-side parsing/processing function for Chart.js would be more efficient for preview.
        // For current setup, we'll manually process data for preview.

        const labels = datasetData.map(item => item[config.labelsField]);
        const dataValues = datasetData.map(item => parseFloat(item[config.dataField]));

        if (labels.some(label => label === undefined) || dataValues.some(val => isNaN(val))) {
          throw new Error('Selected labels field or data field contains missing/invalid data.');
        }

        const defaultColors = ['#42a5f5', '#66bb6a', '#ef5350', '#ffeb3b', '#ab47bc', '#78909c'];
        const resolvedBackgroundColor = config.backgroundColor || (chartType === ChartType.PIE || chartType === ChartType.DOUGHNUT
          ? labels.map((_: any, i: number) => defaultColors[i % defaultColors.length])
          : defaultColors[0]);

        const resolvedBorderColor = config.borderColor || (Array.isArray(resolvedBackgroundColor) ? resolvedBackgroundColor.map(color => color.replace('0.2', '1')) : (typeof resolvedBackgroundColor === 'string' ? resolvedBackgroundColor.replace('0.2', '1') : defaultColors[0]));


        setChartPreviewData({
          labels: labels,
          datasets: [{
            label: config.title || config.dataField,
            data: dataValues,
            backgroundColor: resolvedBackgroundColor,
            borderColor: resolvedBorderColor,
            borderWidth: config.borderWidth || 1,
            // For Scatter charts, ensure data is in {x,y} format if needed
            ...(chartType === ChartType.SCATTER && {
              data: datasetData.map(item => ({ x: parseFloat(item[config.labelsField]), y: parseFloat(item[config.dataField]) }))
            })
          }],
        });

      } catch (err: any) {
        setChartPreviewData(null);
        setPreviewError(err.message || 'Failed to generate chart preview. Check data fields.');
        console.error('Preview error:', err);
      }
    };

    updatePreview();
  }, [datasetData, chartType, config, name, description, selectedDatasetId, datasets]); // Dependencies for preview update


  const handleSaveVisualization = async () => {
    setSaving(true);
    setError(null);
    try {
      const vizData = {
        name,
        description,
        datasetId: selectedDatasetId,
        chartType,
        config,
      };

      if (id === 'new') {
        await visualizationApi.createVisualization(vizData);
        alert('Visualization created successfully!');
      } else {
        await visualizationApi.updateVisualization(id!, vizData);
        alert('Visualization updated successfully!');
      }
      navigate('/visualizations');
    } catch (err: any) {
      console.error('Save failed:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save visualization.';
      const validationErrors = err.response?.data?.data;
      if (validationErrors && Array.isArray(validationErrors)) {
        setError(validationErrors.map((e: any) => e.message).join(' | '));
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/visualizations')}>
          Back to Visualizations
        </Button>
        <Typography variant="h4" component="h1">
          {id === 'new' ? 'Create New Visualization' : `Edit Visualization: ${name}`}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveVisualization}
          disabled={saving || !name || !selectedDatasetId || !config.labelsField || !config.dataField}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Visualization'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Configuration Panel */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Visualization Settings</Typography>
          <TextField
            label="Visualization Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Description (Optional)"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="dataset-select-label">Dataset</InputLabel>
            <Select
              labelId="dataset-select-label"
              value={selectedDatasetId}
              label="Dataset"
              onChange={(e) => setSelectedDatasetId(e.target.value as string)}
            >
              <MenuItem value=""><em>Select a Dataset</em></MenuItem>
              {datasets.map((ds) => (
                <MenuItem key={ds.id} value={ds.id}>{ds.name} ({ds.fileType.toUpperCase()})</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="chart-type-select-label">Chart Type</InputLabel>
            <Select
              labelId="chart-type-select-label"
              value={chartType}
              label="Chart Type"
              onChange={(e) => setChartType(e.target.value as ChartType)}
            >
              {Object.values(ChartType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Chart Configuration</Typography>
          <TextField
            label="Chart Title (Optional)"
            fullWidth
            margin="normal"
            value={config.title || ''}
            onChange={(e) => handleConfigChange('title', e.target.value)}
          />

          {chartType !== ChartType.TABLE && ( // Table doesn't need labelsField and dataField for axis
            <>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="labels-field-select-label">Labels Field (X-axis/Segments)</InputLabel>
                <Select
                  labelId="labels-field-select-label"
                  value={config.labelsField}
                  label="Labels Field (X-axis/Segments)"
                  onChange={(e) => handleConfigChange('labelsField', e.target.value as string)}
                  disabled={!selectedDatasetId || availableFields.length === 0}
                >
                  <MenuItem value=""><em>Select a field</em></MenuItem>
                  {availableFields.map((field) => (
                    <MenuItem key={field} value={field}>{field}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <InputLabel id="data-field-select-label">Data Field (Y-axis/Values)</InputLabel>
                <Select
                  labelId="data-field-select-label"
                  value={config.dataField}
                  label="Data Field (Y-axis/Values)"
                  onChange={(e) => handleConfigChange('dataField', e.target.value as string)}
                  disabled={!selectedDatasetId || availableFields.length === 0}
                >
                  <MenuItem value=""><em>Select a field</em></MenuItem>
                  {availableFields.map((field) => (
                    <MenuItem key={field} value={field}>{field}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Basic color pickers, could be more advanced */}
              {(chartType === ChartType.BAR || chartType === ChartType.LINE || chartType === ChartType.SCATTER) && (
                <TextField
                  label="Background Color (e.g., #RRGGBB)"
                  fullWidth
                  margin="normal"
                  value={typeof config.backgroundColor === 'string' ? config.backgroundColor : (Array.isArray(config.backgroundColor) ? config.backgroundColor[0] : '#42a5f5')}
                  onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                  type="color"
                  InputLabelProps={{ shrink: true }}
                />
              )}
              {(chartType === ChartType.PIE || chartType === ChartType.DOUGHNUT) && (
                 <Alert severity="info" sx={{ mt: 2 }}>
                   For Pie/Doughnut charts, colors are automatically assigned per segment.
                 </Alert>
              )}

              <TextField
                label="Border Color (e.g., #RRGGBB)"
                fullWidth
                margin="normal"
                value={typeof config.borderColor === 'string' ? config.borderColor : (Array.isArray(config.borderColor) ? config.borderColor[0] : '#000000')}
                onChange={(e) => handleConfigChange('borderColor', e.target.value)}
                type="color"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Border Width"
                fullWidth
                margin="normal"
                type="number"
                value={config.borderWidth || 1}
                onChange={(e) => handleConfigChange('borderWidth', parseInt(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </>
          )}

        </Paper>

        {/* Chart Preview */}
        <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>Chart Preview</Typography>
          <Box sx={{ flexGrow: 1, minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {previewError ? (
              <Alert severity="warning">{previewError}</Alert>
            ) : (chartPreviewData ? (
              // Temporarily create a mock Visualization for ChartRenderer
              <ChartRenderer
                visualization={{
                  id: 'preview',
                  name: name,
                  description: description,
                  chartType: chartType,
                  config: config,
                  userId: '',
                  datasetId: selectedDatasetId,
                  createdAt: '', updatedAt: ''
                }}
                chartData={chartPreviewData}
              />
            ) : (
              <Typography variant="body1" color="textSecondary">
                Configure your visualization to see a preview.
              </Typography>
            ))}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VisualizationBuilder;
```