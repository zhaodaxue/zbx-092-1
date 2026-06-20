export type UserRole = 'reviewer' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type SampleStatus = 'pending' | 'approved' | 'rejected' | 'disputed' | 'locked';
export type SamplePriority = 'high' | 'normal' | 'low';

export interface Sample {
  id: string;
  name: string;
  videoUrl: string;
  totalFrames: number;
  fps: number;
  status: SampleStatus;
  priority: SamplePriority;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectCount: number;
  rejections: Rejection[];
  intervals: AnnotationInterval[];
  dispute?: Dispute;
}

export interface AnnotationInterval {
  id: string;
  sampleId: string;
  startFrame: number;
  endFrame: number;
  categoryId: string;
  confidence: number;
  isModified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActionCategory {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Rejection {
  id: string;
  sampleId: string;
  userId: string;
  userName: string;
  reason: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  sampleId: string;
  similarity: number;
  finalDecision?: 'approved' | 'rejected';
  decidedBy?: string;
  decidedAt?: string;
}

export type DragMode = 'move' | 'resize-left' | 'resize-right' | null;

export interface DragState {
  isDragging: boolean;
  mode: DragMode;
  intervalId: string | null;
  startX: number;
  startFrame: number;
  startEndFrame: number;
}

export interface ExportSample {
  id: string;
  name: string;
  totalFrames: number;
  fps: number;
  intervals: Array<{
    startFrame: number;
    endFrame: number;
    category: string;
    categoryCode: string;
  }>;
  reviewedAt: string;
  reviewedBy: string;
}
