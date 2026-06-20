import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Lock, AlertTriangle, Info, Plus } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { Timeline } from '../../components/Timeline/Timeline';
import { IntervalList } from '../../components/IntervalList/IntervalList';
import { RejectionHistory } from '../../components/RejectionHistory/RejectionHistory';
import { AddIntervalModal } from '../../components/AddIntervalModal/AddIntervalModal';
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { useSampleStore } from '../../store/useSampleStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDate, framesToTime } from '../../utils/time';
import type { AnnotationInterval } from '../../types';

const FinalDecision: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { samples, setCurrentSample, currentSample, updateInterval, addInterval, deleteInterval, finalDecision } = useSampleStore();
  const { categories } = useCategoryStore();
  const { currentUser } = useAuthStore();
  
  const [selectedIntervalId, setSelectedIntervalId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (id) {
      setCurrentSample(id);
    }
    return () => {
      useSampleStore.getState().clearCurrentSample();
    };
  }, [id, setCurrentSample]);

  const sample = currentSample || samples.find(s => s.id === id);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!sample) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-primary-400">样本不存在</p>
        </div>
      </AppLayout>
    );
  }

  const handleUpdateInterval = (intervalId: string, updates: Partial<AnnotationInterval>) => {
    return updateInterval(sample.id, intervalId, updates);
  };

  const handleUpdateCategory = (intervalId: string, categoryId: string) => {
    updateInterval(sample.id, intervalId, { categoryId });
  };

  const handleDeleteInterval = (intervalId: string) => {
    deleteInterval(sample.id, intervalId);
    if (selectedIntervalId === intervalId) {
      setSelectedIntervalId(null);
    }
  };

  const handleAddInterval = (startFrame: number, endFrame: number, categoryId: string) => {
    return addInterval(sample.id, startFrame, endFrame, categoryId);
  };

  const handleFinalApprove = () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setTimeout(() => {
      finalDecision(sample.id, 'approved', currentUser.name);
      setShowConfirm(null);
      setNotification({ type: 'success', message: '终裁完成，样本已通过并锁定' });
      setIsSubmitting(false);
      setTimeout(() => navigate('/supervisor/disputes'), 1500);
    }, 500);
  };

  const handleFinalReject = () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setTimeout(() => {
      finalDecision(sample.id, 'rejected', currentUser.name);
      setShowConfirm(null);
      setNotification({ type: 'success', message: '终裁完成，样本已驳回并锁定' });
      setIsSubmitting(false);
      setTimeout(() => navigate('/supervisor/disputes'), 1500);
    }, 500);
  };

  const isLocked = sample.status === 'locked';
  const canEdit = !isLocked && sample.status === 'disputed';

  return (
    <AppLayout>
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'
        } text-white animate-fadeIn`}>
          {notification.message}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => navigate('/supervisor/disputes')}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>返回争议队列</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">主管终裁</h1>
            <div className="flex items-center gap-4">
              <span className="text-primary-300">样本ID: {sample.id}</span>
              <StatusBadge status={sample.status} />
              <PriorityBadge priority={sample.priority} />
            </div>
          </div>
        </div>
      </div>

      {sample.dispute && (
        <div className="bg-warning-900/30 border border-warning-600/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-warning-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-medium text-warning-300 mb-2">争议信息</div>
              <div className="text-sm text-warning-200 mb-3">
                两名审核员驳回原因相似度：<span className="font-bold">{(sample.dispute.similarity * 100).toFixed(0)}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sample.rejections.slice(0, 2).map((rejection) => (
                  <div key={rejection.id} className="bg-warning-900/30 rounded-lg p-3">
                    <div className="text-xs text-warning-400 mb-1">
                      {rejection.userName} - {formatDate(rejection.createdAt)}
                    </div>
                    <div className="text-sm text-warning-200">{rejection.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="bg-primary-900/30 border border-primary-600/50 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Lock className="text-primary-400" size={20} />
          <span className="text-primary-300">该样本已被终裁锁定，不可修改</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-4">
          <div className="text-sm text-primary-400 mb-1">视频时长</div>
          <div className="text-xl font-semibold text-white">
            {framesToTime(sample.totalFrames, sample.fps)}
          </div>
          <div className="text-xs text-primary-500 mt-1">
            共 {sample.totalFrames} 帧 @ {sample.fps}fps
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-primary-400 mb-1">标注区间数</div>
          <div className="text-xl font-semibold text-white">
            {sample.intervals.length} 个
          </div>
          <div className="text-xs text-primary-500 mt-1">
            当前标注结果
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-primary-400 mb-1">争议时间</div>
          <div className="text-xl font-semibold text-white">
            {formatDate(sample.updatedAt)}
          </div>
          <div className="text-xs text-primary-500 mt-1">
            进入争议队列时间
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">时间轴标注</h2>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              新增区间
            </button>
          )}
        </div>
        
        <Timeline
          intervals={sample.intervals}
          totalFrames={sample.totalFrames}
          fps={sample.fps}
          categories={categories}
          selectedIntervalId={selectedIntervalId}
          onSelectInterval={setSelectedIntervalId}
          onUpdateInterval={handleUpdateInterval}
          disabled={!canEdit}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">区间列表</h2>
          <IntervalList
            intervals={sample.intervals}
            categories={categories}
            fps={sample.fps}
            selectedIntervalId={selectedIntervalId}
            onSelectInterval={setSelectedIntervalId}
            onUpdateCategory={handleUpdateCategory}
            onDelete={handleDeleteInterval}
            disabled={!canEdit}
          />
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">驳回历史</h2>
          <RejectionHistory
            rejections={sample.rejections}
            similarity={sample.dispute?.similarity}
          />
        </div>
      </div>

      {canEdit && (
        <div className="mt-6 flex items-center justify-end gap-4">
          <button
            onClick={() => setShowConfirm('reject')}
            disabled={isSubmitting}
            className="btn btn-danger flex items-center gap-2"
          >
            <X size={18} />
            终裁驳回
          </button>
          <button
            onClick={() => setShowConfirm('approve')}
            disabled={isSubmitting}
            className="btn btn-success flex items-center gap-2"
          >
            <Check size={18} />
            终裁通过
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                showConfirm === 'approve' ? 'bg-success-900/50' : 'bg-danger-900/50'
              }`}>
                <Info className={showConfirm === 'approve' ? 'text-success-400' : 'text-danger-400'} size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {showConfirm === 'approve' ? '确认终裁通过？' : '确认终裁驳回？'}
                </h3>
                <p className="text-sm text-primary-400">此操作将锁定样本，不可撤销</p>
              </div>
            </div>
            
            <div className="bg-primary-800/50 rounded-lg p-3 mb-6">
              <div className="text-sm text-primary-300 flex items-start gap-2">
                <Lock size={16} className="flex-shrink-0 mt-0.5" />
                <span>终裁后样本将被锁定，标注结果不可再修改</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={isSubmitting}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={showConfirm === 'approve' ? handleFinalApprove : handleFinalReject}
                disabled={isSubmitting}
                className={`btn ${showConfirm === 'approve' ? 'btn-success' : 'btn-danger'}`}
              >
                {isSubmitting ? '处理中...' : (showConfirm === 'approve' ? '确认通过' : '确认驳回')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddIntervalModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddInterval}
          categories={categories}
          totalFrames={sample.totalFrames}
        />
      )}
    </AppLayout>
  );
};

export default FinalDecision;
