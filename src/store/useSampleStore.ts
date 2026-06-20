import { create } from 'zustand';
import type { Sample, AnnotationInterval, Rejection, Dispute } from '../types';
import samplesData from '../data/samples.json';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { generateId } from '../utils/time';
import { checkDisputeThreshold } from '../services/similarityService';
import { sortReviewerQueue, sortDisputeQueue, validateInterval } from '../services/sampleService';

interface SampleState {
  samples: Sample[];
  currentSample: Sample | null;
  setCurrentSample: (id: string) => void;
  clearCurrentSample: () => void;
  getReviewerQueue: () => Sample[];
  getDisputeQueue: () => Sample[];
  updateInterval: (sampleId: string, intervalId: string, updates: Partial<AnnotationInterval>) => boolean;
  addInterval: (sampleId: string, startFrame: number, endFrame: number, categoryId: string) => boolean;
  deleteInterval: (sampleId: string, intervalId: string) => void;
  approveSample: (sampleId: string, userName: string) => void;
  rejectSample: (sampleId: string, userId: string, userName: string, reason: string) => { 
    isDisputed: boolean; 
    similarity: number;
    alreadyRejected: boolean;
  };
  finalDecision: (sampleId: string, decision: 'approved' | 'rejected', userName: string) => void;
  getQueueRiskFlag: (sample: Sample, currentUserId: string) => 'none' | 'awaiting-second-rejection' | 'waiting-others';
}

const STORAGE_KEY = 'samples';

export const useSampleStore = create<SampleState>((set, get) => {
  const savedSamples = loadFromStorage<Sample[]>(STORAGE_KEY, null);
  const initialSamples = savedSamples || (samplesData as Sample[]);
  
  if (!savedSamples) {
    saveToStorage(STORAGE_KEY, initialSamples);
  }

  const persistSamples = (samples: Sample[]) => {
    saveToStorage(STORAGE_KEY, samples);
  };

  return {
    samples: initialSamples,
    currentSample: null,

    setCurrentSample: (id: string) => {
      const sample = get().samples.find(s => s.id === id);
      set({ currentSample: sample || null });
    },

    clearCurrentSample: () => {
      set({ currentSample: null });
    },

    getReviewerQueue: () => {
      return sortReviewerQueue(get().samples);
    },

    getDisputeQueue: () => {
      return sortDisputeQueue(get().samples);
    },

    updateInterval: (sampleId: string, intervalId: string, updates: Partial<AnnotationInterval>) => {
      const samples = [...get().samples];
      const sampleIndex = samples.findIndex(s => s.id === sampleId);
      if (sampleIndex === -1) return false;

      const sample = { ...samples[sampleIndex] };
      const intervals = [...sample.intervals];
      const intervalIndex = intervals.findIndex(i => i.id === intervalId);
      if (intervalIndex === -1) return false;

      const interval = { ...intervals[intervalIndex], ...updates };
      
      if (updates.startFrame !== undefined || updates.endFrame !== undefined) {
        const validation = validateInterval(
          interval.startFrame,
          interval.endFrame,
          sample.totalFrames,
          intervals,
          intervalId
        );
        if (!validation.valid) {
          return false;
        }
      }

      interval.isModified = true;
      interval.updatedAt = new Date().toISOString();
      intervals[intervalIndex] = interval;

      sample.intervals = intervals;
      sample.updatedAt = new Date().toISOString();
      samples[sampleIndex] = sample;

      set({ samples, currentSample: sample });
      persistSamples(samples);
      return true;
    },

    addInterval: (sampleId: string, startFrame: number, endFrame: number, categoryId: string) => {
      const samples = [...get().samples];
      const sampleIndex = samples.findIndex(s => s.id === sampleId);
      if (sampleIndex === -1) return false;

      const sample = { ...samples[sampleIndex] };
      
      const validation = validateInterval(
        startFrame,
        endFrame,
        sample.totalFrames,
        sample.intervals
      );
      if (!validation.valid) {
        return false;
      }

      const newInterval: AnnotationInterval = {
        id: `int-${generateId()}`,
        sampleId,
        startFrame,
        endFrame,
        categoryId,
        confidence: 1.0,
        isModified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const intervals = [...sample.intervals, newInterval].sort((a, b) => a.startFrame - b.startFrame);
      sample.intervals = intervals;
      sample.updatedAt = new Date().toISOString();
      samples[sampleIndex] = sample;

      set({ samples, currentSample: sample });
      persistSamples(samples);
      return true;
    },

    deleteInterval: (sampleId: string, intervalId: string) => {
      const samples = [...get().samples];
      const sampleIndex = samples.findIndex(s => s.id === sampleId);
      if (sampleIndex === -1) return;

      const sample = { ...samples[sampleIndex] };
      sample.intervals = sample.intervals.filter(i => i.id !== intervalId);
      sample.updatedAt = new Date().toISOString();
      samples[sampleIndex] = sample;

      set({ samples, currentSample: sample });
      persistSamples(samples);
    },

    approveSample: (sampleId: string, userName: string) => {
      const samples = [...get().samples];
      const sampleIndex = samples.findIndex(s => s.id === sampleId);
      if (sampleIndex === -1) return;

      const sample = { ...samples[sampleIndex] };
      sample.status = 'approved';
      sample.reviewedAt = new Date().toISOString();
      sample.reviewedBy = userName;
      sample.updatedAt = new Date().toISOString();
      samples[sampleIndex] = sample;

      set({ samples, currentSample: sample });
      persistSamples(samples);
    },

    rejectSample: (sampleId: string, userId: string, userName: string, reason: string) => {
      const samples = [...get().samples];
      const sampleIndex = samples.findIndex(s => s.id === sampleId);
      if (sampleIndex === -1) return { isDisputed: false, similarity: 0, alreadyRejected: false };

      const sample = { ...samples[sampleIndex] };
      
      const existingRejection = sample.rejections.find(r => r.userId === userId);
      if (existingRejection) {
        return { isDisputed: false, similarity: 0, alreadyRejected: true };
      }
      
      const rejection: Rejection = {
        id: `rej-${generateId()}`,
        sampleId,
        userId,
        userName,
        reason,
        createdAt: new Date().toISOString(),
      };

      sample.rejections = [...sample.rejections, rejection];
      sample.rejectCount = sample.rejections.length;
      sample.updatedAt = new Date().toISOString();

      const { shouldDispute, similarity, rejectionIds, isSecondRejection } = checkDisputeThreshold(sample.rejections);
      
      if (shouldDispute && rejectionIds) {
        sample.status = 'disputed';
        const dispute: Dispute = {
          id: `dispute-${generateId()}`,
          sampleId,
          similarity,
          rejectionIds,
          triggeredBySecondRejection: !!isSecondRejection,
        };
        sample.dispute = dispute;
      } else {
        sample.status = 'rejected';
      }

      samples[sampleIndex] = sample;
      set({ samples, currentSample: sample });
      persistSamples(samples);

      return { isDisputed: shouldDispute, similarity, alreadyRejected: false };
    },

    getQueueRiskFlag: (sample: Sample, currentUserId: string) => {
      if (sample.status === 'disputed' || sample.status === 'approved' || sample.status === 'locked') {
        return 'none';
      }
      if (sample.rejections.length === 0) {
        return 'none';
      }
      
      const currentUserRejected = sample.rejections.some(r => r.userId === currentUserId);
      const hasOtherRejection = sample.rejections.some(r => r.userId !== currentUserId);
      
      if (currentUserRejected) {
        return 'waiting-others';
      }
      if (hasOtherRejection) {
        return 'awaiting-second-rejection';
      }
      return 'none';
    },

    finalDecision: (sampleId: string, decision: 'approved' | 'rejected', userName: string) => {
      const samples = [...get().samples];
      const sampleIndex = samples.findIndex(s => s.id === sampleId);
      if (sampleIndex === -1) return;

      const sample = { ...samples[sampleIndex] };
      sample.status = 'locked';
      sample.reviewedAt = new Date().toISOString();
      sample.reviewedBy = userName;
      sample.updatedAt = new Date().toISOString();
      
      if (sample.dispute) {
        sample.dispute = {
          ...sample.dispute,
          finalDecision: decision,
          decidedBy: userName,
          decidedAt: new Date().toISOString(),
        };
      }

      samples[sampleIndex] = sample;
      set({ samples, currentSample: sample });
      persistSamples(samples);
    },
  };
});
