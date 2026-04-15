import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError, isQuotaExceeded } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SuggestionModalProps {
  onClose: () => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ onClose }) => {
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;
    
    if (!auth.currentUser) {
      setError('You must be logged in to submit a suggestion.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    if (isQuotaExceeded) {
      setError('Database quota exceeded. Please try again later.');
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'suggestions'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        text: suggestion.trim(),
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      if (!String(err).includes('Quota limit exceeded') && !String(err).includes('Quota exceeded')) {
        console.error('Error submitting suggestion:', err);
      }
      setError('Failed to submit suggestion. Please try again.');
      handleFirestoreError(err, OperationType.CREATE, 'suggestions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-surface-hover rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        <div className="p-6 border-b border-surface-hover flex justify-between items-center bg-bg/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send size={20} className="text-accent" />
            Suggestion Bin
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Suggestion Sent!</h3>
              <p className="text-text-secondary">Thank you for your feedback. Our admins will review it shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  What would you like to suggest?
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Tell us your ideas, feature requests, or feedback..."
                  className="w-full h-32 bg-bg border border-surface-hover rounded-xl p-4 text-white placeholder-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
                  maxLength={2000}
                  required
                />
                <div className="text-right text-xs text-text-secondary mt-1">
                  {suggestion.length}/2000
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !suggestion.trim()}
                className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Suggestion
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SuggestionModal;
