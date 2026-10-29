import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, UploadCloud, AlertCircle } from 'lucide-react';
import { ticketService } from '../../services/ticketService.js';
import { CATEGORIES } from '../../utils/constants.js';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const CreateTicket = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Software');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return setError('Please provide both a ticket title and a detailed description.');
    }

    setLoading(true);
    setError('');

    try {
      const ticket = await ticketService.createTicket({
        title: title.trim(),
        category,
        priority,
        description: description.trim(),
      });

      // If attachment selected, upload it
      if (file && ticket?._id) {
        try {
          await ticketService.uploadAttachment(ticket._id, file);
        } catch (uploadErr) {
          console.warn('Attachment upload failed after ticket creation:', uploadErr);
        }
      }

      navigate(`/tickets/${ticket._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create ticket. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xl p-6 sm:p-10">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Create a New Ticket
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Describe your issue and our automated system will route it to the right specialist.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Title *"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg text-sm bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg text-sm bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Low">Low (General guidance, minor issue)</option>
                <option value="Medium">Medium (Affects non-critical workflow)</option>
                <option value="High">High (Impacting daily business work)</option>
                <option value="Critical">Critical (System down, urgent incident)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description *
            </label>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the issue (what happened, error codes, steps to reproduce)..."
              className="w-full p-3 rounded-xl text-xs sm:text-sm bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-750 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Attachment Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Attachments (optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-750 transition-colors">
                <UploadCloud className="w-4 h-4 text-cyan-500" />
                <span>{file ? file.name : 'Choose file (Max 10MB)'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              rightIcon={Send}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
