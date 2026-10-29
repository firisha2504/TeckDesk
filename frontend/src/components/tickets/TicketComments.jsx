import React, { useState } from 'react';
import { Send, Lock, MessageSquare, Shield } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { formatDate } from '../../utils/formatDate.js';
import { canViewInternalNotes } from '../../utils/permissions.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const TicketComments = ({
  comments = [],
  onAddComment,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    await onAddComment({ content: content.trim(), isInternal });
    setContent('');
    setIsInternal(false);
  };

  const hasStaffPermissions = canViewInternalNotes(user);

  return (
    <div className="space-y-6">
      {/* Comments Feed */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No comments yet. Start the conversation below.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className={`p-4 rounded-2xl border transition-all ${
                comment.isInternal
                  ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                  : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {comment.author?.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {comment.author?.name ? comment.author.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {comment.author?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 capitalize">
                      ({comment.author?.role})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {comment.isInternal && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Lock className="w-3 h-3" /> Internal Note
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pl-9">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-cyan-500" />
            Add Response
          </label>

          {hasStaffPermissions && (
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-slate-300 dark:border-navy-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Staff Internal Note
              </span>
            </label>
          )}
        </div>

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isInternal
              ? 'Add internal troubleshooting note (visible to technicians and managers only)...'
              : 'Type your message or response here...'
          }
          className={`w-full p-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-navy-950 border text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
            isInternal
              ? 'border-amber-500/40 focus:ring-amber-500'
              : 'border-slate-200 dark:border-navy-750 focus:ring-cyan-500'
          }`}
        />

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            size="sm"
            variant={isInternal ? 'secondary' : 'primary'}
            isLoading={isLoading}
            disabled={!content.trim()}
            rightIcon={Send}
          >
            {isInternal ? 'Post Internal Note' : 'Send Comment'}
          </Button>
        </div>
      </form>
    </div>
  );
};
