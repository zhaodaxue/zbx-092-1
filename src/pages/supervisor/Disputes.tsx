import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, User, ChevronRight } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { useSampleStore } from '../../store/useSampleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDate, framesToTime } from '../../utils/time';

const Disputes: React.FC = () => {
  const navigate = useNavigate();
  const { getDisputeQueue } = useSampleStore();
  const { currentUser } = useAuthStore();
  
  const disputeQueue = getDisputeQueue();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">争议队列</h1>
        <p className="text-primary-400">
          对审核员驳回意见相似度超过 50% 的样本进行终裁
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-900/50 flex items-center justify-center">
              <AlertTriangle className="text-warning-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{disputeQueue.length}</div>
              <div className="text-sm text-primary-400">待终裁样本</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-900/50 flex items-center justify-center">
              <User className="text-success-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{currentUser.name}</div>
              <div className="text-sm text-primary-400">当前主管</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-900/50 flex items-center justify-center">
              <Clock className="text-primary-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {disputeQueue.length > 0 ? formatDate(disputeQueue[0].createdAt) : '-'}
              </div>
              <div className="text-sm text-primary-400">最早提交时间</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-primary-700/50">
          <h2 className="font-semibold text-white">争议样本列表</h2>
        </div>
        
        {disputeQueue.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-800/50 flex items-center justify-center">
              <AlertTriangle className="text-primary-500" size={32} />
            </div>
            <p className="text-primary-400">暂无争议样本</p>
            <p className="text-sm text-primary-500 mt-1">
              当同一样本被 2 名审核员驳回且原因相似度超过 50% 时，会自动进入争议队列
            </p>
          </div>
        ) : (
          <div className="divide-y divide-primary-700/30">
            {disputeQueue.map((sample) => (
              <div
                key={sample.id}
                className="p-4 hover:bg-primary-800/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/supervisor/final/${sample.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-white">{sample.id}</span>
                      <StatusBadge status={sample.status} />
                      <PriorityBadge priority={sample.priority} />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-primary-500">视频时长：</span>
                        <span className="text-primary-300">{framesToTime(sample.totalFrames, sample.fps)}</span>
                      </div>
                      <div>
                        <span className="text-primary-500">区间数：</span>
                        <span className="text-primary-300">{sample.intervals.length} 个</span>
                      </div>
                      <div>
                        <span className="text-primary-500">驳回次数：</span>
                        <span className="text-warning-400">{sample.rejections.length} 次</span>
                      </div>
                      <div>
                        <span className="text-primary-500">相似度：</span>
                        <span className="text-warning-400">
                          {sample.dispute ? `${(sample.dispute.similarity * 100).toFixed(0)}%` : '-'}
                        </span>
                      </div>
                    </div>

                    {sample.rejections.length >= 2 && (
                      <div className="mt-3 p-3 bg-warning-900/20 rounded-lg">
                        <div className="text-xs text-warning-400 mb-2">驳回原因对比</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {sample.rejections.slice(0, 2).map((rejection) => (
                            <div key={rejection.id} className="text-sm">
                              <span className="text-primary-400">{rejection.userName}：</span>
                              <span className="text-primary-300">{rejection.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-primary-500">
                      提交时间：{formatDate(sample.createdAt)}
                    </div>
                  </div>
                  
                  <ChevronRight className="text-primary-500 ml-4 flex-shrink-0" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Disputes;
