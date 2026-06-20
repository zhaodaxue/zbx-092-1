import React from 'react';
import type { SampleStatus, SamplePriority } from '../../types';

interface StatusBadgeProps {
  status: SampleStatus;
}

const statusConfig: Record<SampleStatus, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  approved: { label: '已通过', className: 'bg-success/20 text-success border-success/30' },
  rejected: { label: '已驳回', className: 'bg-danger/20 text-danger border-danger/30' },
  disputed: { label: '争议中', className: 'bg-warning/20 text-warning border-warning/30' },
  locked: { label: '已锁定', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <span className={`badge border ${config.className}`}>
      {config.label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: SamplePriority;
}

const priorityConfig: Record<SamplePriority, { label: string; className: string }> = {
  high: { label: '高', className: 'bg-danger/20 text-danger' },
  normal: { label: '中', className: 'bg-info/20 text-info' },
  low: { label: '低', className: 'bg-primary-500/20 text-primary-300' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = priorityConfig[priority];
  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
};
