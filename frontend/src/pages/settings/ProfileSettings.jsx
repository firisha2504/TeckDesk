import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Lock, CheckCircle2, Save, Camera, UploadCloud, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';

export const ProfileSettings = () => {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Local Computer Photo Upload State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Sync avatar with auth user updates
  useEffect(() => {
    if (user?.avatar !== undefined) {
      setAvatar(user.avatar || '');
    }
  }, [user?.avatar]);

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setMessage('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setError('Unsupported file format. Please select a JPG, JPEG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must not exceed 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const updatedUser = await uploadAvatar(formData);
      setAvatar(updatedUser.avatar || '');
      setMessage('Profile picture updated successfully.');

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (uploading) return;

    setUploading(true);
    setError('');
    setMessage('');

    try {
      await removeAvatar();
      setAvatar('');
      setMessage('Profile picture removed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to remove profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name,
        avatar,
        skills: skillsArray,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      setMessage('Profile settings successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Update your personal support profile, avatar picture, skills, and security credentials."
      />

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
          {error}
        </div>
      )}

      {/* Profile Photo Management Card */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-500" />
          Profile Picture
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-navy-800">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="New Preview"
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-cyan-500/50 shadow-lg"
                />
              ) : avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-blue-500/30 shadow-md"
                />
              ) : (
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold flex items-center justify-center text-2xl shadow-md">
                  {name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}

              {previewUrl && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500 text-navy-950 shadow">
                  Preview
                </span>
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-cyan-400 border border-blue-500/20 capitalize shrink-0">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.organization?.name || 'TechDesk Support Workspace'}
              </p>
              <p className="text-[11px] text-slate-400">
                JPG, JPEG, PNG, or WebP. Max size: 5 MB.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            {previewUrl ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={UploadCloud}
                  isLoading={uploading}
                  disabled={uploading}
                  onClick={handleSavePhoto}
                >
                  Save Photo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={X}
                  disabled={uploading}
                  onClick={handleCancelSelection}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={Camera}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </Button>
                {avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={Trash2}
                    disabled={uploading}
                    onClick={handleRemovePhoto}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected File Feedback Banner */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-600 dark:text-cyan-400">
            <span className="truncate">
              Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <span className="font-semibold text-[11px] uppercase tracking-wider shrink-0 ml-2">
              Ready to Save
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4">
          <Input
            label="Full Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={User}
          />

          <Input
            label="Email Address"
            type="email"
            disabled
            value={user?.email || ''}
            helperText="Email cannot be changed directly."
            leftIcon={Mail}
          />

          <Input
            label="Or Custom Avatar Image URL"
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
            helperText="Supports direct local file upload above or an external HTTPS photo URL."
          />

          {['technician', 'manager'].includes(user?.role) && (
            <Input
              label="Technical Skills (comma-separated)"
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Hardware, Network, Software, Security"
              helperText="Used by the AI auto-assignment engine to route relevant tickets to you."
            />
          )}
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-500" />
            Change Password
          </h4>

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••••••"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            leftIcon={Save}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
