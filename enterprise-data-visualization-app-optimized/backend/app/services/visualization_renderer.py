```python
import json
import pandas as pd
import logging
from flask import current_app

class VisualizationRenderer:
    """
    Processes raw data and generates/updates chart options for various visualization types.
    This class acts as a bridge between raw data and a frontend charting library (e.g., ECharts).
    It ensures that the data format and chart configuration are compatible.
    """

    def __init__(self):
        self.logger = current_app.logger if current_app else logging.getLogger(__name__)

    def render_chart(self, viz_type: str, raw_data: list[dict], chart_options: dict) -> tuple[list[dict], dict]:
        """
        Processes raw data and integrates it into the base chart_options.
        Returns processed data and updated chart options.
        """
        self.logger.info(f"Rendering chart for type: {viz_type}")
        df = pd.DataFrame(raw_data)

        # Basic data validation and handling empty data
        if df.empty:
            self.logger.warning(f"No data available for visualization type: {viz_type}.")
            return [], self._get_empty_chart_options(viz_type, chart_options)

        processed_data = raw_data # Default: pass raw data through
        dynamic_options = chart_options.copy() # Start with the base options

        # Call specific handler for each visualization type
        if viz_type == 'bar':
            processed_data, dynamic_options = self._render_bar_chart(df, dynamic_options)
        elif viz_type == 'line':
            processed_data, dynamic_options = self._render_line_chart(df, dynamic_options)
        elif viz_type == 'pie':
            processed_data, dynamic_options = self._render_pie_chart(df, dynamic_options)
        elif viz_type == 'table':
            # For table, processed_data is usually just raw_data, and options are minimal
            # We can add sorting/pagination options here if needed.
            return raw_data, chart_options # Tables don't usually need complex ECharts-style options
        elif viz_type == 'scatter':
            processed_data, dynamic_options = self._render_scatter_chart(df, dynamic_options)
        elif viz_type == 'gauge':
            processed_data, dynamic_options = self._render_gauge_chart(df, dynamic_options)
        else:
            self.logger.warning(f"Unsupported visualization type: {viz_type}. Returning raw data and original options.")
            return raw_data, chart_options

        return processed_data, dynamic_options.to_dict() if isinstance(dynamic_options, pd.Series) else dynamic_options

    def _get_empty_chart_options(self, viz_type, base_options):
        """Returns a basic chart option for when there is no data."""
        # This can be customized to show "No Data" message
        if viz_type in ['bar', 'line', 'scatter']:
            base_options.update({
                'xAxis': {'data': []},
                'series': [{'data': []}]
            })
        elif viz_type == 'pie':
            base_options.update({
                'series': [{'data': []}]
            })
        elif viz_type == 'gauge':
            base_options.update({
                'series': [{'data': [{'value': 0, 'name': 'No Data'}]}]
            })
        base_options['title'] = {'text': f"{base_options.get('title', {}).get('text', 'Chart')} (No Data Available)", 'left': 'center'}
        return base_options


    def _render_bar_chart(self, df: pd.DataFrame, options: dict) -> tuple[list[dict], dict]:
        """Generates ECharts options for a bar chart."""
        # Expected options to define axes: options['x_axis_field'], options['y_axis_field']
        x_field = options.get('x_axis_field')
        y_field = options.get('y_axis_field')
        series_name = options.get('series_name', y_field)

        if not x_field or not y_field:
            self.logger.error("Missing x_axis_field or y_axis_field for bar chart.")
            return df.to_dict(orient='records'), options

        try:
            x_data = df[x_field].tolist()
            y_data = df[y_field].tolist()

            options.update({
                'xAxis': {
                    'type': 'category',
                    'data': x_data,
                    'name': x_field
                },
                'yAxis': {
                    'type': 'value',
                    'name': y_field
                },
                'series': [{
                    'name': series_name,
                    'type': 'bar',
                    'data': y_data,
                    'itemStyle': options.get('series_item_style', {})
                }]
            })
            return df.to_dict(orient='records'), options
        except KeyError as e:
            self.logger.error(f"Field not found in data for bar chart: {e}")
            return df.to_dict(orient='records'), options
        except Exception as e:
            self.logger.error(f"Error rendering bar chart: {e}")
            return df.to_dict(orient='records'), options

    def _render_line_chart(self, df: pd.DataFrame, options: dict) -> tuple[list[dict], dict]:
        """Generates ECharts options for a line chart."""
        x_field = options.get('x_axis_field')
        y_field = options.get('y_axis_field')
        series_name = options.get('series_name', y_field)

        if not x_field or not y_field:
            self.logger.error("Missing x_axis_field or y_axis_field for line chart.")
            return df.to_dict(orient='records'), options

        try:
            x_data = df[x_field].tolist()
            y_data = df[y_field].tolist()

            options.update({
                'xAxis': {
                    'type': 'category',
                    'data': x_data,
                    'name': x_field
                },
                'yAxis': {
                    'type': 'value',
                    'name': y_field
                },
                'series': [{
                    'name': series_name,
                    'type': 'line',
                    'data': y_data,
                    'smooth': options.get('smooth_line', False),
                    'areaStyle': options.get('area_style', None)
                }]
            })
            return df.to_dict(orient='records'), options
        except KeyError as e:
            self.logger.error(f"Field not found in data for line chart: {e}")
            return df.to_dict(orient='records'), options
        except Exception as e:
            self.logger.error(f"Error rendering line chart: {e}")
            return df.to_dict(orient='records'), options

    def _render_pie_chart(self, df: pd.DataFrame, options: dict) -> tuple[list[dict], dict]:
        """Generates ECharts options for a pie chart."""
        name_field = options.get('name_field')
        value_field = options.get('value_field')
        series_name = options.get('series_name', 'Value')

        if not name_field or not value_field:
            self.logger.error("Missing name_field or value_field for pie chart.")
            return df.to_dict(orient='records'), options

        try:
            pie_data = df[[name_field, value_field]].rename(columns={name_field: 'name', value_field: 'value'}).to_dict(orient='records')

            options.update({
                'series': [{
                    'name': series_name,
                    'type': 'pie',
                    'radius': options.get('radius', '50%'),
                    'data': pie_data,
                    'emphasis': {
                        'itemStyle': {
                            'shadowBlur': 10,
                            'shadowOffsetX': 0,
                            'shadowColor': 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    'label': options.get('label_style', {'show': True, 'formatter': '{b}: {c} ({d}%)'})
                }]
            })
            return df.to_dict(orient='records'), options
        except KeyError as e:
            self.logger.error(f"Field not found in data for pie chart: {e}")
            return df.to_dict(orient='records'), options
        except Exception as e:
            self.logger.error(f"Error rendering pie chart: {e}")
            return df.to_dict(orient='records'), options

    def _render_scatter_chart(self, df: pd.DataFrame, options: dict) -> tuple[list[dict], dict]:
        """Generates ECharts options for a scatter chart."""
        x_field = options.get('x_axis_field')
        y_field = options.get('y_axis_field')
        # Optional: size_field for bubble charts
        size_field = options.get('size_field')
        series_name = options.get('series_name', 'Scatter')

        if not x_field or not y_field:
            self.logger.error("Missing x_axis_field or y_axis_field for scatter chart.")
            return df.to_dict(orient='records'), options

        try:
            scatter_data = []
            for _, row in df.iterrows():
                if size_field:
                    scatter_data.append([row[x_field], row[y_field], row[size_field]])
                else:
                    scatter_data.append([row[x_field], row[y_field]])

            series_option = {
                'name': series_name,
                'type': 'scatter',
                'data': scatter_data
            }
            if size_field:
                series_option['symbolSize'] = options.get('symbol_size', 10) # Or dynamic based on size_field
                # ECharts can map a dimension to symbol size:
                # series_option['encode'] = {'x': x_field, 'y': y_field, 'itemName': 'name', 'value': size_field}
                # series_option['symbolSize'] = {'value': size_field, 'func': 'return value * 2'} # JS function string

            options.update({
                'xAxis': {'type': 'value', 'name': x_field},
                'yAxis': {'type': 'value', 'name': y_field},
                'series': [series_option]
            })
            return df.to_dict(orient='records'), options
        except KeyError as e:
            self.logger.error(f"Field not found in data for scatter chart: {e}")
            return df.to_dict(orient='records'), options
        except Exception as e:
            self.logger.error(f"Error rendering scatter chart: {e}")
            return df.to_dict(orient='records'), options

    def _render_gauge_chart(self, df: pd.DataFrame, options: dict) -> tuple[list[dict], dict]:
        """Generates ECharts options for a gauge chart (typically for a single value)."""
        value_field = options.get('value_field')
        name_field = options.get('name_field', 'Value')

        if not value_field:
            self.logger.error("Missing value_field for gauge chart.")
            return df.to_dict(orient='records'), options

        try:
            # Gauge charts usually display a single aggregate value
            # Assuming the first row's value field is the one to display
            current_value = df[value_field].iloc[0]
            current_name = df[name_field].iloc[0] if name_field in df.columns else name_field

            options.update({
                'series': [
                    {
                        'type': 'gauge',
                        'startAngle': options.get('startAngle', 180),
                        'endAngle': options.get('endAngle', 0),
                        'min': options.get('min_value', 0),
                        'max': options.get('max_value', 100),
                        'splitNumber': options.get('splitNumber', 10),
                        'axisLine': {
                            'lineStyle': {
                                'width': options.get('axisLineWidth', 10),
                                'color': options.get('axisLineColor', [[0.3, '#67e0e3'], [0.7, '#37a2da'], [1, '#fd666d']])
                            }
                        },
                        'pointer': {
                            'icon': 'path://M12.8,0.7l12,40.7c0.1,0.3,0.2,0.6,0.2,1c0,2.6-2,4.6-4.6,4.6h-20.5c-2.6,0-4.6-2-4.6-4.6c0-0.4,0.1-0.7,0.2-1L12.8,0.7z',
                            'length': '70%',
                            'width': 10,
                            'offsetCenter': [0, '-8%']
                        },
                        'axisTick': {'distance': -10, 'length': 8, 'lineStyle': {'color': '#999', 'width': 2}},
                        'splitLine': {'distance': -15, 'length': 20, 'lineStyle': {'color': '#999', 'width': 3}},
                        'axisLabel': {'distance': 25, 'color': '#999', 'fontSize': 10},
                        'anchor': {'show': False},
                        'title': {'offsetCenter': [0, '-40%'], 'fontSize': 14},
                        'detail': {'valueAnimation': True, 'offsetCenter': [0, '0%'], 'fontSize': 18, 'formatter': '{value}' + options.get('unit_suffix', '')},
                        'data': [
                            {
                                'value': current_value,
                                'name': current_name
                            }
                        ]
                    }
                ]
            })
            return df.to_dict(orient='records'), options
        except KeyError as e:
            self.logger.error(f"Field not found in data for gauge chart: {e}")
            return df.to_dict(orient='records'), options
        except Exception as e:
            self.logger.error(f"Error rendering gauge chart: {e}")
            return df.to_dict(orient='records'), options

    # ... Add more rendering methods for other chart types (e.g., area, heatmap, map)
```