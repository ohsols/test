
import React from 'react';
import { X, GitCommit, Calendar } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface UpdateLogProps {
  onClose: () => void;
}

const UPDATES = [
  {
    version: "1.4.0",
    date: "2026-04-02T17:03:00",
    changes: ["Added Over 1k Games"]
  },
  {
    version: "",
    date: "2026-04-02T16:43:34",
    changes: ["Fixed Music Player"]
  },
  {
    version: "",
    date: "2026-04-01T23:01:33",
    changes: ["Added Super Mario Galaxy Movie"]
  },
  {
    version: "1.3.0",
    date: "2026-03-30",
    changes: ["New Theme Added- April Fools Theme 🤡", "New Theme Added- Halloween Theme 🎃"]
  },
  {
    version: "",
    date: "2026-03-26",
    changes: ["JJK Episode 11 and 12 have been added"]
  },
  {
    version: "1.2.0",
    date: "2026-03-26",
    changes: ["Added Games 🎮"]
  },
  {
    version: "",
    date: "2026-03-23",
    changes: ["Invincible Season 4 added"]
  },
  {
    version: "1.1.0",
    date: "2026-03-20",
    changes: ["Added Cloaking, Themes, And A Movie In Website"]
  },
  {
    version: "1.0.0",
    date: "2026-03-10",
    changes: ["Site Release 🎉"]
  }
];

const getDaysAgo = (dateStr: string) => {
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? "Today" : `${diffDays} days ago`;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const UpdateLog: React.FC<UpdateLogProps> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-80 max-h-[400px] flex flex-col bg-black/60 backdrop-blur-2xl text-white rounded-xl overflow-hidden shadow-2xl border border-white/10"
    >
      <div className="p-4 border-b border-surface-hover flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-md z-10">
        <h3 className="font-black uppercase italic tracking-tighter text-lg flex items-center gap-2">
          <GitCommit size={16} className="text-accent" />
          Update Log
        </h3>
        <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="overflow-y-auto custom-scrollbar p-4 space-y-6"
      >
        {UPDATES.map((update, idx) => (
          <motion.div key={idx} variants={itemVariants} className="relative pl-4 border-l border-surface-hover">
            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-surface-hover border border-[#52525b]"></div>
            <div className="flex items-center justify-between mb-2">
              {update.version && <span className="text-accent font-bold text-xs bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">v{update.version}</span>}
              <span className="text-[10px] text-text-secondary font-mono flex items-center gap-1">
                <Calendar size={10} />
                {getDaysAgo(update.date)}
              </span>
            </div>
            <ul className="space-y-1">
              {update.changes.map((change, cIdx) => (
                <li key={cIdx} className="text-xs text-[#d4d4d8] leading-relaxed">
                  • {change}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default UpdateLog;
