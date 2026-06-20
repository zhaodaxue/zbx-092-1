import React from 'react';
import { User, Clock, AlertTriangle } from 'lucide-react';
import type { Rejection } from '../../types';
import { formatDate } from '../../utils/time';

interface RejectionHistoryProps {
  rejections: Rejection[];
  similarity?: number;
}

export const RejectionHistory: React.FC<RejectionHistoryProps> = ({
  rejections,
  similarity,
}) => {
  if (rejections.length === 0) {
    return null;
  }

  return (
    <div className="card rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-primary-100">驳回历史</h4>
        {similarity !== undefined && similarity > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            <span className="text-sm text-warning font-medium">
              原因相似度: {(similarity * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {rejections.map((rejection, index) => (
          <div
            key={rejection.id}
            className="pb-4 border-b border-primary-700/30 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5 text-sm text-primary-200">
                <User size={14} className="text-primary-400" />
                <span className="font-medium">{rejection.userName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-primary-500">
                <Clock size={12} />
                <span>{formatDate(rejection.createdAt)}</span>
              </div>
              <span className="badge bg-danger/20 text-danger">第 {index + 1} 次驳回</span>
            </div>
            <p className="text-sm text-primary-300 bg-primary-900/50 rounded p-3">
              {rejection.reason}
            </p>
          </div>
        ))}
      </div>

      {similarity !== undefined && similarity > 0.5 && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded">
          <p className="text-xs text-warning">
            <span className="font-semibold">系统判定：</span>
            两次驳回原因相似度超过 50%，已自动升级为争议样本，需主管进行终裁。
          </p>
        </div>
      )}
    </div>
  );
};
