import type { Sample, SamplePriority } from '../types';

export const calculatePriorityScore = (sample: Sample): number => {
  const now = new Date().getTime();
  const createdAt = new Date(sample.createdAt).getTime();
  const waitHours = (now - createdAt) / (1000 * 60 * 60);
  
  let score = 0;
  
  if (sample.status === 'disputed') {
    score += 1000;
  }
  
  const priorityMultiplier: Record<SamplePriority, number> = {
    high: 3,
    normal: 1,
    low: 0.5,
  };
  
  score += waitHours * priorityMultiplier[sample.priority];
  
  return score;
};

export const sortReviewerQueue = (samples: Sample[]): Sample[] => {
  return [...samples]
    .filter(s => s.status === 'pending' || s.status === 'rejected')
    .sort((a, b) => {
      const scoreA = calculatePriorityScore(a);
      const scoreB = calculatePriorityScore(b);
      return scoreB - scoreA;
    });
};

export const sortDisputeQueue = (samples: Sample[]): Sample[] => {
  return [...samples]
    .filter(s => s.status === 'disputed')
    .sort((a, b) => {
      const similarityA = a.dispute?.similarity || 0;
      const similarityB = b.dispute?.similarity || 0;
      return similarityB - similarityA;
    });
};

export const getApprovedSamplesByDate = (
  samples: Sample[],
  startDate: string,
  endDate: string
): Sample[] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
  
  return samples.filter(s => {
    if (s.status !== 'approved' && s.status !== 'locked') return false;
    if (!s.reviewedAt) return false;
    
    const reviewedAt = new Date(s.reviewedAt).getTime();
    return reviewedAt >= start && reviewedAt < end;
  });
};

export const validateInterval = (
  startFrame: number,
  endFrame: number,
  totalFrames: number,
  existingIntervals: Array<{ id: string; startFrame: number; endFrame: number }>,
  excludeId?: string
): { valid: boolean; error?: string } => {
  if (startFrame < 0) {
    return { valid: false, error: '起始帧不能小于 0' };
  }
  if (endFrame > totalFrames) {
    return { valid: false, error: `结束帧不能超过总帧数 ${totalFrames}` };
  }
  if (startFrame >= endFrame) {
    return { valid: false, error: '起始帧必须小于结束帧' };
  }
  if (endFrame - startFrame < 5) {
    return { valid: false, error: '区间长度至少需要 5 帧' };
  }
  
  for (const interval of existingIntervals) {
    if (excludeId && interval.id === excludeId) continue;
    
    const overlap =
      startFrame < interval.endFrame && endFrame > interval.startFrame;
    
    if (overlap) {
      return { valid: false, error: '区间不能与其他区间重叠' };
    }
  }
  
  return { valid: true };
};
