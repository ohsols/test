import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Search, Globe, LayoutGrid, WifiOff, Shield } from 'lucide-react';
import { Category } from '../types';

interface HomeProps {
  onNavigate: (category: Category) => void;
  onSearch: (query: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

const Home: React.FC<HomeProps> = ({ onNavigate, onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      onNavigate('browser');
    }
  };

  const sections = [
    {
      title: "Welcome to Monochrome!",
      desc: "Browse the web freely. Let's show you around.",
      icon: <Globe className="text-accent" size={32} />,
    },
    {
      title: "Search Anything",
      desc: "Type a URL or search query into the address bar at the top.",
      icon: <Search className="text-accent" size={32} />,
    },
    {
      title: "Tabs",
      desc: "Open tabs using the + button at the top.",
      icon: <LayoutGrid className="text-accent" size={32} />,
    },
    {
      title: "Bookmarks",
      desc: "Click the star icon at the top to bookmark a page.",
      icon: <Shield className="text-accent" size={32} />,
    },
    {
      title: "Offline Mode",
      desc: "Use the site online at least once to use the site offline.",
      icon: <WifiOff className="text-accent" size={32} />,
    },
    {
      title: "Tab Cloaking",
      desc: "In the settings, click 'Cloak' to disguise the tab into an about:blank page!",
      icon: <Shield className="text-accent" size={32} />,
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto py-12 px-8 space-y-24"
    >
      <div className="text-center space-y-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-8xl md:text-9xl font-display uppercase tracking-tighter leading-none"
        >
          MONO<span className="text-accent">CHROME</span>
        </motion.h1>
        
        <motion.form 
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-2xl mx-auto pt-8"
        >
          <div className="relative group">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Anything..."
              className="w-full bg-surface-hover/50 border border-white/10 rounded-[2rem] py-6 px-8 pl-16 text-white text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-text-muted group-hover:border-white/20"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary w-6 h-6 group-focus-within:text-accent transition-colors" />
          </div>
        </motion.form>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-text-secondary text-sm font-medium tracking-[0.3em] uppercase pt-4"
        >
          Browse without boundaries
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {sections.map((s, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="p-10 bg-surface-hover/30 border border-white/5 rounded-[2.5rem] space-y-6 hover:border-accent/30 transition-all group cursor-default"
          >
            <div className="w-16 h-16 bg-bg rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-accent/10 transition-all duration-300">
              {s.icon}
            </div>
            <h3 className="text-2xl font-display uppercase tracking-tight text-white group-hover:text-accent transition-colors">{s.title}</h3>
            <p className="text-text-secondary font-medium leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="pt-20 text-center space-y-12"
      >
        <div className="space-y-4">
          <h2 className="text-4xl font-display uppercase tracking-tight text-white italic">Our <span className="text-accent">Partners</span></h2>
          <p className="text-text-secondary font-medium">Trusted allies in the decentralized web.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { name: "Helium", url: "https://sites.google.com/view/a7b9c1d3e5f2g4h6i8j0k9l1m3n5o2" },
            { name: "カービィアーケード", url: "https://sites.google.com/view/fus3-bomb/page" },
            { name: "ZGC", url: "https://zgcv2.netlify.app" }
          ].map((p, i) => (
            <motion.a 
              key={i} 
              href={p.url} 
              target="_blank" 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-surface-hover/30 border border-white/5 rounded-2xl text-text-muted font-black uppercase tracking-widest text-[10px] hover:border-accent/30 hover:text-white transition-colors"
            >
              {p.name}
            </motion.a>
          ))}
        </div>

        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.5em] pt-20">
          Secure Archive Access Protocol v2.4.0
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Home;
