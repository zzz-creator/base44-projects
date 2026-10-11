import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

export default function ComparativeOverlayChart({ datasets, title = "COMPARATIVE ANALYSIS" }) {
  const [selectedDatasets, setSelectedDatasets] = useState(
    datasets.map((_, idx) => idx < 3) // Select first 3 by default
  );

  const colors = ['#00ff41', '#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#10b981'];

  const toggleDataset = (index) => {
    const newSelected = [...selectedDatasets];
    newSelected[index] = !newSelected[index];
    setSelectedDatasets(newSelected);
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-6 h-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-cyan-400 glow-text font-mono">{title}</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {datasets.map((dataset, idx) => (
          <div key={idx} className="flex items-center space-x-2 p-2 bg-slate-900/50 cyber-border rounded">
            <Checkbox
              id={`dataset-${idx}`}
              checked={selectedDatasets[idx]}
              onCheckedChange={() => toggleDataset(idx)}
            />
            <Label
              htmlFor={`dataset-${idx}`}
              className="text-sm font-mono cursor-pointer"
              style={{ color: colors[idx % colors.length] }}
            >
              {dataset.name}
            </Label>
          </div>
        ))}
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
              allowDuplicatedCategory={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #00ff41', 
                fontFamily: 'monospace' 
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace' }} />
            
            {datasets.map((dataset, idx) => 
              selectedDatasets[idx] && (
                <Line
                  key={dataset.name}
                  data={dataset.data}
                  type="monotone"
                  dataKey="value"
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  name={dataset.name}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}