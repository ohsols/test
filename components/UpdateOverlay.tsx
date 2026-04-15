import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, X } from 'lucide-react';

export const UpdateOverlay = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'system', 'status'), (snapshot) => {
      if (snapshot.exists()) {
        const updating = snapshot.data().updating === true;
        setIsUpdating(updating);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'system/status');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setIsAdmin(['admin', 'co-owner', 'owner'].includes(role) || auth.currentUser.uid === 'HfjrcUIslZPCvNI3fxiQJVK1ebB3');
        }
      }
    };
    checkAdmin();
  }, [auth.currentUser]);

  const handleGlobalTurnOff = async () => {
    try {
      await updateDoc(doc(db, 'system', 'status'), {
        updating: false,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'system/status');
    }
  };

  return (
    <AnimatePresence>
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
        >
          {isAdmin && (
            <button
              onClick={handleGlobalTurnOff}
              className="absolute top-10 right-10 p-4 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-full text-white transition-all flex items-center gap-2 group"
              title="Turn off Maintenance Mode for everyone"
            >
              <span className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">End Maintenance (Global)</span>
              <X size={24} />
            </button>
          )}

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white">
                UPDATING!!!
              </h1>
              <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-accent animate-spin" />
            </div>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-accent font-black uppercase tracking-[0.3em] text-lg md:text-xl"
            >
              refresh your page.
            </motion.p>

            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-1 bg-accent/20 mx-auto rounded-full overflow-hidden"
            >
              <motion.div 
                animate={{ 
                  x: [-100, 100]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-1/2 h-full bg-accent"
              />
            </motion.div>
          </motion.div>

          <div className="absolute bottom-10 left-0 right-0">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
              ChillZone System Maintenance
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
