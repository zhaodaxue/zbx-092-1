import React, { useState, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, TrendingUp, User, Clock } from 'lucide-react';
import type { Rejection } from '../../types';
import { calculateSimilarity } from '../../services/similarityService';
import { formatDate } from '../../utils/time';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
  otherRejections?: Rejection[];
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  otherRejections = [],
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const similarityList = useMemo(() => {
    if (!reason.trim() || otherRejections.length === 0) return [];
    return otherRejections.map(r => ({
      ...r,
      similarity: calculateSimilarity(reason, r.reason),
    }));
  }, [reason, otherRejections]);

  const maxSimilarity = useMemo(() => {
    if (similarityList.length === 0) return 0;
    return Math.max(...similarityList.map(s => s.similarity));
  }, [similarityList]);

  const willTriggerDispute = maxSimilarity > 0.5;

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('请填写驳回原因');
      return;
    }
    if (trimmed.length < 5) {
      setError('驳回原因至少需要 5 个字符');
      return;
    }
    onConfirm(trimmed);
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const getSimColor = (sim: number) => {
    if (sim > 0.5) return 'text-danger font-semibold';
    if (sim > 0.3) return 'text-warning font-medium';
    return 'text-primary-400';
  };

  const getSimBg = (sim: number) => {
    if (sim > 0.5) return 'bg-danger-900/30 border-danger-600/40';
    if (sim > 0.3) return 'bg-warning-900/20 border-warning-600/30';
    return 'bg-primary-800/30 border-primary-700/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg mx-4 card rounded-lg animate-fade-in max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-primary-700/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-danger" />
            <h3 className="text-lg font-semibold text-primary-100">驳回样本</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-primary-400 hover:text-primary-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto scrollbar-thin">
          <label className="block text-sm font-medium text-primary-200 mb-2">
            驳回原因 <span className="text-danger">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="请详细描述驳回原因，如：标注区间不准确、类别判断有误等..."
            className={`w-full h-32 input resize-none ${error ? 'border-danger' : ''}`}
            maxLength={500}
          />
          <div className="flex justify-between mt-2">
            {error ? (
              <span className="text-xs text-danger">{error}</span>
            ) : (
              <span className="text-xs text-primary-500">
                请详细说明驳回原因，便于后续审核参考
              </span>
            )}
            <span className="text-xs text-primary-500">{reason.length}/500</span>
          </div>

          {similarityList.length > 0 && (
            <div className="mt-4 border-t border-primary-700/30 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-primary-200 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary-400" />
                  与历史驳回原因相似度
                </h4>
                <span className={`text-sm font-bold ${willTriggerDispute ? 'text-danger animate-pulse' : 'text-primary-400'}`}>
                  最高: {(maxSimilarity * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2">
                {similarityList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded border ${getSimBg(item.similarity)} transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-xs text-primary-300">
                        <User size={12} className="text-primary-500" />
                        <span className="font-medium">{item.userName}</span>
                        <Clock size={10} className="text-primary-600" />
                        <span className="text-primary-500">{formatDate(item.createdAt)}</span>
                      </div>
                      <span className={`text-xs font-mono ${getSimColor(item.similarity)}`}>
                        {(item.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-primary-400 line-clamp-2">{item.reason}</p>
                  </div>
                ))}
              </div>

              {willTriggerDispute && (
                <div className="mt-3 p-3 bg-danger-900/30 border border-danger-600/40 rounded flex items-start gap-2 animate-pulse">
                  <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-danger-200">
                    <span className="font-semibold">⚠️ 提交后将自动升级为争议样本</span>
                    <p className="mt-1 text-danger-300/90">
                      当前输入与历史驳回原因最高相似度 {(maxSimilarity * 100).toFixed(0)}%，
                      超过 50% 阈值，将进入主管争议队列。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`mt-4 p-3 rounded ${willTriggerDispute ? 'bg-danger-900/20' : 'bg-primary-900/50'}`}>
            <p className="text-xs text-primary-400">
              <span className={`font-medium ${willTriggerDispute ? 'text-danger' : 'text-warning'}`}>提示：</span>
              同一样本被 2 名不同审核员驳回且原因相似度超过 50%，将自动升级为争议样本，由主管进行终裁。
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-primary-700/50 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn btn-ghost"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`btn ${willTriggerDispute ? 'bg-danger hover:bg-danger/90' : 'btn-danger'}`}
          >
            {loading ? '提交中...' : (willTriggerDispute ? '确认驳回(将升级争议)' : '确认驳回')}
          </button>
        </div>
      </div>
    </div>
  );
};
