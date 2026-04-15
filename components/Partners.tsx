import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PARTNERS_DATA } from '../constants';
import { PartnerItem } from '../types';
import { ExternalLink, MessageSquare, PlayCircle } from 'lucide-react';
import PartnerModal from './PartnerModal';

const Partners: React.FC = () => {
  const [selectedPartner, setSelectedPartner] = useState<PartnerItem>(PARTNERS_DATA[0]);
  const [showModal, setShowModal] = useState(false);

  const handlePartnerChange = (partner: PartnerItem) => {
    setSelectedPartner(partner);
    setShowModal(false);
  };

  return (
    <div className="flex h-full bg-bg text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-6 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-xl font-black uppercase italic tracking-tighter mb-4">Partners</h2>
        {PARTNERS_DATA.map((partner, idx) => (
          <button
            key={idx}
            onClick={() => handlePartnerChange(partner)}
            className={`p-4 rounded-xl text-left transition-all duration-300 ${
              selectedPartner.name === partner.name ? 'bg-accent/20 border border-accent/30' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="font-bold">{partner.name}</div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-8">
            <img 
              src={selectedPartner.avatar || 'https://picsum.photos/seed/avatar/200/200'} 
              alt={selectedPartner.name} 
              className="w-24 h-24 rounded-2xl border border-white/10" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter">{selectedPartner.name}</h1>
              <div className="flex items-center gap-2 text-accent text-sm font-bold uppercase tracking-widest">
                <span>PARTNER</span>
                <span>•</span>
                <span>EST. 2026 - MADE BY {selectedPartner.owner}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8">
              <h3 className="text-text-secondary text-xs font-black uppercase tracking-widest mb-4">SOCIALS</h3>
              <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-4 rounded-xl transition-all">
                <MessageSquare size={20} />
                <span>Discord</span>
              </button>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8">
              <h3 className="text-text-secondary text-xs font-black uppercase tracking-widest mb-4">DIRECT ACCESS</h3>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full font-black uppercase tracking-widest transition-all w-full"
              >
                <PlayCircle size={20} />
                <span>VISIT WEBSITE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <PartnerModal 
          partner={selectedPartner}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Partners;
