import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Play, Pause, RotateCw, Loader2 } from "lucide-react";
import { executeTurn } from '../turnEngine';
import { toast } from 'sonner';

export default function TurnController({ onTurnComplete }) {
  const [executing, setExecuting] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const handleExecuteTurn = async () => {
    setExecuting(true);
    try {
      const result = await executeTurn();
      if (result.success) {
        setTurnCount(prev => prev + 1);
        toast.success(`Turn completed in ${result.duration}ms`);
        if (onTurnComplete) {
          onTurnComplete(result);
        }
      } else {
        toast.error(`Turn failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Turn execution error');
      console.error(error);
    } finally {
      setExecuting(false);
    }
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
    if (!autoPlay) {
      toast.info('Auto-play enabled');
    } else {
      toast.info('Auto-play disabled');
    }
  };

  React.useEffect(() => {
    let interval;
    if (autoPlay && !executing) {
      interval = setInterval(() => {
        handleExecuteTurn();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [autoPlay, executing]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white">Turn {turnCount}</div>
            <div className="text-sm text-slate-400 mt-1">
              {autoPlay ? 'Auto-play active' : 'Manual control'}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExecuteTurn}
              disabled={executing || autoPlay}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Execute Turn
                </>
              )}
            </Button>
            <Button
              onClick={toggleAutoPlay}
              variant={autoPlay ? "destructive" : "outline"}
              className={autoPlay ? "" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
            >
              {autoPlay ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Auto-play
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}