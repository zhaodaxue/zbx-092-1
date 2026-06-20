import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg mx-4 card rounded-lg animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-primary-700/50">
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

        <div className="p-4">
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

          <div className="mt-4 p-3 bg-primary-900/50 rounded">
            <p className="text-xs text-primary-400">
              <span className="text-warning font-medium">提示：</span>
              同一样本被 2 名审核员驳回且原因相似度超过 50%，将自动升级为争议样本，由主管进行终裁。
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-primary-700/50">
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
            className="btn btn-danger"
          >
            {loading ? '提交中...' : '确认驳回'}
          </button>
        </div>
      </div>
    </div>
  );
};
