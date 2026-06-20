import React from 'react';
import { User, Clock, AlertTriangle, Info } from 'lucide-react';
import type { Rejection } from '../../types';
import { formatDate } from '../../utils/time';

interface RejectionHistoryProps {
  rejections: Rejection[];
  similarity?: number;
  currentUserId?: string;
  disputeTriggered?: boolean;
  disputeTriggeredBySecondRejection?: boolean;
}

export const RejectionHistory: React.FC<RejectionHistoryProps> = ({
  rejections,
  similarity,
  currentUserId,
  disputeTriggered = false,
  disputeTriggeredBySecondRejection,
}) => {
  if (rejections.length === 0) {
    return null;
  }

  const currentUserRejection = currentUserId
    ? rejections.find(r => r.userId === currentUserId)
    : null;

  return (
    <div className="space-y-4">
      {currentUserRejection && (
        <div className="p-3 bg-primary-700/30 border border-primary-600/40 rounded-lg flex items-start gap-2.5">
          <Info size={16} className="text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-primary-300">
            <span className="font-semibold text-primary-200">您已驳回该样本</span>
            <p className="mt-1">同一审核员不可重复驳回，请换其他审核员处理。</p>
            <p className="mt-1 text-primary-400">您的驳回原因：{currentUserRejection.reason}</p>
          </div>
        </div>
      )}

      <div className="card rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-primary-100">驳回历史</h4>
          {similarity !== undefined && similarity > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className={similarity > 0.5 ? 'text-danger' : 'text-warning'} />
              <span className={`text-sm font-medium ${similarity > 0.5 ? 'text-danger' : 'text-warning'}`}>
                原因相似度: {(similarity * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {rejections.map((rejection, index) => {
            const isCurrentUser = currentUserId && rejection.userId === currentUserId;
            return (
              <div
                key={rejection.id}
                className={`pb-4 border-b border-primary-700/30 last:border-0 last:pb-0 ${isCurrentUser ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1.5 text-sm text-primary-200">
                    <User size={14} className="text-primary-400" />
                    <span className="font-medium">
                      {rejection.userName}
                      {isCurrentUser && <span className="ml-1 text-xs text-primary-500">(您)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-primary-500">
                    <Clock size={12} />
                    <span>{formatDate(rejection.createdAt)}</span>
                  </div>
                  <span className={`badge ${isCurrentUser ? 'bg-primary-700/50 text-primary-300' : 'bg-danger/20 text-danger'}`}>
                    第 {index + 1} 次驳回
                  </span>
                </div>
                <p className="text-sm text-primary-300 bg-primary-900/50 rounded p-3">
                  {rejection.reason}
                </p>
              </div>
            );
          })}
        </div>

        {disputeTriggered && similarity !== undefined && similarity > 0.5 && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded">
            <p className="text-xs text-warning">
              <span className="font-semibold">系统判定：</span>
              {disputeTriggeredBySecondRejection ? (
                <>
                  本次是 <span className="font-bold">第 2 名审核员</span> 提交的驳回，
                  原因相似度 {(similarity * 100).toFixed(0)}%，超过 50% 阈值，
                  <span className="font-bold">已自动升级为争议样本</span>，需主管进行终裁。
                </>
              ) : (
                <>
                  两名审核员驳回原因相似度超过 50%，已自动升级为争议样本，需主管进行终裁。
                </>
              )}
            </p>
          </div>
        )}

        {!disputeTriggered && similarity !== undefined && similarity > 0.5 && rejections.length >= 2 && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded">
            <p className="text-xs text-warning">
              <span className="font-semibold">系统判定：</span>
              两名审核员驳回原因相似度 {(similarity * 100).toFixed(0)}%，超过 50% 阈值，
              已自动升级为争议样本，需主管进行终裁。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
