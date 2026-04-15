
import React, { useState, useEffect } from 'react';
import { LibraryItem } from '../types';
import { Loader2 } from 'lucide-react';
import { fetchPoster } from '../services/posters';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

interface ItemCardProps {
  item: LibraryItem;
  category: string;
  onOpenDetails: (item: LibraryItem, category: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = React.memo(({ item, category, onOpenDetails }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(item.img || '');
  const [isSearching, setIsSearching] = useState(false);

  const [translatedTitle, setTranslatedTitle] = useState(item.t);
  const { translateDynamic, language } = useLanguage();
  
  const isPlaceholder = !currentImageUrl || currentImageUrl.includes('placehold.co');

  useEffect(() => {
    let isMounted = true;
    const translate = async () => {
      if (language === 'en-US') {
        if (isMounted) setTranslatedTitle(item.t);
        return;
      }
      
      // Fast check for cache before calling translateDynamic
      const cacheKey = `${language}:${item.t}`;
      const savedCache = JSON.parse(localStorage.getItem('chillzone_translation_cache') || '{}');
      if (savedCache[cacheKey]) {
        if (isMounted) setTranslatedTitle(savedCache[cacheKey]);
        return;
      }

      const translated = await translateDynamic(item.t);
      if (isMounted) setTranslatedTitle(translated);
    };
    translate();
    return () => { isMounted = false; };
  }, [item.t, language, translateDynamic]);

  useEffect(() => {
    const getRealPoster = async () => {
      if (!isPlaceholder || isSearching) return;

      const cacheKey = `poster_${item.t}`;
      const failedKey = `failed_poster_${item.t}`;
      
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setCurrentImageUrl(cached);
        return;
      }
      
      if (localStorage.getItem(failedKey)) return;

      setIsSearching(true);
      try {
        const realUrl = await fetchPoster(item.t, category);
        if (realUrl) {
          setCurrentImageUrl(realUrl);
          localStorage.setItem(cacheKey, realUrl);
        } else {
          localStorage.setItem(failedKey, 'true');
        }
      } catch (err) {
        console.error("Failed to fetch real poster for", item.t, err);
        localStorage.setItem(failedKey, 'true');
      } finally {
        setIsSearching(false);
      }
    };

    getRealPoster();
  }, [item.t, isPlaceholder, category]);

  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onOpenDetails(item, category)}
      className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-bg transition-all duration-300 hover:shadow-2xl cursor-pointer border border-white/5 hover:border-white/50"
    >
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg animate-pulse z-10">
          <Loader2 className="text-white animate-spin" size={20} />
        </div>
      )}
      
      <img 
        src={typeof currentImageUrl === 'string' && currentImageUrl ? currentImageUrl : 'https://picsum.photos/seed/poster/400/600'} 
        alt={item.t} 
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isLoaded ? 'opacity-90' : 'opacity-0'}`}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
      
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-[10px] font-black text-white uppercase italic tracking-tight leading-tight line-clamp-2">
          {translatedTitle}
        </h3>
      </div>
    </motion.div>
  );
});

export default ItemCard;
