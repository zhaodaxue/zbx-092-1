import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, ChevronRight, Search, Filter } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { useSampleStore } from '../../store/useSampleStore';
import { formatDate, getWaitTime } from '../../utils/time';
import type { SampleStatus } from '../../types';

const ReviewerQueue: React.FC = () => {
  const navigate = useNavigate();
  const { getReviewerQueue } = useSampleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'all'>('all');

  const queue = getReviewerQueue();

  const filteredQueue = queue.filter((sample) => {
    const matchesSearch = sample.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sample.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (sampleId: string) => {
    navigate(`/reviewer/sample/${sampleId}`);
  };

  const pendingCount = queue.filter(s => s.status === 'pending').length;
  const rejectedCount = queue.filter(s => s.status === 'rejected').length;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">待审队列</h1>
          <p className="text-primary-400">按优先级评分排序（优先级越高、等待时间越长越靠前），含待审核及驳回待重审样本</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card rounded-lg p-4">
            <div className="text-3xl font-bold text-white">{queue.length}</div>
            <div className="text-sm text-primary-400">待处理总数</div>
          </div>
          <div className="card rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-300">{pendingCount}</div>
            <div className="text-sm text-primary-400">待审核</div>
          </div>
          <div className="card rounded-lg p-4">
            <div className="text-3xl font-bold text-danger">{rejectedCount}</div>
            <div className="text-sm text-primary-400">已驳回待重审</div>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
            <input
              type="text"
              placeholder="搜索样本名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-primary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SampleStatus | 'all')}
              className="input w-40"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        </div>

        <div className="card rounded-lg overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-700/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    样本名称
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    标注区间
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    驳回次数
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    等待时间
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-primary-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-primary-500">
                      暂无符合条件的样本
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((sample, index) => (
                    <tr
                      key={sample.id}
                      className="border-b border-primary-700/30 hover:bg-primary-700/30 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(sample.id)}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-4 py-4">
                        <PriorityBadge priority={sample.priority} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-primary-100">{sample.name}</div>
                        <div className="text-xs text-primary-500 font-mono">
                          {sample.totalFrames}帧 · {sample.fps}fps
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={sample.status} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-primary-200 font-mono">
                          {sample.intervals.length} 个
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {sample.rejectCount > 0 ? (
                          <span className="flex items-center gap-1 text-sm text-danger">
                            <AlertCircle size={14} />
                            {sample.rejectCount} 次
                          </span>
                        ) : (
                          <span className="text-sm text-primary-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-1 text-sm text-primary-300">
                          <Clock size={14} className="text-primary-500" />
                          {getWaitTime(sample.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-primary-400">
                          {formatDate(sample.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="flex items-center gap-1 text-sm text-primary-300 group-hover:text-primary-100 transition-colors">
                          审核
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReviewerQueue;
