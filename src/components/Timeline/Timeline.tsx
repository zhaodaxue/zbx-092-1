import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AnnotationInterval, ActionCategory, DragState, DragMode } from '../../types';
import { framesToTime } from '../../utils/time';

interface TimelineProps {
  totalFrames: number;
  fps: number;
  intervals: AnnotationInterval[];
  categories: ActionCategory[];
  selectedIntervalId: string | null;
  onSelectInterval: (id: string | null) => void;
  onUpdateInterval: (id: string, updates: Partial<AnnotationInterval>) => boolean;
  disabled?: boolean;
  onError?: (message: string) => void;
}

const EDGE_THRESHOLD = 8;
const MIN_INTERVAL_FRAMES = 5;

export const Timeline: React.FC<TimelineProps> = ({
  totalFrames,
  fps,
  intervals,
  categories,
  selectedIntervalId,
  onSelectInterval,
  onUpdateInterval,
  disabled = false,
  onError,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    mode: null,
    intervalId: null,
    startX: 0,
    startFrame: 0,
    startEndFrame: 0,
  });
  const [hoveredInterval, setHoveredInterval] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const getCategoryColor = (categoryId: string): string => {
    return categories.find(c => c.id === categoryId)?.color || '#6b7280';
  };

  const getCategoryName = (categoryId: string): string => {
    return categories.find(c => c.id === categoryId)?.name || '未知';
  };

  const frameToPixel = useCallback((frame: number, width: number): number => {
    return (frame / totalFrames) * width;
  }, [totalFrames]);

  const pixelToFrame = useCallback((pixel: number, width: number): number => {
    return Math.round((pixel / width) * totalFrames);
  }, [totalFrames]);

  const getDragMode = (e: React.MouseEvent, interval: AnnotationInterval): DragMode => {
    if (disabled) return null;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const width = rect.width;

    const leftEdge = frameToPixel(interval.startFrame, width);
    const rightEdge = frameToPixel(interval.endFrame, width);
    const intervalWidth = rightEdge - leftEdge;
    const relativeInInterval = relativeX - leftEdge;

    if (relativeInInterval <= EDGE_THRESHOLD && intervalWidth > EDGE_THRESHOLD * 2) {
      return 'resize-left';
    } else if (relativeInInterval >= intervalWidth - EDGE_THRESHOLD && intervalWidth > EDGE_THRESHOLD * 2) {
      return 'resize-right';
    }
    return 'move';
  };

  const handleMouseDown = (e: React.MouseEvent, interval: AnnotationInterval) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const mode = getDragMode(e, interval);
    if (!mode) return;

    onSelectInterval(interval.id);

    setDragState({
      isDragging: true,
      mode,
      intervalId: interval.id,
      startX: e.clientX,
      startFrame: interval.startFrame,
      startEndFrame: interval.endFrame,
    });
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    onError?.(msg);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.intervalId || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const width = rect.width;
      const deltaX = e.clientX - dragState.startX;
      const deltaFrames = pixelToFrame(deltaX, width);

      const interval = intervals.find(i => i.id === dragState.intervalId);
      if (!interval) return;

      let newStart = interval.startFrame;
      let newEnd = interval.endFrame;

      if (dragState.mode === 'move') {
        newStart = Math.max(0, Math.min(totalFrames - (interval.endFrame - interval.startFrame), dragState.startFrame + deltaFrames));
        newEnd = newStart + (interval.endFrame - interval.startFrame);
      } else if (dragState.mode === 'resize-left') {
        newStart = Math.max(0, Math.min(dragState.startEndFrame - MIN_INTERVAL_FRAMES, dragState.startFrame + deltaFrames));
      } else if (dragState.mode === 'resize-right') {
        newEnd = Math.min(totalFrames, Math.max(dragState.startFrame + MIN_INTERVAL_FRAMES, dragState.startEndFrame + deltaFrames));
      }

      if (newStart !== interval.startFrame || newEnd !== interval.endFrame) {
        const ok = onUpdateInterval(dragState.intervalId, {
          startFrame: newStart,
          endFrame: newEnd,
        });
        if (!ok) {
          showError('区间调整失败：可能与其他区间重叠或超出范围');
        }
      }
    },
    [dragState, intervals, totalFrames, pixelToFrame, onUpdateInterval]
  );

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      mode: null,
      intervalId: null,
      startX: 0,
      startFrame: 0,
      startEndFrame: 0,
    });
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interval-block')) return;
    onSelectInterval(null);
  };

  const renderRuler = () => {
    const marks = [];
    const majorStep = Math.ceil(totalFrames / 10);
    const minorStep = Math.ceil(majorStep / 5);

    for (let frame = 0; frame <= totalFrames; frame += minorStep) {
      const isMajor = frame % majorStep === 0;
      const left = frameToPixel(frame, 100);
      marks.push(
        <div
          key={frame}
          className={`absolute bottom-0 ${isMajor ? 'h-3' : 'h-1.5'} bg-primary-500`}
          style={{
            left: `${left}%`,
            width: '1px',
          }}
        />
      );
      if (isMajor) {
        marks.push(
          <div
            key={`label-${frame}`}
            className="absolute bottom-4 text-xs font-mono text-primary-400 transform -translate-x-1/2"
            style={{ left: `${left}%` }}
          >
            {frame}
          </div>
        );
      }
    }
    return marks;
  };

  const renderTimeMarks = () => {
    const marks = [];
    const step = Math.ceil(totalFrames / 5);

    for (let frame = 0; frame <= totalFrames; frame += step) {
      const left = frameToPixel(frame, 100);
      marks.push(
        <div
          key={`time-${frame}`}
          className="absolute top-1 text-xs font-mono text-primary-500 transform -translate-x-1/2"
          style={{ left: `${left}%` }}
        >
          {framesToTime(frame, fps)}
        </div>
      );
    }
    return marks;
  };

  return (
    <div className="w-full select-none">
      {errorMsg && (
        <div className="mb-2 px-3 py-1.5 bg-danger-900/50 border border-danger-600/50 rounded text-xs text-danger-200 animate-fadeIn">
          ⚠️ {errorMsg}
        </div>
      )}
      <div
        ref={timelineRef}
        className={`relative w-full h-32 bg-primary-900/50 border border-primary-700/50 rounded overflow-hidden ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={handleTimelineClick}
      >
        {renderTimeMarks()}

        <div className="absolute bottom-8 left-0 right-0 h-1 bg-primary-700/30" />

        <div className="absolute bottom-0 left-0 right-0 h-10">
          {renderRuler()}
        </div>

        {intervals.map((interval) => {
          const isSelected = selectedIntervalId === interval.id;
          const isHovered = hoveredInterval === interval.id;
          const color = getCategoryColor(interval.categoryId);
          const left = frameToPixel(interval.startFrame, 100);
          const width = frameToPixel(interval.endFrame - interval.startFrame, 100);

          return (
            <div
              key={interval.id}
              className={`interval-block absolute top-12 h-10 rounded cursor-pointer transition-all duration-150 ${
                isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-primary-900' : ''
              } ${dragState.intervalId === interval.id ? 'opacity-70' : ''}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: color,
                opacity: interval.isModified ? 1 : 0.85,
                minWidth: '20px',
              }}
              onMouseDown={(e) => handleMouseDown(e, interval)}
              onMouseEnter={() => setHoveredInterval(interval.id)}
              onMouseLeave={() => setHoveredInterval(null)}
            >
              <div className="absolute inset-0 flex items-center justify-center px-2 overflow-hidden">
                <span className="text-xs font-medium text-white truncate drop-shadow">
                  {getCategoryName(interval.categoryId)}
                </span>
              </div>

              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l transition-colors"
                style={{ display: width > 4 ? 'block' : 'none' }}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r transition-colors"
                style={{ display: width > 4 ? 'block' : 'none' }}
              />

              {(isHovered || isSelected) && (
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-primary-800 border border-primary-600 px-2 py-0.5 rounded text-xs font-mono text-primary-100 whitespace-nowrap z-10">
                  {interval.startFrame} - {interval.endFrame} ({interval.endFrame - interval.startFrame}帧)
                </div>
              )}

              {interval.isModified && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-warning rounded-full border border-primary-900" title="已修改" />
              )}
            </div>
          );
        })}

        {intervals.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-primary-500 text-sm">
              暂无标注区间，点击下方按钮添加
            </div>
          )}
      </div>

      <div className="mt-2 flex justify-between text-xs text-primary-500 font-mono">
        <span>第 0 帧</span>
        <span>共 {totalFrames} 帧 / {framesToTime(totalFrames, fps)}</span>
        <span>第 {totalFrames} 帧</span>
      </div>
    </div>
  );
};
