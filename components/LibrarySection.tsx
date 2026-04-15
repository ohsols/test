import React from 'react';
import { LibraryItem } from '../types';
import ItemCard from './ItemCard';
import { SearchX } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface LibrarySectionProps {
  title: string;
  items: LibraryItem[];
  category: string;
  searchQuery: string;
  onOpenDetails: (item: LibraryItem, category: string) => void;
  showSearch?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
};

const LibrarySection: React.FC<LibrarySectionProps> = ({ title, items, category, searchQuery, onOpenDetails, showSearch = false }) => {
  const [localSearch, setLocalSearch] = React.useState('');
  const { t } = useLanguage();
  
  const filteredItems = React.useMemo(() => {
    const term = (localSearch || searchQuery).toLowerCase();
    if (!term) return items;
    return items.filter(item => item.t.toLowerCase().includes(term));
  }, [items, localSearch, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic mb-2">
            {title}
          </h2>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">
            {filteredItems.length} {t('Records Found')}
          </p>
        </div>
        
        {showSearch && (
          <div className="relative w-full md:max-w-xs group">
            <input 
              type="text"
              placeholder={`${t('Search...')} ${title.toLowerCase()}`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-bg border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-white transition-all duration-300 text-sm placeholder:text-text-muted"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {localSearch && (
              <button 
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        )}

        <div className="hidden md:block h-1 w-20 bg-white rounded-full"></div>
      </div>

      {filteredItems.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {filteredItems.map((item, idx) => (
            <motion.div 
              key={`${item.t}-${idx}`} 
              variants={itemVariants}
            >
              <ItemCard 
                item={item} 
                category={category} 
                onOpenDetails={onOpenDetails} 
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center opacity-40"
        >
          <SearchX size={64} className="mb-4 text-white" />
          <h3 className="text-xl font-black uppercase tracking-widest italic text-white">{t('No matches')}</h3>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LibrarySection;
