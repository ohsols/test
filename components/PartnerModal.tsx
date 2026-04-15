import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle } from 'lucide-react';
import { PartnerItem } from '../types';

interface PartnerModalProps {
  partner: PartnerItem;
  onClose: () => void;
}

const PartnerModal: React.FC<PartnerModalProps> = ({ partner, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic uppercase text-white">{partner.name}</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {partner.urls ? (
              partner.urls.map((link, i) => (
                <a 
                  key={i}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full font-black uppercase tracking-widest transition-all"
                >
                  <PlayCircle size={20} />
                  <span>{link.name}</span>
                </a>
              ))
            ) : (
              <a 
                href={partner.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full font-black uppercase tracking-widest transition-all"
              >
                <PlayCircle size={20} />
                <span>VISIT WEBSITE</span>
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PartnerModal;
