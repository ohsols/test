import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const DateTimeWidget = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const { language, militaryTime, timeZone } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !militaryTime,
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  if (timeZone !== 'auto') {
    timeOptions.timeZone = timeZone;
    dateOptions.timeZone = timeZone;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 24 }}
      className="bg-bg/60 backdrop-blur-xl text-accent px-6 py-2 rounded-2xl border border-accent/20 shadow-2xl flex flex-row items-center gap-4 hover:border-accent/50 transition-colors cursor-default"
    >
      <div className="text-[10px] font-black uppercase tracking-widest text-accent">
        {dateTime.toLocaleDateString(language, dateOptions).toUpperCase()}
      </div>
      <div className="text-sm font-mono font-bold tracking-tight text-white">
        {dateTime.toLocaleTimeString(language, timeOptions).toUpperCase()}
      </div>
    </motion.div>
  );
};

export default DateTimeWidget;
