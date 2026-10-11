import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '../ui/dialog';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Search, Globe, FileText, Newspaper, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function GlobalSearch({ open, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState({ wars: [], predictions: [], scenarios: [] });
  const navigate = useNavigate();

  const { data: allWars } = useQuery({
    queryKey: ['wars', 'all'],
    queryFn: async () => {
      const current = await base44.entities.War.filter({ era: 'current' });
      const past = await base44.entities.War.filter({ era: 'past' });
      const future = await base44.entities.War.filter({ era: 'near_future' });
      return [...current, ...past, ...future];
    },
    initialData: [],
    enabled: open
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions', 'all'],
    queryFn: () => base44.entities.Prediction.list(),
    initialData: [],
    enabled: open
  });

  useEffect(() => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      
      const matchedWars = allWars.filter(w =>
        w.name?.toLowerCase().includes(search) ||
        w.description?.toLowerCase().includes(search) ||
        w.countries_involved?.some(c => c.toLowerCase().includes(search))
      );

      const matchedPredictions = predictions.filter(p =>
        p.scenario?.toLowerCase().includes(search) ||
        p.affected_regions?.some(r => r.toLowerCase().includes(search))
      );

      setResults({
        wars: matchedWars.slice(0, 10),
        predictions: matchedPredictions.slice(0, 10),
        scenarios: []
      });
    } else {
      setResults({ wars: [], predictions: [], scenarios: [] });
    }
  }, [searchTerm, allWars, predictions]);

  const handleItemClick = (type, item) => {
    switch (type) {
      case 'war':
        if (item.era === 'current') {
          navigate(createPageUrl('CurrentWars'));
        } else if (item.era === 'past') {
          navigate(createPageUrl('PastWars'));
        } else if (item.era === 'near_future') {
          navigate(createPageUrl('FutureWars'));
        }
        break;
      case 'prediction':
        navigate(createPageUrl('PredictabilityWar'));
        break;
      default:
        break;
    }
    onClose();
  };

  const totalResults = results.wars.length + results.predictions.length + results.scenarios.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-950/95 backdrop-blur-xl cyber-border p-0 overflow-hidden">
        <div className="p-6 border-b border-cyan-500/30">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-cyan-400 glow-text font-mono">
              GLOBAL SEARCH
            </h2>
          </div>
          <Input
            placeholder="Search wars, predictions, scenarios, events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900/50 border-cyan-500/30 text-cyan-400 font-mono text-lg"
            autoFocus
          />
          {searchTerm && (
            <div className="mt-2 text-xs text-slate-400 font-mono">
              {totalResults} results found
            </div>
          )}
        </div>

        <ScrollArea className="h-[500px] p-6">
          {!searchTerm ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-mono text-sm">
                Start typing to search across all modules
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 font-mono text-sm">
                No results found for "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wars */}
              {results.wars.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-green-400 font-mono mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    WARS ({results.wars.length})
                  </h3>
                  <div className="space-y-2">
                    {results.wars.map((war, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleItemClick('war', war)}
                        className="w-full text-left p-4 bg-slate-900/50 hover:bg-slate-800/50 cyber-border rounded transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-cyan-400 font-mono font-bold">{war.name}</div>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-mono text-xs">
                            {war.era}
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-xs mb-2 line-clamp-2">
                          {war.description}
                        </p>
                        {war.start_date && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <Clock className="w-3 h-3" />
                            {war.start_date}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Predictions */}
              {results.predictions.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-purple-400 font-mono mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    PREDICTIONS ({results.predictions.length})
                  </h3>
                  <div className="space-y-2">
                    {results.predictions.map((pred, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleItemClick('prediction', pred)}
                        className="w-full text-left p-4 bg-slate-900/50 hover:bg-slate-800/50 cyber-border rounded transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-cyan-400 font-mono font-bold">
                            Year {pred.year} - {pred.type}
                          </div>
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-mono text-xs">
                            {pred.probability}% probability
                          </Badge>
                        </div>
                        <p className="text-slate-400 font-mono text-xs line-clamp-2">
                          {pred.scenario}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}