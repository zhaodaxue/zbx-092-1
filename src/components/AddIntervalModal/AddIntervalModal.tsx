import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { ActionCategory } from '../../types';

interface AddIntervalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (startFrame: number, endFrame: number, categoryId: string) => boolean;
  categories: ActionCategory[];
  totalFrames: number;
}

export const AddIntervalModal: React.FC<AddIntervalModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  categories,
  totalFrames,
}) => {
  const [startFrame, setStartFrame] = useState('');
  const [endFrame, setEndFrame] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const start = parseInt(startFrame, 10);
    const end = parseInt(endFrame, 10);

    if (isNaN(start) || isNaN(end)) {
      setError('请输入有效的帧号');
      return;
    }

    const success = onAdd(start, end, categoryId);
    if (success) {
      setStartFrame('');
      setEndFrame('');
      setCategoryId(categories[0]?.id || '');
      setError('');
      onClose();
    } else {
      setError('区间无效，请检查是否与其他区间重叠或超出范围');
    }
  };

  const handleClose = () => {
    setStartFrame('');
    setEndFrame('');
    setCategoryId(categories[0]?.id || '');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md mx-4 card rounded-lg animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-primary-700/50">
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-primary-300" />
            <h3 className="text-lg font-semibold text-primary-100">新增标注区间</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-primary-400 hover:text-primary-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                起始帧 <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                value={startFrame}
                onChange={(e) => {
                  setStartFrame(e.target.value);
                  setError('');
                }}
                placeholder="0"
                min={0}
                max={totalFrames}
                className="input w-full font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                结束帧 <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                value={endFrame}
                onChange={(e) => {
                  setEndFrame(e.target.value);
                  setError('');
                }}
                placeholder={String(totalFrames)}
                min={0}
                max={totalFrames}
                className="input w-full font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              动作类别 <span className="text-danger">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input w-full"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <p className="text-xs text-primary-500">
            总帧数: {totalFrames}，区间长度至少需要 5 帧，且不能与其他区间重叠
          </p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-primary-700/50">
          <button onClick={handleClose} className="btn btn-ghost">
            取消
          </button>
          <button onClick={handleSubmit} className="btn btn-primary">
            添加区间
          </button>
        </div>
      </div>
    </div>
  );
};
