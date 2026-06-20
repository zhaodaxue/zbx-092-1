import React, { useState, useMemo } from 'react';
import { Download, Calendar, FileJson, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useSampleStore } from '../../store/useSampleStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { generateExportData, exportToJson, getExportFilename } from '../../services/exportService';
import { formatDate } from '../../utils/time';

const Export: React.FC = () => {
  const { samples } = useSampleStore();
  const { categories } = useCategoryStore();
  const { currentUser } = useAuthStore();
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const approvedSamples = useMemo(() => {
    return samples.filter(s => s.status === 'approved' || s.status === 'locked');
  }, [samples]);

  const dateGroups = useMemo(() => {
    const groups: Record<string, typeof approvedSamples> = {};
    
    approvedSamples.forEach(sample => {
      const date = sample.updatedAt ? sample.updatedAt.split('T')[0] : sample.createdAt.split('T')[0];
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

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="text-success-400" size={16} />;
    if (status === 'locked') return <CheckCircle className="text-primary-400" size={16} />;
    return <XCircle className="text-danger-400" size={16} />;
  };

  const getStatusText = (status: string) => {
    if (status === 'approved') return '审核通过';
    if (status === 'locked') return '终裁通过(锁定)';
    return status;
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
          按日期导出已通过审核样本的修订后标注 JSON 文件
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary-400" />
              选择日期
            </h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {dateGroups.length === 0 ? (
                <div className="text-center py-8">
                  <FileJson className="mx-auto text-primary-600 mb-3" size={40} />
                  <p className="text-primary-400 text-sm">暂无已通过的样本</p>
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
                {selectedDateSamples.map((sample) => (
                  <div key={sample.id} className="p-4 hover:bg-primary-800/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-white">{sample.id}</span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(sample.status)}
                            <span className="text-xs text-primary-400">{getStatusText(sample.status)}</span>
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
                            <span className="text-primary-500">更新时间：</span>
                            <span className="text-primary-300">
                              {sample.updatedAt ? formatDate(sample.updatedAt) : '-'}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Export;
