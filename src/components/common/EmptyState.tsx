import React from 'react';
import { Film, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  description = 'Nothing to show right now.',
  actionHref,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-8 glass-panel rounded-2xl border border-slate-800">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
        {icon || <Film className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed max-w-sm">{description}</p>
      {actionHref && actionText && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </Link>
      )}
      {onAction && actionText && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
