import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Plus, Info } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { Timeline } from '../../components/Timeline/Timeline';
import { IntervalList } from '../../components/IntervalList/IntervalList';
import { RejectionHistory } from '../../components/RejectionHistory/RejectionHistory';
import { RejectModal } from '../../components/Modal/RejectModal';
import { AddIntervalModal } from '../../components/AddIntervalModal/AddIntervalModal';
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { useSampleStore } from '../../store/useSampleStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDate, framesToTime } from '../../utils/time';
import type { AnnotationInterval } from '../../types';

const SampleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { samples, setCurrentSample, currentSample, updateInterval, addInterval, deleteInterval, approveSample, rejectSample } = useSampleStore();
  const { categories } = useCategoryStore();
  const { currentUser } = useAuthStore();
  
  const [selectedIntervalId, setSelectedIntervalId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleApprove = () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setTimeout(() => {
      approveSample(sample.id, currentUser.name);
      setNotification({ type: 'success', message: '样本已通过审核' });
      setIsSubmitting(false);
      setTimeout(() => navigate('/reviewer/queue'), 1000);
    }, 500);
  };

  const handleReject = (reason: string) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const result = rejectSample(sample.id, currentUser.id, currentUser.name, reason);
      setShowRejectModal(false);
      setIsSubmitting(false);
      
      if (result.isDisputed) {
        setNotification({ 
          type: 'success', 
          message: `样本已驳回，原因相似度 ${(result.similarity * 100).toFixed(0)}%，已自动升级为争议样本，进入主管队列` 
        });
      } else {
        setNotification({ type: 'success', message: '样本已驳回' });
      }
      
      setTimeout(() => navigate('/reviewer/queue'), 1500);
    }, 500);
  };

  const isLocked = sample.status === 'locked';
  const canEdit = !isLocked && (sample.status === 'pending' || sample.status === 'rejected');

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
          onClick={() => navigate('/reviewer/queue')}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>返回队列</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">样本审核</h1>
            <div className="flex items-center gap-4">
              <span className="text-primary-300">样本ID: {sample.id}</span>
              <StatusBadge status={sample.status} />
              <PriorityBadge priority={sample.priority} />
            </div>
          </div>
        </div>
      </div>

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
            模型预标注结果
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-primary-400 mb-1">待审时间</div>
          <div className="text-xl font-semibold text-white">
            {formatDate(sample.createdAt)}
          </div>
          <div className="text-xs text-primary-500 mt-1">
            提交审核日期
          </div>
        </div>
      </div>

      {sample.status === 'rejected' && (
        <div className="bg-danger-900/30 border border-danger-600/50 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Info className="text-danger-400" size={20} />
          <span className="text-danger-300">该样本此前被驳回，请修正标注后重新提交审核</span>
        </div>
      )}

      {isLocked && (
        <div className="bg-warning-900/30 border border-warning-600/50 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Info className="text-warning-400" size={20} />
          <span className="text-warning-300">该样本已被主管终裁锁定，不可修改</span>
        </div>
      )}

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
            onClick={() => setShowRejectModal(true)}
            disabled={isSubmitting}
            className="btn btn-danger flex items-center gap-2"
          >
            <X size={18} />
            驳回
          </button>
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="btn btn-success flex items-center gap-2"
          >
            <Check size={18} />
            通过
          </button>
        </div>
      )}

      {showRejectModal && (
        <RejectModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
          loading={isSubmitting}
        />
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

export default SampleDetail;
