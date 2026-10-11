import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  BarChart3, LineChart, PieChart, Map, Save, Plus, 
  Trash2, Settings, Eye, Download, Palette
} from 'lucide-react';
import { 
  LineChart as RechartsLine, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const sampleData = [
  { name: 'Jan', conflicts: 12, threat: 65, economic: 78 },
  { name: 'Feb', conflicts: 15, threat: 72, economic: 74 },
  { name: 'Mar', conflicts: 18, threat: 68, economic: 80 },
  { name: 'Apr', conflicts: 14, threat: 75, economic: 72 },
  { name: 'May', conflicts: 20, threat: 82, economic: 68 },
  { name: 'Jun', conflicts: 17, threat: 78, economic: 70 },
];

export default function CustomizableVisualization({ onSaveChart }) {
  const [charts, setCharts] = useState([
    { 
      id: 1, 
      name: 'Conflict Trends', 
      type: 'line', 
      metrics: ['conflicts', 'threat'],
      colors: ['#00ff41', '#00f5ff'],
      showGrid: true,
      showLegend: true
    }
  ]);
  const [selectedChart, setSelectedChart] = useState(0);
  const [editMode, setEditMode] = useState(false);

  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'area', label: 'Area Chart', icon: PieChart }
  ];

  const availableMetrics = [
    { value: 'conflicts', label: 'Active Conflicts', color: '#00ff41' },
    { value: 'threat', label: 'Threat Level', color: '#00f5ff' },
    { value: 'economic', label: 'Economic Impact', color: '#bf00ff' }
  ];

  const colorPalettes = [
    ['#00ff41', '#00f5ff', '#bf00ff'],
    ['#ef4444', '#f97316', '#eab308'],
    ['#3b82f6', '#8b5cf6', '#ec4899'],
    ['#10b981', '#14b8a6', '#06b6d4']
  ];

  const addChart = () => {
    const newChart = {
      id: charts.length + 1,
      name: `Chart ${charts.length + 1}`,
      type: 'line',
      metrics: ['conflicts'],
      colors: ['#00ff41'],
      showGrid: true,
      showLegend: true
    };
    setCharts([...charts, newChart]);
    setSelectedChart(charts.length);
  };

  const updateChart = (field, value) => {
    const updated = [...charts];
    updated[selectedChart] = { ...updated[selectedChart], [field]: value };
    setCharts(updated);
  };

  const deleteChart = (idx) => {
    if (charts.length <= 1) return;
    const updated = charts.filter((_, i) => i !== idx);
    setCharts(updated);
    setSelectedChart(Math.max(0, selectedChart - 1));
  };

  const toggleMetric = (metric) => {
    const current = charts[selectedChart].metrics;
    const updated = current.includes(metric)
      ? current.filter(m => m !== metric)
      : [...current, metric];
    updateChart('metrics', updated);
    
    // Update colors accordingly
    const newColors = updated.map(m => 
      availableMetrics.find(am => am.value === m)?.color || '#00ff41'
    );
    updateChart('colors', newColors);
  };

  const renderChart = (chart) => {
    const ChartComponent = chart.type === 'bar' ? BarChart : 
                          chart.type === 'area' ? AreaChart : RechartsLine;
    const DataComponent = chart.type === 'bar' ? Bar : 
                          chart.type === 'area' ? Area : Line;

    return (
      <ResponsiveContainer width="100%" height={250}>
        <ChartComponent data={sampleData}>
          {chart.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />}
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid #1e3a5f',
              borderRadius: '8px',
              fontFamily: 'monospace'
            }}
          />
          {chart.showLegend && <Legend />}
          {chart.metrics.map((metric, idx) => (
            <DataComponent
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={chart.colors[idx] || '#00ff41'}
              fill={chart.type === 'area' ? chart.colors[idx] : undefined}
              fillOpacity={chart.type === 'area' ? 0.3 : 1}
              strokeWidth={2}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl border border-sky-900/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-purple-400 glow-text font-mono">
              CUSTOM VISUALIZATIONS
            </h3>
            <p className="text-xs text-slate-400 font-mono">Build Your Own Charts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className={`font-mono text-xs ${editMode ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800/50 text-slate-400'}`}
          >
            <Settings className="w-3 h-3 mr-1" />
            {editMode ? 'DONE' : 'EDIT'}
          </Button>
          <Button
            size="sm"
            onClick={addChart}
            className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            ADD CHART
          </Button>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {charts.map((chart, idx) => (
          <div key={chart.id} className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => setSelectedChart(idx)}
              className={`font-mono text-xs ${
                selectedChart === idx
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                  : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
              }`}
            >
              {chart.name}
            </Button>
            {editMode && charts.length > 1 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteChart(idx)}
                className="h-6 w-6 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Edit Panel */}
      {editMode && charts[selectedChart] && (
        <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4 mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sky-400 font-mono text-xs mb-1 block">CHART NAME</Label>
              <Input
                value={charts[selectedChart].name}
                onChange={(e) => updateChart('name', e.target.value)}
                className="bg-slate-800/50 border-slate-600/30 text-slate-200 font-mono"
              />
            </div>
            <div>
              <Label className="text-sky-400 font-mono text-xs mb-1 block">CHART TYPE</Label>
              <Select
                value={charts[selectedChart].type}
                onValueChange={(v) => updateChart('type', v)}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-600/30 text-slate-200 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sky-400 font-mono text-xs mb-2 block">METRICS</Label>
            <div className="flex flex-wrap gap-2">
              {availableMetrics.map(metric => (
                <Button
                  key={metric.value}
                  size="sm"
                  onClick={() => toggleMetric(metric.value)}
                  className={`font-mono text-xs ${
                    charts[selectedChart].metrics.includes(metric.value)
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-slate-800/50 text-slate-400 border-slate-600/30'
                  }`}
                >
                  {metric.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={charts[selectedChart].showGrid}
                onCheckedChange={(v) => updateChart('showGrid', v)}
              />
              <Label className="text-slate-400 font-mono text-xs">Show Grid</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={charts[selectedChart].showLegend}
                onCheckedChange={(v) => updateChart('showLegend', v)}
              />
              <Label className="text-slate-400 font-mono text-xs">Show Legend</Label>
            </div>
          </div>
        </div>
      )}

      {/* Chart Display */}
      {charts[selectedChart] && (
        <div className="bg-slate-900/50 border border-sky-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-green-400 font-mono font-bold">{charts[selectedChart].name}</h4>
            <div className="flex items-center gap-2">
              {charts[selectedChart].metrics.map((m, i) => (
                <Badge 
                  key={m} 
                  style={{ backgroundColor: `${charts[selectedChart].colors[i]}20`, color: charts[selectedChart].colors[i], borderColor: `${charts[selectedChart].colors[i]}50` }}
                  className="font-mono text-xs border"
                >
                  {availableMetrics.find(am => am.value === m)?.label}
                </Badge>
              ))}
            </div>
          </div>
          {renderChart(charts[selectedChart])}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={() => onSaveChart?.(charts)}
          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono"
        >
          <Save className="w-4 h-4 mr-2" />
          SAVE CONFIGURATION
        </Button>
      </div>
    </Card>
  );
}