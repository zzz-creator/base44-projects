import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Newspaper, Clock, MapPin, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';

export default function NewsFeed({ news, onRefresh, isRefreshing, onApplyUpdate }) {
  const [expandedNews, setExpandedNews] = useState(null);

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HIGH': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'LOW': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[severity] || colors['MEDIUM'];
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'casualty_report': AlertCircle,
      'major_offensive': TrendingUp,
      'diplomatic': MapPin,
      'territory_change': MapPin
    };
    const Icon = icons[category] || Newspaper;
    return Icon;
  };

  return (
    <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border h-full">
      <div className="p-4 border-b border-green-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-cyan-400 glow-text font-mono">
            LIVE NEWS FEED
          </h3>
          {news && news.length > 0 && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-cyan-400 hover:bg-cyan-500/10"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="h-[600px] overflow-y-auto">
        <div className="p-4 space-y-3">
          {!news || news.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-mono text-sm">
                {isRefreshing ? 'Fetching latest news...' : 'No news available. Click refresh to fetch.'}
              </p>
            </div>
          ) : (
            news.map((item, idx) => {
              const CategoryIcon = getCategoryIcon(item.category);
              const isExpanded = expandedNews === idx;

              return (
                <div
                  key={idx}
                  className="bg-slate-900/50 cyber-border rounded-lg p-4 hover-glow transition-all cursor-pointer"
                  onClick={() => setExpandedNews(isExpanded ? null : idx)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                      <CategoryIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-green-400 font-mono line-clamp-2">
                          {item.headline}
                        </h4>
                        <Badge className={`${getSeverityColor(item.severity)} font-mono text-xs shrink-0`}>
                          {item.severity}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>

                      <p className={`text-slate-400 font-mono text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {item.summary}
                      </p>

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {item.details && (
                            <div className="p-3 bg-slate-950/50 cyber-border rounded">
                              <h5 className="text-xs font-bold text-cyan-400 font-mono mb-1">DETAILS</h5>
                              <p className="text-slate-300 font-mono text-xs">{item.details}</p>
                            </div>
                          )}

                          {item.casualties && (
                            <div className="grid grid-cols-2 gap-2">
                              {item.casualties.military && (
                                <div className="p-2 bg-red-950/20 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Military</div>
                                  <div className="text-red-400 font-bold font-mono">{item.casualties.military}</div>
                                </div>
                              )}
                              {item.casualties.civilian && (
                                <div className="p-2 bg-orange-950/20 cyber-border rounded">
                                  <div className="text-xs text-slate-500 font-mono">Civilian</div>
                                  <div className="text-orange-400 font-bold font-mono">{item.casualties.civilian}</div>
                                </div>
                              )}
                            </div>
                          )}

                          {item.affects_conflict && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 font-mono text-xs">
                                Affects: {item.affects_conflict}
                              </Badge>
                            </div>
                          )}

                          {item.suggested_update && onApplyUpdate && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onApplyUpdate(item);
                              }}
                              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-mono text-xs"
                            >
                              APPLY UPDATE TO DATABASE
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}