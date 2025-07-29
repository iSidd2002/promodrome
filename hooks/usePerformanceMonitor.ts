import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  memoryUsage?: number;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const lastRenderTimeRef = useRef(performance.now());
  const memoryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track render performance
  const trackRender = useCallback(() => {
    const now = performance.now();
    const renderTime = now - lastRenderTimeRef.current;
    
    renderCountRef.current += 1;
    renderTimesRef.current.push(renderTime);
    
    // Keep only last 100 render times for average calculation
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current.shift();
    }
    
    lastRenderTimeRef.current = now;
    
    // Log performance warnings
    if (renderTime > 16.67) { // More than 60fps threshold
      console.warn(`${componentName}: Slow render detected (${renderTime.toFixed(2)}ms)`);
    }
    
    if (renderCountRef.current % 100 === 0) {
      const avgRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
      console.log(`${componentName}: ${renderCountRef.current} renders, avg: ${avgRenderTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  // Get current performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const avgRenderTime = renderTimesRef.current.length > 0
      ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
      : 0;

    const metrics: PerformanceMetrics = {
      renderCount: renderCountRef.current,
      lastRenderTime: lastRenderTimeRef.current,
      averageRenderTime: avgRenderTime,
    };

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    return metrics;
  }, []);

  // Monitor memory usage
  useEffect(() => {
    if ('memory' in performance) {
      memoryCheckIntervalRef.current = setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        
        // Warn if memory usage is high
        if (usedMB > limitMB * 0.8) {
          console.warn(`${componentName}: High memory usage: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
        }
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current);
      }
    };
  }, [componentName]);

  // Track render on every component update
  useEffect(() => {
    trackRender();
  });

  // Cleanup function
  const cleanup = useCallback(() => {
    if (memoryCheckIntervalRef.current) {
      clearInterval(memoryCheckIntervalRef.current);
    }
    
    // Log final metrics
    const finalMetrics = getMetrics();
    console.log(`${componentName} final metrics:`, finalMetrics);
  }, [componentName, getMetrics]);

  return {
    getMetrics,
    cleanup,
    renderCount: renderCountRef.current,
  };
}

// Memory leak detection hook
export function useMemoryLeakDetection() {
  const listenersRef = useRef<Set<() => void>>(new Set());
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const addListener = useCallback((cleanup: () => void) => {
    listenersRef.current.add(cleanup);
    return () => {
      listenersRef.current.delete(cleanup);
    };
  }, []);

  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    timersRef.current.add(timer);
    return () => {
      clearTimeout(timer);
      timersRef.current.delete(timer);
    };
  }, []);

  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    intervalsRef.current.add(interval);
    return () => {
      clearInterval(interval);
      intervalsRef.current.delete(interval);
    };
  }, []);

  // Cleanup all tracked resources
  useEffect(() => {
    return () => {
      // Cleanup all listeners
      listenersRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during listener cleanup:', error);
        }
      });

      // Cleanup all timers
      timersRef.current.forEach(timer => {
        clearTimeout(timer);
      });

      // Cleanup all intervals
      intervalsRef.current.forEach(interval => {
        clearInterval(interval);
      });

      console.log('Memory leak detection: All resources cleaned up');
    };
  }, []);

  return {
    addListener,
    addTimer,
    addInterval,
  };
}
