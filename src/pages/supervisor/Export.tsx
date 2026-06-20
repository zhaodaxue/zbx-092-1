import React, { useState, useMemo } from 'react';
import { Download, Calendar, FileJson, CheckCircle, XCircle, ChevronRight, Lock, XOctagon } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useSampleStore } from '../../store/useSampleStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { generateExportData, exportToJson, getExportFilename } from '../../services/exportService';
import { formatDate } from '../../utils/time';
import type { Sample } from '../../types';

const isExportable = (s: Sample): boolean => {
  if (s.status === 'approved') return true;
  if (s.status === 'locked' && s.dispute?.finalDecision === 'approved') return true;
  return false;
};

const getFinalDecisionLabel = (s: Sample): { text: string; color: string; icon: React.ReactNode } => {
  if (s.status === 'approved') {
    return { text: '审核通过', color: 'text-success-400', icon: <CheckCircle className="text-success-400" size={16} /> };
  }
  if (s.status === 'locked' && s.dispute?.finalDecision === 'approved') {
    return { text: '终裁通过(锁定)', color: 'text-primary-400', icon: <Lock className="text-primary-400" size={16} /> };
  }
  if (s.status === 'locked' && s.dispute?.finalDecision === 'rejected') {
    return { text: '终裁驳回(锁定)', color: 'text-danger-400', icon: <XOctagon className="text-danger-400" size={16} /> };
  }
  return { text: s.status, color: 'text-primary-400', icon: <XCircle className="text-danger-400" size={16} /> };
};

const Export: React.FC = () => {
  const { samples } = useSampleStore();
  const { categories } = useCategoryStore();
  const { currentUser } = useAuthStore();
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const approvedSamples = useMemo(() => samples.filter(isExportable), [samples]);

  const dateGroups = useMemo(() => {
    const groups: Record<string, Sample[]> = {};
    
    approvedSamples.forEach(sample => {
      if (!sample.reviewedAt) return;
      const date = sample.reviewedAt.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(sample);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, samples: items }));
  }, [approvedSamples]);

  const selectedDateSamples = useMemo(() => {
    const group = dateGroups.find(g => g.date === selectedDate);
    return group?.samples || [];
  }, [dateGroups, selectedDate]);

  const lockedRejectedCount = useMemo(
    () => samples.filter(s => s.status === 'locked' && s.dispute?.finalDecision === 'rejected').length,
    [samples]
  );

  const handleExport = () => {
    if (selectedDateSamples.length === 0) {
      setNotification({ type: 'error', message: '所选日期没有可导出的样本' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const exportData = generateExportData(selectedDateSamples, categories);
      const filename = getExportFilename(selectedDate, selectedDate);
      exportToJson(exportData, filename);
      
      setNotification({ 
        type: 'success', 
        message: `成功导出 ${selectedDateSamples.length} 个样本的标注数据` 
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: 'error', message: '导出失败，请重试' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

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
        <h1 className="text-2xl font-bold text-white mb-2">数据导出</h1>
        <p className="text-primary-400">
          按审核通过日期导出已通过（含终裁通过）样本的修订后标注 JSON 文件
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary-400" />
              选择通过日期
            </h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {dateGroups.length === 0 ? (
                <div className="text-center py-8">
                  <FileJson className="mx-auto text-primary-600 mb-3" size={40} />
                  <p className="text-primary-400 text-sm">暂无已通过的样本</p>
                  {lockedRejectedCount > 0 && (
                    <p className="text-xs text-danger-400 mt-2">
                      另有 {lockedRejectedCount} 个终裁驳回样本不可导出
                    </p>
                  )}
                </div>
              ) : (
                dateGroups.map(({ date, samples: dateSamples }) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between ${
                      selectedDate === date
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-800/30 text-primary-300 hover:bg-primary-800/50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{formatDate(date)}</div>
                      <div className={`text-xs ${selectedDate === date ? 'text-primary-200' : 'text-primary-500'}`}>
                        {dateSamples.length} 个样本
                      </div>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                ))
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={selectedDateSamples.length === 0}
              className="w-full mt-4 btn btn-primary flex items-center justify-center gap-2"
            >
              <Download size={18} />
              导出 JSON
            </button>

            <div className="mt-4 p-3 bg-primary-800/30 rounded-lg">
              <div className="text-xs text-primary-400">导出文件格式</div>
              <div className="text-sm text-primary-300 font-mono mt-1">
                {getExportFilename(selectedDate, selectedDate)}
              </div>
            </div>
          </div>

          <div className="card p-6 mt-6">
            <h3 className="font-semibold text-white mb-3">统计信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-primary-400">已审核通过</span>
                <span className="text-success-400 font-semibold">
                  {approvedSamples.filter(s => s.status === 'approved').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-400">终裁通过(锁定)</span>
                <span className="text-primary-400 font-semibold">
                  {approvedSamples.filter(s => s.status === 'locked').length}
                </span>
              </div>
              {lockedRejectedCount > 0 && (
                <div className="flex items-center justify-between opacity-70">
                  <span className="text-danger-400 line-through">终裁驳回(锁定)</span>
                  <span className="text-danger-400 font-semibold">不可导出 · {lockedRejectedCount}</span>
                </div>
              )}
              <div className="border-t border-primary-700/50 pt-3 flex items-center justify-between">
                <span className="text-white font-medium">总计可导出</span>
                <span className="text-white font-bold text-lg">{approvedSamples.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-primary-700/50 flex items-center justify-between">
              <h2 className="font-semibold text-white">
                {selectedDate ? `${formatDate(selectedDate)} - 待导出样本` : '样本列表'}
              </h2>
              <span className="text-sm text-primary-400">
                共 {selectedDateSamples.length} 个样本
              </span>
            </div>

            {selectedDateSamples.length === 0 ? (
              <div className="p-12 text-center">
                <FileJson className="mx-auto text-primary-600 mb-4" size={48} />
                <p className="text-primary-400">该日期没有可导出的样本</p>
                <p className="text-sm text-primary-500 mt-1">
                  请选择其他日期或等待样本审核完成
                </p>
              </div>
            ) : (
              <div className="divide-y divide-primary-700/30 max-h-[600px] overflow-y-auto scrollbar-thin">
                {selectedDateSamples.map((sample) => {
                  const status = getFinalDecisionLabel(sample);
                  return (
                    <div key={sample.id} className="p-4 hover:bg-primary-800/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-white">{sample.id}</span>
                            <div className="flex items-center gap-1">
                              {status.icon}
                              <span className={`text-xs ${status.color}`}>{status.text}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-primary-500">审核员：</span>
                              <span className="text-primary-300">{sample.reviewedBy || '-'}</span>
                            </div>
                            <div>
                              <span className="text-primary-500">标注区间：</span>
                              <span className="text-primary-300">{sample.intervals.length} 个</span>
                            </div>
                            <div>
                              <span className="text-primary-500">总帧数：</span>
                              <span className="text-primary-300">{sample.totalFrames}</span>
                            </div>
                            <div>
                              <span className="text-primary-500">通过时间：</span>
                              <span className="text-primary-300">
                                {sample.reviewedAt ? formatDate(sample.reviewedAt) : '-'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="text-xs text-primary-500 mb-1">标注类别：</div>
                            <div className="flex flex-wrap gap-1">
                              {[...new Set(sample.intervals.map(a => a.categoryId))].map(catId => {
                                const category = categories.find(c => c.id === catId);
                                return category ? (
                                  <span
                                    key={catId}
                                    className="px-2 py-0.5 rounded text-xs"
                                    style={{ backgroundColor: `${category.color}30`, color: category.color }}
                                  >
                                    {category.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Export;
