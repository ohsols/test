import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, OperationType, handleFirestoreError, isQuotaExceeded } from '../firebase';
import { collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { Megaphone, X } from 'lucide-react';

export const SiteAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isQuotaExceeded) return;

    const q = query(
      collection(db, 'site_announcements'), 
      where('active', '==', true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'site_announcements');
    });
    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const visibleAnnouncements = announcements.filter(a => {
    if (dismissed.has(a.id)) return false;
    if (!a.createdAt) return true; // Still pending write, show it
    const age = now - a.createdAt.toMillis();
    return age < 60000; // 60 seconds
  });

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {visibleAnnouncements.map(ann => (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-accent text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 pointer-events-auto border border-white/20"
          >
            <Megaphone className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-bold text-sm uppercase tracking-wider">{ann.title}</h4>
              <p className="text-sm text-white/90 mt-1">{ann.content}</p>
            </div>
            <button 
              onClick={() => handleDismiss(ann.id)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
