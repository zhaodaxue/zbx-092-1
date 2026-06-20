import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import type { AnnotationInterval, ActionCategory } from '../../types';
import { framesToTime } from '../../utils/time';

interface IntervalListProps {
  intervals: AnnotationInterval[];
  categories: ActionCategory[];
  fps: number;
  selectedIntervalId: string | null;
  onSelectInterval: (id: string | null) => void;
  onUpdateCategory: (intervalId: string, categoryId: string) => void;
  onDelete: (intervalId: string) => void;
  disabled?: boolean;
}

export const IntervalList: React.FC<IntervalListProps> = ({
  intervals,
  categories,
  fps,
  selectedIntervalId,
  onSelectInterval,
  onUpdateCategory,
  onDelete,
  disabled = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getCategoryColor = (categoryId: string): string => {
    return categories.find(c => c.id === categoryId)?.color || '#6b7280';
  };

  const getCategoryName = (categoryId: string): string => {
    return categories.find(c => c.id === categoryId)?.name || '未知';
  };

  const handleCategoryChange = (intervalId: string, categoryId: string) => {
    onUpdateCategory(intervalId, categoryId);
    setEditingId(null);
  };

  if (intervals.length === 0) {
    return (
      <div className="card rounded-lg p-6 text-center text-primary-400">
        暂无标注区间
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {intervals.map((interval, index) => {
        const isSelected = selectedIntervalId === interval.id;
        const isExpanded = expandedId === interval.id;
        const isEditing = editingId === interval.id;
        const color = getCategoryColor(interval.categoryId);

        return (
          <div
            key={interval.id}
            className={`card rounded-lg overflow-hidden transition-all ${
              isSelected ? 'ring-2 ring-primary-400' : ''
            }`}
          >
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary-700/30 transition-colors"
              onClick={() => {
                onSelectInterval(interval.id);
                if (isExpanded) {
                  setExpandedId(null);
                } else {
                  setExpandedId(interval.id);
                }
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-medium text-primary-200 w-8">
                #{index + 1}
              </span>
              <span className="text-sm text-primary-100 flex-1">
                {getCategoryName(interval.categoryId)}
              </span>
              <span className="text-xs font-mono text-primary-400">
                {framesToTime(interval.startFrame, fps)} - {framesToTime(interval.endFrame, fps)}
              </span>
              <span className="text-xs font-mono text-primary-500">
                {interval.endFrame - interval.startFrame}帧
              </span>
              {interval.isModified && (
                <span className="text-xs text-warning">已修改</span>
              )}
              {isExpanded ? (
                <ChevronUp size={16} className="text-primary-400" />
              ) : (
                <ChevronDown size={16} className="text-primary-400" />
              )}
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 pt-0 border-t border-primary-700/30">
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs text-primary-400 mb-1">起始帧</label>
                    <div className="input font-mono text-sm">
                      {interval.startFrame}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-primary-400 mb-1">结束帧</label>
                    <div className="input font-mono text-sm">
                      {interval.endFrame}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-primary-400 mb-1">置信度</label>
                    <div className="input font-mono text-sm">
                      {(interval.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-primary-400 mb-1">动作类别</label>
                    {isEditing ? (
                      <select
                        value={interval.categoryId}
                        onChange={(e) => handleCategoryChange(interval.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="input w-full text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        className={`input flex items-center justify-between ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!disabled) setEditingId(interval.id);
                        }}
                      >
                        <span className="text-sm">{getCategoryName(interval.categoryId)}</span>
                        {!disabled && <Pencil size={14} className="text-primary-500" />}
                      </div>
                    )}
                  </div>
                </div>

                {!disabled && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(interval.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                      删除区间
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
