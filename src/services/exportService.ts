import type { Sample, ActionCategory, ExportSample } from '../types';

export const generateExportData = (
  samples: Sample[],
  categories: ActionCategory[]
): ExportSample[] => {
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  return samples.map(sample => ({
    id: sample.id,
    name: sample.name,
    totalFrames: sample.totalFrames,
    fps: sample.fps,
    intervals: sample.intervals.map(interval => {
      const category = categoryMap.get(interval.categoryId);
      return {
        startFrame: interval.startFrame,
        endFrame: interval.endFrame,
        category: category?.name || '未知',
        categoryCode: category?.code || 'UNKNOWN',
      };
    }),
    reviewedAt: sample.reviewedAt || sample.updatedAt,
    reviewedBy: sample.reviewedBy || '未知',
  }));
};

export const exportToJson = (data: ExportSample[], filename?: string): void => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `annotations_${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const getExportFilename = (startDate: string, endDate: string): string => {
  const start = startDate.replace(/-/g, '');
  const end = endDate.replace(/-/g, '');
  if (start === end) {
    return `annotations_${start}.json`;
  }
  return `annotations_${start}_to_${end}.json`;
};
