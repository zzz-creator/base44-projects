import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullThreshold = 80;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY !== 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      setIsPulling(true);
      setPullDistance(Math.min(diff, pullThreshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const rotation = (pullDistance / pullThreshold) * 360;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {(isPulling || isRefreshing) && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex justify-center items-center"
          style={{ height: pullDistance }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : rotation }}
            transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <RefreshCw className={`w-6 h-6 ${pullDistance >= pullThreshold ? 'text-blue-600' : 'text-slate-400'}`} />
          </motion.div>
        </motion.div>
      )}
      <motion.div
        animate={{
          y: isPulling || isRefreshing ? pullDistance : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}