import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, handleFirestoreError, OperationType, isQuotaExceeded } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userId: string;
}

const AppealModal: React.FC<AppealModalProps> = ({ isOpen, onClose, userEmail, userId }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setError(null);

    if (isQuotaExceeded) {
      setError("Database quota exceeded. Please try again later.");
      setIsSubmitting(false);
      return;
    }

    try {
      const currentUserId = userId || auth.currentUser?.uid;
      const currentUserEmail = userEmail || auth.currentUser?.email;

      if (!currentUserId || !currentUserEmail) {
        throw new Error("User identification missing. Please try logging in again.");
      }

      await addDoc(collection(db, 'appeals'), {
        userId: currentUserId,
        userEmail: currentUserEmail,
        reason: reason.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setReason('');
      }, 3000);
    } catch (err) {
      if (!String(err).includes('Quota limit exceeded') && !String(err).includes('Quota exceeded')) {
        console.error("Error submitting appeal:", err);
      }
      setError("Failed to submit appeal. Please try again later.");
      handleFirestoreError(err, OperationType.CREATE, 'appeals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-neutral-900 border border-white/10 rounded-3xl p-8 max-w-md w-full relative shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Appeal Ban</h2>
              <p className="text-neutral-400 text-sm mt-2">
                If you believe your ban was a mistake, please explain why.
              </p>
            </div>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center"
              >
                <CheckCircle2 className="text-green-500 mx-auto mb-3" size={32} />
                <p className="text-green-500 font-bold">Appeal Submitted!</p>
                <p className="text-green-500/70 text-xs mt-1">Our staff will review your request shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 ml-1">
                    Reason for Appeal
                  </label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide details about why you should be unbanned..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-accent transition-all min-h-[150px] resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-xs">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Appeal
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AppealModal;
