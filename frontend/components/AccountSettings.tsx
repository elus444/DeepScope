import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function AccountSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const initial = (user?.email || "?").charAt(0).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  const reset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUpdatePassword = async () => {
    setError("");
    setSuccess(false);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-solid rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-800">Account settings</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile summary */}
            <div className="flex items-center gap-3 mb-6 p-3.5 rounded-xl bg-violet-50/70 border border-violet-100">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-white text-base font-semibold flex items-center justify-center shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.email}</p>
                {memberSince && <p className="text-xs text-slate-400">Member since {memberSince}</p>}
              </div>
            </div>

            {/* Change password */}
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Change password</p>
              <div className="space-y-2.5">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-violet-100 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-shadow"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-violet-100 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-shadow"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-600 mt-2 overflow-hidden"
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-green-600 mt-2 overflow-hidden"
                  >
                    Password updated.
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0, scale: 0.99 }}
                onClick={handleUpdatePassword}
                disabled={saving || !newPassword || !confirmPassword}
                className="btn-primary w-full mt-3.5 flex items-center justify-center"
              >
                {saving ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  "Update password"
                )}
              </motion.button>
            </div>

            <div className="border-t border-violet-100/70 mt-5 pt-4">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl py-2.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
