import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import LibrarySection from './components/LibrarySection';
import Settings, { defaultThemes } from './components/Settings';
import MusicPlayer from './components/MusicPlayer';
import Partners from './components/Partners';
import UpdateLog from './components/UpdateLog';
import DateTimeWidget from './components/DateTimeWidget';
import { GamesHub } from './components/GamesHub';
import { Category, LibraryItem, StaffMember, Game, FavoriteItem } from './types';
import { MANGA_DATA, STAFF_DATA, PARTNERS_DATA, PROXIES_DATA } from './constants';
import { useLanguage } from './context/LanguageContext';
import { auth, logout, db, handleFirestoreError, OperationType, isQuotaExceeded } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, where, getDocs, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import SuggestionModal from './components/SuggestionModal';
import AppealModal from './components/AppealModal';
import { SiteAnnouncements } from './components/SiteAnnouncements';
import { UpdateOverlay } from './components/UpdateOverlay';
import { Search, X, Film, Sparkles, BookOpen, Tv, SearchX, PlayCircle, Star, Globe, Users, ExternalLink, ShieldAlert, Zap, Activity, Loader2, Book, AlertTriangle, Settings as SettingsIcon, GitCommit, ChevronDown, LayoutGrid, Gamepad2, ShieldCheck, LogOut, LogIn, Send } from 'lucide-react';

const DEFAULT_LOGO = "https://lh7-rt.googleusercontent.com/sitesz/AClOY7psM7n5cC2oRAQVLVss3LsgYFKWwE-KzTjGQvDYtnnp1f1j-Szl1OH6r1pZTXpsw0t_1es0N4P9E2cBl4Oqs-lOwNJdAt3H5CiGxGZKfBTzaYq_ybiI1qd2dWXWu_GRWMqLDD_3BL9tkNhJBNJhjBuuQWyvP1B19h6v0fblyHBwfxs-94c7?key=IannGxLsV9P5UfJ0NHPqqQ";

const DiscordIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
  </svg>
);

const TranslatedText: React.FC<{ text: string }> = ({ text }) => {
  const { translateDynamic, language } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let isMounted = true;
    const translate = async () => {
      if (language === 'en-US') {
        if (isMounted) setTranslated(text);
        return;
      }
      
      // Fast check for cache before calling translateDynamic
      const cacheKey = `${language}:${text}`;
      const savedCache = JSON.parse(localStorage.getItem('chillzone_translation_cache') || '{}');
      if (savedCache[cacheKey]) {
        if (isMounted) setTranslated(savedCache[cacheKey]);
        return;
      }

      const result = await translateDynamic(text);
      if (isMounted) setTranslated(result);
    };
    translate();
    return () => { isMounted = false; };
  }, [text, language, translateDynamic]);

  return <>{translated}</>;
};

const ScrambleEffect: React.FC = () => {
  useEffect(() => {
    let interval: any;
    const originalTexts = new Map<HTMLElement, string>();

    const scrambleText = (text: string) => {
      if (!text) return '';
      return text.split(' ').map(word => {
        if (word.length <= 3) return word;
        const chars = word.split('');
        for (let i = chars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
      }).join(' ');
    };

    const runScramble = () => {
      if (document.documentElement.dataset.theme !== 'aprilfools') return;

      // Only target elements that likely contain plain text and are not too complex
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, p, span, button')) as HTMLElement[];
      const targetElements = elements
        .filter(el => {
          // Avoid elements with many children to prevent React crashes
          return el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && Math.random() > 0.9;
        })
        .slice(0, 5);

      targetElements.forEach(el => {
        if (!originalTexts.has(el)) {
          originalTexts.set(el, el.innerText);
        }
        el.innerText = scrambleText(el.innerText);
      });

      setTimeout(() => {
        targetElements.forEach(el => {
          const original = originalTexts.get(el);
          if (original && document.contains(el)) {
            el.innerText = original;
            originalTexts.delete(el);
          }
        });
      }, 1000);
    };

    interval = setInterval(runScramble, 10000);
    return () => {
      clearInterval(interval);
      originalTexts.forEach((text, el) => {
        if (document.contains(el)) {
          el.innerText = text;
        }
      });
    };
  }, []);

  return null;
};

const getInitialCategory = (): Category => {
  const path = window.location.pathname.substring(1).toLowerCase();
  const normalizedPath = path.replace('-', ' ') as Category;
  const validCategories: Category[] = ['home', 'movies', 'tv shows', 'anime', 'manga', 'proxies', 'partners', 'dev', 'support', 'donate', 'apps', 'browser', 'settings', 'music', 'games'];
  
  if (validCategories.includes(normalizedPath)) {
    return normalizedPath;
  }
  return 'donate';
};

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>(getInitialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [proxySearch, setProxySearch] = useState('');
  const [customLogo, setCustomLogo] = useState<string>(DEFAULT_LOGO);

  useEffect(() => {
    const timer = setTimeout(() => {
    }, 800);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const navigate = (cat: Category) => {
    setActiveCategory(cat);
    const path = '/' + cat.replace(' ', '-');
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveCategory(getInitialCategory());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Debugging customLogo
  useEffect(() => {
    if (customLogo !== undefined && typeof customLogo !== 'string' && customLogo !== null) {
      console.warn('App: customLogo is not a string:', customLogo);
    }
  }, [customLogo]);

  const [selectedItem, setSelectedItem] = useState<{item: LibraryItem, category: string, showPlayer: boolean, streamUrl?: string} | null>(null);
  const [isFetchingStream, setIsFetchingStream] = useState(false);

  const fetchTmdbIdAndPlay = async (item: LibraryItem, category: string) => {
    setIsFetchingStream(true);
    try {
      if (category === 'anime') {
        const response = await fetch(`/api/jikan/search?query=${encodeURIComponent(item.t)}`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const malId = data.data[0].mal_id;
          const streamUrl = `https://vidlink.pro/anime/${malId}/1/sub?primaryColor=ff0000&autoplay=false&fallback=true`;
          setSelectedItem({ item, category, showPlayer: true, streamUrl });
        } else {
          console.error('Could not find this anime on MAL to stream.');
          if (item.l) setSelectedItem({ item, category, showPlayer: true });
        }
      } else {
        const type = category === 'tv' || category === 'tv shows' ? 'tv' : 'movie';
        const response = await fetch(`/api/tmdb/search?query=${encodeURIComponent(item.t)}&type=${type}${item.year ? `&year=${item.year}` : ''}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const tmdbId = data.results[0].id;
          const streamUrl = type === 'tv' 
            ? `https://vidlink.pro/tv/${tmdbId}/1/1?primaryColor=ff0000&autoplay=false` // Default to S1E1, could be improved
            : `https://vidlink.pro/movie/${tmdbId}?primaryColor=ff0000&autoplay=false`;
            
          setSelectedItem({ item, category, showPlayer: true, streamUrl });
        } else {
          console.error('Could not find this title on TMDB to stream.');
          // Fallback to original link if available
          if (item.l) {
            setSelectedItem({ item, category, showPlayer: true });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stream ID:', error);
      if (item.l) {
        setSelectedItem({ item, category, showPlayer: true });
      }
    } finally {
      setIsFetchingStream(false);
    }
  };

  // Debugging selectedItem.item.img
  useEffect(() => {
    if (selectedItem?.item?.img !== undefined && typeof selectedItem?.item?.img !== 'string' && selectedItem?.item?.img !== null) {
      console.warn('App: selectedItem.item.img is not a string:', selectedItem.item.img, 'for item:', selectedItem.item.t);
    }
  }, [selectedItem]);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('chillzone_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [hasOpenedUpdateLog, setHasOpenedUpdateLog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isQuotaExceededUI, setIsQuotaExceededUI] = useState(false);
  const [showQuotaPopup, setShowQuotaPopup] = useState(false);
  const [hasShownQuotaPopup, setHasShownQuotaPopup] = useState(false);
  const { t } = useLanguage();
  const [uploads, setUploads] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;

    const path = window.location.pathname.substring(1).toLowerCase().replace('-', ' ');
    
    if (user) {
      // If logged in and on root or landing on default 'donate', go to home
      if (path === '' || (path === 'donate' && activeCategory === 'donate')) {
        navigate('home');
      }
    } else {
      // If not logged in and on root, go to donate
      if (path === '') {
        navigate('donate');
        // Automatically open auth modal for guests
        setIsAuthModalOpen(true);
      }
    }
  }, [user, isAuthReady]);

  useEffect(() => {
    if (!user || !isAuthReady || isQuotaExceeded) return;

    const q = query(collection(db, 'uploads'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUploads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'uploads');
    });
    return () => unsubscribe();
  }, [user, isAuthReady]);

  useEffect(() => {
    const handleFirestoreErrorEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const errInfo = customEvent.detail;
      if (errInfo && errInfo.error && (errInfo.error.includes('Quota limit exceeded') || errInfo.error.includes('Quota exceeded'))) {
        console.warn("Firebase Quota Exceeded. The free daily read/write limit for this database has been reached.");
        setIsQuotaExceededUI(true);
      }
    };

    window.addEventListener('firestore-error', handleFirestoreErrorEvent);
    return () => window.removeEventListener('firestore-error', handleFirestoreErrorEvent);
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady || hasOpenedUpdateLog) return;

    setIsUpdateLogOpen(true);
    setHasOpenedUpdateLog(true);
  }, [user, isAuthReady, hasOpenedUpdateLog]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);
      setUser(currentUser);
      const superAdminUid = 'HfjrcUIslZPCvNI3fxiQJVK1ebB3';
      const defaultAdminEmail = 'darkfn1234567890@gmail.com';
      const isSuperAdminUser = currentUser?.uid === superAdminUid;
      const isDefaultAdmin = currentUser?.email === defaultAdminEmail && currentUser?.emailVerified;
      
      setIsSuperAdmin(isSuperAdminUser);
      if (isSuperAdminUser || isDefaultAdmin) setIsAdmin(true);
      // Admin status will be updated by the database listener
      setIsAuthReady(true);
      
      if (currentUser) {
        setIsAuthModalOpen(false);
        
        // Ensure user document exists
        if (!isQuotaExceeded) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
              console.log("[App] Creating missing user document for:", currentUser.email);
              await setDoc(userDocRef, {
                uid: currentUser.uid,
                email: currentUser.email || null,
                displayName: currentUser.displayName || null,
                photoURL: currentUser.photoURL || null,
                role: (currentUser.uid === superAdminUid || isDefaultAdmin) ? 'admin' : 'user',
                createdAt: serverTimestamp()
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, 'users');
          }
        }
      } else {
        setFavorites([]);
        setIsBanned(false);
        localStorage.removeItem('chillzone_favorites');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady || isQuotaExceeded) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.customLogo) {
          setCustomLogo(data.customLogo);
          localStorage.setItem('chillzone_custom_logo', data.customLogo);
        }
        if (data.favorites) {
          setFavorites(data.favorites);
          localStorage.setItem('chillzone_favorites', JSON.stringify(data.favorites));
        }
        if (data.theme) {
          localStorage.setItem('custom_theme_id', data.theme);
          if (data.customThemes) {
            localStorage.setItem('custom_themes', data.customThemes);
          }
          // Apply theme
          const savedThemes = localStorage.getItem('custom_themes');
          const customThemes = savedThemes ? JSON.parse(savedThemes) : { ...defaultThemes };
          const activeTheme = customThemes[data.theme] || defaultThemes.chillzone;
          
          const root = document.documentElement;
          root.style.setProperty('--bg', activeTheme.colors.bg);
          root.style.setProperty('--text-primary', activeTheme.colors.textPrimary);
          root.style.setProperty('--surface', activeTheme.colors.surface);
          root.style.setProperty('--border', activeTheme.colors.border);
          root.style.setProperty('--accent', activeTheme.colors.accent);
          root.style.setProperty('--surface-hover', activeTheme.colors.surfaceHover);
          
          const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 0, 0';
          };
          
          const rgb = hexToRgb(activeTheme.colors.accent);
          root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.3)`);
          root.style.setProperty('--accent-glow-dim', `rgba(${rgb}, 0.1)`);
          root.dataset.theme = data.theme;
        }
        
        // Update admin status based on role in database and super admin UID
        const superAdminUid = 'HfjrcUIslZPCvNI3fxiQJVK1ebB3';
        const defaultAdminEmail = 'darkfn1234567890@gmail.com';
        const isSuperAdminUser = user.uid === superAdminUid;
        const isDefaultAdmin = user.email === defaultAdminEmail && user.emailVerified;
        const isAdminRole = ['admin', 'co-owner', 'owner'].includes(data.role || '');
        
        setIsSuperAdmin(isSuperAdminUser);
        setIsAdmin(isSuperAdminUser || isDefaultAdmin || isAdminRole);
        setIsBanned(data.banned === true && !isSuperAdminUser);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });
    return () => unsubscribe();
  }, [user, isAuthReady]);

  useEffect(() => {
    const savedLogo = localStorage.getItem('chillzone_custom_logo');
    if (savedLogo) setCustomLogo(savedLogo);
    
    // Load custom theme
    const currentThemeId = localStorage.getItem('custom_theme_id') || 'chillzone';
    const savedThemes = localStorage.getItem('custom_themes');
    const customThemes = savedThemes ? JSON.parse(savedThemes) : { ...defaultThemes };
    
    // Merge new default themes if they don't exist in saved themes
    Object.keys(defaultThemes).forEach(key => {
      if (!customThemes[key]) {
        customThemes[key] = defaultThemes[key];
      }
    });

    const activeTheme = customThemes[currentThemeId] || defaultThemes.chillzone;
    
    const root = document.documentElement;
    root.style.setProperty('--bg', activeTheme.colors.bg);
    root.style.setProperty('--text-primary', activeTheme.colors.textPrimary);
    root.style.setProperty('--surface', activeTheme.colors.surface);
    root.style.setProperty('--border', activeTheme.colors.border);
    root.style.setProperty('--accent', activeTheme.colors.accent);
    root.style.setProperty('--surface-hover', activeTheme.colors.surfaceHover);
    
    // Convert hex to rgba for glows
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 0, 0';
    };
    
    const rgb = hexToRgb(activeTheme.colors.accent);
    root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.3)`);
    root.style.setProperty('--accent-glow-dim', `rgba(${rgb}, 0.1)`);
    root.dataset.theme = currentThemeId;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedItem?.showPlayer) {
          setSelectedItem({...selectedItem, showPlayer: false});
        } else if (selectedItem) {
          setSelectedItem(null);
        } else if (false) {
        } else if (isAuthModalOpen) {
          setIsAuthModalOpen(false);
        } else if (isAdminOpen) {
          setIsAdminOpen(false);
        } else if (isSuggestionModalOpen) {
          setIsSuggestionModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'EXIT_GAME') {
        // Game exit handled by GamesHub now
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1).toLowerCase();
      const normalizedPath = path.replace('-', ' ') as Category;
      const validCategories: Category[] = ['home', 'movies', 'tv shows', 'anime', 'manga', 'proxies', 'partners', 'dev', 'support', 'donate', 'apps', 'browser', 'settings', 'music', 'games'];
      
      if (validCategories.includes(normalizedPath)) {
        setActiveCategory(normalizedPath);
      } else {
        setActiveCategory('donate');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleUpdateLogo = (newLogoUrl: string) => {
    setCustomLogo(newLogoUrl);
    localStorage.setItem('chillzone_custom_logo', newLogoUrl);
    
    // Sync to Firebase if logged in
    if (user && !isQuotaExceeded) {
      updateDoc(doc(db, 'users', user.uid), {
        customLogo: newLogoUrl
      }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      });
    }
  };

  const handleOpenDetails = (item: LibraryItem, category: string) => {
    setSelectedItem({ item, category, showPlayer: false });
  };

  const handleStaffClick = (staff: StaffMember) => {
    if (staff.link) {
      setSelectedStaff(staff);
    }
  };

  const onToggleFavorite = async (item: FavoriteItem) => {
    let newFavorites: FavoriteItem[];
    setFavorites(prev => {
      const exists = prev.find(f => f.id === item.id);
      if (exists) {
        newFavorites = prev.filter(f => f.id !== item.id);
      } else {
        newFavorites = [...prev, item];
      }
      
      localStorage.setItem('chillzone_favorites', JSON.stringify(newFavorites));
      
      // Sync to Firebase if logged in
      if (user && !isQuotaExceeded) {
        updateDoc(doc(db, 'users', user.uid), {
          favorites: newFavorites
        }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        });
      }
      
      return newFavorites;
    });
  };

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const [searchCategory, setSearchCategory] = useState<'all' | 'movies' | 'tv' | 'anime' | 'manga'>('all');

  const [moviesData, setMoviesData] = useState<LibraryItem[]>([]);
  const [tvData, setTvData] = useState<LibraryItem[]>([]);
  const [animeData, setAnimeData] = useState<LibraryItem[]>([]);
  const [isFetchingTrending, setIsFetchingTrending] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsFetchingTrending(true);
      try {
        const [moviesRes, tvRes, animeRes] = await Promise.all([
          fetch('/api/tmdb/trending/movie'),
          fetch('/api/tmdb/trending/tv'),
          fetch('/api/tmdb/trending/anime')
        ]);
        
        const moviesJson = await moviesRes.json();
        const tvJson = await tvRes.json();
        const animeJson = await animeRes.json();
        
        const mapTmdbToLibraryItem = (item: any): LibraryItem => ({
          t: item.title || item.name,
          img: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
          banner: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : undefined,
          desc: item.overview,
          year: item.release_date ? parseInt(item.release_date.substring(0, 4)) : (item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : undefined),
          rating: item.vote_average
        });

        if (moviesJson.results) setMoviesData(moviesJson.results.map(mapTmdbToLibraryItem));
        if (tvJson.results) setTvData(tvJson.results.map(mapTmdbToLibraryItem));
        if (animeJson.results) setAnimeData(animeJson.results.map(mapTmdbToLibraryItem));
      } catch (error) {
        console.error('Failed to fetch trending data:', error);
      } finally {
        setIsFetchingTrending(false);
      }
    };
    
    fetchTrending();
  }, []);

  const [searchResults, setSearchResults] = useState<{ movies: LibraryItem[], tv: LibraryItem[], anime: LibraryItem[], manga: LibraryItem[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const q = encodeURIComponent(searchQuery.trim());
        const [moviesRes, tvRes] = await Promise.all([
          fetch(`/api/tmdb/search?query=${q}&type=movie`),
          fetch(`/api/tmdb/search?query=${q}&type=tv`)
        ]);
        
        const moviesJson = await moviesRes.json();
        const tvJson = await tvRes.json();
        
        const mapTmdbToLibraryItem = (item: any): LibraryItem => ({
          t: item.title || item.name,
          img: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
          banner: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : undefined,
          desc: item.overview,
          year: item.release_date ? parseInt(item.release_date.substring(0, 4)) : (item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : undefined),
          rating: item.vote_average
        });

        const allTv = tvJson.results ? tvJson.results.map(mapTmdbToLibraryItem) : [];
        // Simple heuristic: if it has animation genre, put it in anime
        const animeResults = tvJson.results ? tvJson.results.filter((item: any) => item.genre_ids?.includes(16) && item.original_language === 'ja').map(mapTmdbToLibraryItem) : [];
        const tvResults = allTv.filter(item => !animeResults.find((a: any) => a.t === item.t));

        const results = {
          movies: moviesJson.results ? moviesJson.results.map(mapTmdbToLibraryItem) : [],
          anime: animeResults,
          manga: MANGA_DATA.filter(item => item.t.toLowerCase().includes(searchQuery.toLowerCase())),
          tv: tvResults,
        };

        if (searchCategory !== 'all') {
          setSearchResults({
            movies: searchCategory === 'movies' ? results.movies : [],
            anime: searchCategory === 'anime' ? results.anime : [],
            manga: searchCategory === 'manga' ? results.manga : [],
            tv: searchCategory === 'tv' ? results.tv : [],
          });
        } else {
          setSearchResults(results);
        }
      } catch (error) {
        console.error('Failed to fetch search results:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearchResults, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchCategory]);

  const totalMatches = searchResults ? 
    searchResults.movies.length + searchResults.anime.length + searchResults.manga.length + searchResults.tv.length : 0;

  // Check if the current link is a fallback search link
  const isSearchLink = selectedItem?.item.l?.includes('drive.google.com/drive/search');

  if (isBanned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#0a0a0a] border border-red-500/20 rounded-[32px] p-12 shadow-2xl shadow-red-500/10"
        >
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-4">Access Denied</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Your account has been permanently banned for violating our community guidelines and terms of service.
          </p>
          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Protocol: Violation-403</p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsAppealModalOpen(true)}
              className="w-full py-4 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-accent/20"
            >
              Appeal Ban
            </button>
          </div>
        </motion.div>
        <AppealModal 
          isOpen={isAppealModalOpen} 
          onClose={() => setIsAppealModalOpen(false)} 
          userEmail={user?.email || ''} 
          userId={user?.uid || ''} 
        />
      </div>
    );
  }

  // Removed force login block

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <UpdateOverlay />
      <ScrambleEffect />
      <SiteAnnouncements />
      <div id="app" className="fixed inset-0 flex flex-col overflow-hidden bg-bg text-text-primary">
        {/* Donation Banner */}
        <div className="bg-black text-white py-2 px-4 text-sm font-bold z-[60] relative flex items-center shadow-lg border-b border-white/10 overflow-hidden">
          <div className="flex-1 overflow-hidden relative h-6 flex items-center">
            <div className="animate-marquee absolute w-full text-left">
              Don't Forget You Can Pay For Custom Movies, Animes, Tv Shows, OR WTV U Want!
            </div>
          </div>
          <button 
            onClick={() => navigate('donate')} 
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-1 rounded-full text-xs uppercase tracking-wider transition-colors shrink-0 ml-4 z-10 relative"
          >
            Donate
          </button>
        </div>

        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-60" style={{ background: 'var(--accent-glow-dim)', filter: 'blur(160px)', transform: 'translateZ(0)' }}></div>
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'rgba(37,99,235,0.05)', filter: 'blur(130px)', transform: 'translateZ(0)' }}></div>
        </div>

        <div className="relative z-20 flex items-center justify-between p-4 bg-bg/80 backdrop-blur-md border-b border-white/5">
            <button 
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                className="p-2 rounded-xl bg-surface-hover border border-white/5 text-text-secondary hover:text-white"
            >
                {isSidebarVisible ? <X size={20} /> : <LayoutGrid size={20} />}
            </button>
            <div className="text-xs text-text-secondary">© 2026 ChillZone</div>
        </div>

        {!isAuthModalOpen && !isAdminOpen && (
            <Sidebar 
            activeCategory={activeCategory} 
            logoUrl={customLogo} 
            onLogoChange={handleUpdateLogo}
            isAdmin={isAdmin}
            isSidebarVisible={isSidebarVisible}
            onSelect={navigate}
            />
        )}
        
        <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-auto custom-scrollbar">
          <header className="sticky top-0 z-40 border-b border-surface-hover p-4 md:p-6 flex justify-between items-center shrink-0 bg-bg/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <DateTimeWidget />
            </div>
            <div className="flex items-center gap-3 relative">
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isQuotaExceededUI && !hasShownQuotaPopup) {
                      setShowQuotaPopup(true);
                    } else {
                      setIsAdminOpen(true);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all duration-300 relative"
                  title="Admin Dashboard"
                >
                  <ShieldCheck size={18} />
                  {isQuotaExceededUI && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-bg text-[10px] font-black text-white shadow-lg"
                    >
                      !
                    </motion.div>
                  )}
                </motion.button>
              )}

              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 relative ${
                    isSettingsOpen 
                      ? 'bg-accent border-accent text-white' 
                      : 'bg-surface-hover border-white/5 text-text-secondary hover:text-white hover:border-white/20'
                  }`}
                  title={t('Settings')}
                >
                  <motion.div
                    animate={{ rotate: isSettingsOpen ? 180 : 0 }}
                    transition={{ duration: 0.4, ease: "backOut" }}
                  >
                    <SettingsIcon size={18} />
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {isSettingsOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsSettingsOpen(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                        className="absolute top-14 right-0 z-50 bg-surface border border-surface-hover rounded-2xl shadow-2xl overflow-hidden w-[400px] max-h-[80vh] flex flex-col"
                      >
                        <Settings onClose={() => setIsSettingsOpen(false)} />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSuggestionModalOpen(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-white/5 text-text-secondary hover:text-white hover:border-white/20 transition-all duration-300"
                  title="Suggestion Bin"
                >
                  <Send size={18} />
                </motion.button>
              )}

              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUpdateLogOpen(!isUpdateLogOpen)} 
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 relative ${
                    isUpdateLogOpen 
                      ? 'bg-accent border-accent text-white' 
                      : 'bg-surface-hover border-white/5 text-text-secondary hover:text-white hover:border-white/20'
                  }`}
                  title="Update Log"
                >
                  <GitCommit size={18} />
                </motion.button>
                <AnimatePresence>
                  {isUpdateLogOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsUpdateLogOpen(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                        className="absolute top-14 right-0 z-50 bg-surface border border-surface-hover rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <UpdateLog onClose={() => setIsUpdateLogOpen(false)} />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={user ? logout : () => setIsAuthModalOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-white/5 text-text-secondary hover:text-white hover:border-white/20 transition-all duration-300"
                title={user ? "Logout" : "Login / Sign Up"}
              >
                {user ? <LogOut size={18} /> : <LogIn size={18} />}
              </motion.button>

              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="http://discord.gg/cuHARsXESW" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-white/5 text-text-secondary hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-all duration-300 relative"
                title="Discord"
              >
                <DiscordIcon size={18} />
              </motion.a>
            </div>
          </header>

          <div id="content-area" className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 custom-scrollbar overscroll-contain">
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {/* Hero Section */}
                  <motion.section 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className=""
                    >
                    </motion.section>
                  {searchQuery ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12 pb-24"
                >
                   <div className="flex flex-wrap gap-2 mb-8">
                     {(['all', 'movies', 'tv', 'anime', 'manga'] as const).map(cat => (
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         key={cat}
                         onClick={() => setSearchCategory(cat)}
                         className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-300 ${
                           searchCategory === cat 
                             ? 'bg-accent text-white border-accent' 
                             : 'bg-bg text-text-secondary border-surface-hover hover:border-accent/50 hover:text-white'
                         }`}
                       >
                         {cat === 'all' ? t('All Categories') : t(cat.charAt(0).toUpperCase() + cat.slice(1))}
                       </motion.button>
                     ))}
                   </div>
                   {searchResults?.movies.length ? <LibrarySection title={t('Movies')} items={searchResults.movies} category="movie" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {searchResults?.tv.length ? <LibrarySection title={t('TV Shows')} items={searchResults.tv} category="tv" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {searchResults?.anime.length ? <LibrarySection title={t('Anime')} items={searchResults.anime} category="anime" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {searchResults?.manga.length ? <LibrarySection title={t('Manga')} items={searchResults.manga} category="manga" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {totalMatches === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-40 text-center opacity-40"
                      >
                        <SearchX size={80} className="mb-6 text-accent" />
                        <h2 className="text-2xl font-black uppercase tracking-widest italic mb-2 text-white">No matches</h2>
                      </motion.div>
                   )}
                </motion.div>
              ) : (
                <>
                  <div className={activeCategory === 'music' ? 'block' : 'hidden'}>
                    <MusicPlayer />
                  </div>
                  <AnimatePresence mode="wait">
                    {activeCategory !== 'music' && (
                      <motion.div 
                        key={activeCategory}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full pb-24"
                      >
                    {activeCategory === 'support' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-12 space-y-16"
                      >
                        <div className="text-center">
                          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white mb-4">
                            {t('Devs')}
                          </h1>
                          <p className="text-text-muted text-lg font-medium max-w-2xl mx-auto">
                            {t('The team behind ChillZone.')} <span className="text-accent font-bold">{t('Click on our cards')}</span> {t('to visit our personal sites and socials!')}
                          </p>
                        </div>
                        <section>
                          <motion.div 
                            initial="hidden"
                            animate="show"
                            variants={{
                              hidden: { opacity: 0 },
                              show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                              }
                            }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
                          >
                            {STAFF_DATA.map((staff, idx) => (
                              <motion.div 
                                variants={{
                                  hidden: { opacity: 0, y: 15 },
                                  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
                                }}
                                whileHover={{ y: -10 }}
                                key={idx} 
                                onClick={() => handleStaffClick(staff)} 
                                className={`bg-bg border border-surface-hover p-10 rounded-[48px] text-center group hover:border-accent/40 transition-all duration-700 shadow-2xl overflow-hidden relative ${staff.link ? 'cursor-pointer hover:bg-surface-hover' : ''}`}
                              >
                                <div className="w-40 h-40 mx-auto mb-10 rounded-[40px] overflow-hidden border-2 border-surface-hover group-hover:border-accent/40 transition-all duration-700 shadow-inner relative bg-bg">
                                  {staff.img ? (
                                    <img 
                                      src={typeof staff.img === 'string' && staff.img ? staff.img : 'https://picsum.photos/seed/avatar/200/200'} 
                                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-text-muted"><Users size={48} /></div>
                                  )}
                                </div>
                                <h3 className="text-2xl font-black mb-3 italic uppercase text-white"><TranslatedText text={staff.name} /></h3>
                                <p className="text-accent font-black text-[9px] uppercase tracking-[0.35em]"><TranslatedText text={staff.role} /></p>
                                {staff.link && (
                                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-accent text-white text-[8px] font-black uppercase tracking-widest py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-lg">
                                      <ExternalLink size={10} /> {t('Visit Site')}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </motion.div>
                        </section>
                      </motion.div>
                    )}

                    {activeCategory === 'donate' && (
                      <div className="py-12">
                        <section className="bg-bg rounded-[48px] p-12 md:p-20 border border-surface-hover text-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000')] bg-cover bg-center opacity-10 blur-sm"></div>
                          <div className="relative z-10">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 20 }}
                              className="w-24 h-24 bg-bg rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/30 shadow-[0_0_40px_var(--accent-glow)]"
                            >
                              <Activity size={48} className="text-accent" />
                            </motion.div>
                            <motion.h1 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-8"
                            >
                              {t('Donate')}
                            </motion.h1>
                            <motion.p 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="text-text-muted text-xl max-w-2xl mx-auto mb-12 font-medium"
                            >
                              {t('Click Which Ever Donation App U Want To Donate On')}
                            </motion.p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                              <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                href="https://cash.app/$7yari" target="_blank" rel="noopener noreferrer" className="bg-bg border border-surface-hover p-8 rounded-3xl hover:border-[#00d632] transition-all duration-300 group flex flex-col items-center text-center"
                              >
                                <img src="https://cdn.simpleicons.org/cashapp/white" alt="Cash App" className="h-12 w-12 mb-4 object-contain" referrerPolicy="no-referrer" />
                                <div className="text-3xl font-black text-white mb-2"><TranslatedText text="CASH APP" /></div>
                                <p className="text-text-secondary text-xs font-bold uppercase tracking-widest group-hover:text-[#00d632]">{t('Instant Transfer')}</p>
                              </motion.a>
                              <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                href="https://www.venmo.com/u/ohsols" target="_blank" rel="noopener noreferrer" className="bg-[#008CFF] border border-[#008CFF] p-8 rounded-3xl hover:bg-[#008CFF]/90 transition-all duration-300 shadow-[0_0_30px_rgba(0,140,255,0.4)] flex flex-col items-center text-center"
                              >
                                <img src="https://cdn.simpleicons.org/venmo/white" alt="Venmo" className="h-12 w-12 mb-4 object-contain" referrerPolicy="no-referrer" />
                                <div className="text-3xl font-black text-white mb-2"><TranslatedText text="VENMO" /></div>
                                <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{t('Mobile Payment')}</p>
                              </motion.a>
                              <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                href="https://paypal.me/ohsols" target="_blank" rel="noopener noreferrer" className="bg-bg border border-surface-hover p-8 rounded-3xl hover:border-[#0070ba] transition-all duration-300 group flex flex-col items-center text-center"
                              >
                                <img src="https://cdn.simpleicons.org/paypal/white" alt="PayPal" className="h-12 w-12 mb-4 object-contain" referrerPolicy="no-referrer" />
                                <div className="text-3xl font-black text-white mb-2"><TranslatedText text="PAYPAL" /></div>
                                <p className="text-text-secondary text-xs font-bold uppercase tracking-widest group-hover:text-[#0070ba]">{t('Direct Transfer')}</p>
                              </motion.a>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}

                    {activeCategory === 'games' && (
                      <GamesHub />
                    )}
                    {activeCategory === 'movies' && (
                      <>
                        {uploads.filter(u => u.type === 'movie').length > 0 && (
                          <LibrarySection title={t('New Movies')} items={uploads.filter(u => u.type === 'movie').map(u => ({ t: u.title, l: u.driveLink, img: u.imageLink }))} category="movie" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                        )}
                        <LibrarySection title={t('Trending Movies')} items={moviesData} category="movie" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                      </>
                    )}
                    {activeCategory === 'tv shows' && (
                      <>
                        {uploads.filter(u => u.type === 'tv').length > 0 && (
                          <LibrarySection title={t('New TV Shows')} items={uploads.filter(u => u.type === 'tv').map(u => ({ t: u.title, l: u.driveLink, img: u.imageLink }))} category="tv" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                        )}
                        <LibrarySection title={t('Trending TV Shows')} items={tvData} category="tv" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                      </>
                    )}
                    {activeCategory === 'anime' && (
                      <>
                        {uploads.filter(u => u.type === 'anime').length > 0 && (
                          <LibrarySection title={t('New Anime')} items={uploads.filter(u => u.type === 'anime').map(u => ({ t: u.title, l: u.driveLink, img: u.imageLink }))} category="anime" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                        )}
                        <LibrarySection title={t('Trending Animes')} items={animeData} category="anime" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                      </>
                    )}
                    {activeCategory === 'manga' && (
                      <>
                        {uploads.filter(u => u.type === 'manga').length > 0 && (
                          <LibrarySection title={t('New Manga')} items={uploads.filter(u => u.type === 'manga').map(u => ({ t: u.title, l: u.driveLink, img: u.imageLink }))} category="manga" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                        )}
                        <LibrarySection title={t('Mangas')} items={MANGA_DATA} category="manga" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />
                      </>
                    )}
                    
                    {activeCategory === 'proxies' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-12 px-6"
                      >
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-10">{t('Proxies')}</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {PROXIES_DATA.map((proxy, idx) => (
                            <a 
                              key={idx} 
                              href={proxy.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-surface-hover p-6 rounded-xl border border-white/5 hover:border-accent/40 transition-colors flex items-center justify-between group"
                            >
                              <span className="text-white font-bold"><TranslatedText text={proxy.name || proxy.url} /></span>
                              <ExternalLink size={16} className="text-text-secondary group-hover:text-accent" />
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeCategory === 'partners' && <Partners />}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </main>
      </div>

      <AnimatePresence>
        {selectedStaff && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm" 
            onClick={() => setSelectedStaff(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-bg border border-accent/20 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_var(--accent-glow-dim)] relative" 
              onClick={e => e.stopPropagation()}
            >
              <ShieldAlert size={48} className="mx-auto text-accent mb-6" />
              <h3 className="text-2xl font-black italic uppercase text-white mb-4">{t('External Link Warning')}</h3>
              <p className="text-text-muted mb-8 font-medium">{t('You are about to leave Chillzone to view')} <span className="text-white font-bold"><TranslatedText text={selectedStaff.name} />'s</span> {t('socials. Proceed with caution.')}</p>
              <div className="flex gap-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedStaff(null)} className="flex-1 py-4 rounded-xl bg-surface-active text-white font-bold uppercase tracking-widest text-xs hover:bg-surface-hover transition-colors">{t('Abort')}</motion.button>
                <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={selectedStaff.link} target="_blank" onClick={() => setSelectedStaff(null)} className="flex-1 py-4 rounded-xl bg-accent text-white font-bold uppercase tracking-widest text-xs hover:bg-accent/80 transition-colors flex items-center justify-center gap-2">{t('Proceed')} <ExternalLink size={14} /></motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-bg/95 backdrop-blur-3xl" onClick={() => setSelectedItem(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative w-full ${selectedItem.showPlayer ? 'max-w-none h-full' : 'max-w-5xl max-h-[90vh]'} bg-bg border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row`}
            >
              {selectedItem.showPlayer ? null : (
                <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 z-50 bg-bg/40 hover:bg-accent p-4 rounded-2xl transition-all duration-300 border border-white/5"><X size={24} /></button>
              )}
              {selectedItem.showPlayer ? null : (
                <div className="w-full md:w-2/5 aspect-[2/3] md:h-auto relative overflow-hidden group/modal-img bg-bg shrink-0">
                  <img 
                    src={typeof selectedItem.item.img === 'string' && selectedItem.item.img ? selectedItem.item.img : 'https://picsum.photos/seed/poster/400/600'} 
                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover/modal-img:scale-110" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                </div>
              )}
              <div className={`flex-1 ${selectedItem.showPlayer ? 'p-0' : 'p-10 md:p-16'} flex flex-col overflow-y-auto custom-scrollbar`}>
                {selectedItem.showPlayer ? (
                  <div className="w-full h-full bg-black flex flex-col rounded-2xl overflow-hidden relative">
                    <button 
                      onClick={() => setSelectedItem({...selectedItem, showPlayer: false})}
                      className="absolute top-4 left-4 z-50 bg-bg/40 hover:bg-accent p-4 rounded-2xl transition-all duration-300 border border-white/5 text-white"
                    >
                      <X size={24} />
                    </button>
                    <iframe 
                      src={selectedItem.streamUrl || selectedItem.item.l || ''}
                      className="w-full h-full grayscale"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <>
                    <div className="mb-auto">
                  <div className="flex items-center gap-4 mb-6"></div>                  <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.85] mb-10"><TranslatedText text={selectedItem.item.t} /></h2>
                </div>
                
                <div className="flex flex-col gap-4 mt-8"> 
                  {(selectedItem.category === 'movie' || selectedItem.category === 'tv shows' || selectedItem.category === 'tv' || selectedItem.category === 'anime') && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fetchTmdbIdAndPlay(selectedItem.item, selectedItem.category)}
                      disabled={isFetchingStream}
                      className="w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-4 text-xs tracking-[0.4em] uppercase italic transition-all duration-500 shadow-xl bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
                    >
                      {isFetchingStream ? <Loader2 size={20} className="animate-spin" /> : <PlayCircle size={20} />} 
                      {isFetchingStream ? t('LOADING STREAM...') : t('PLAY ON VIDLINK')}
                    </motion.button>
                  )}
                  
                  {(selectedItem.category === 'movie' || selectedItem.category === 'anime') && selectedItem.item.l && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedItem({...selectedItem, showPlayer: true})}
                      className="w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-4 text-xs tracking-[0.4em] uppercase italic transition-all duration-500 shadow-xl bg-surface-active text-white hover:bg-surface-hover"
                    >
                      <PlayCircle size={20} /> 
                      {t('PLAY ORIGINAL LINK')}
                    </motion.button>
                  )}

                  {selectedItem.item.links && selectedItem.item.links.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {selectedItem.item.links.map((link, idx) => (
                        <motion.a 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={idx}
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-4 text-xs tracking-[0.4em] uppercase italic transition-all duration-500 shadow-xl bg-accent text-white hover:bg-accent/90"
                        >
                          <PlayCircle size={20} /> 
                          {link.part}
                        </motion.a>
                      ))}
                    </div>
                  ) : (
                    <motion.a 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={selectedItem.item.l} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-full py-7 rounded-[2.5rem] font-black flex items-center justify-center gap-4 text-xs tracking-[0.4em] uppercase italic transition-all duration-500 shadow-2xl ${isSearchLink ? 'bg-surface-active text-text-muted hover:bg-surface-hover hover:text-white border border-white/10' : 'bg-accent text-white hover:bg-accent/90'}`}
                    >
                      {isSearchLink ? <Search size={24} /> : <PlayCircle size={24} />} 
                      {isSearchLink ? t('SEARCH ARCHIVE') : `${t('Watch:')} ${selectedItem.item.t}`}
                    </motion.a>
                  )}
                  {isSearchLink && (
                    <p className="text-center text-[10px] text-text-secondary mt-2 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <AlertTriangle size={12} /> {t('Direct Feed Offline • Initiating Search Protocol')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <AuthModal onClose={() => setIsAuthModalOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdminOpen(false)}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl h-[80vh] bg-[#0f0f0f] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <AdminDashboard onClose={() => setIsAdminOpen(false)} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showQuotaPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121212] border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-center p-8"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-widest text-white mb-4">Quota Exceeded</h2>
              <p className="text-neutral-400 mb-8 font-medium">
                The free daily read/write limit for this database has been reached. The quota will reset tomorrow.
              </p>
              <p className="text-sm text-neutral-500 mb-8">
                Detailed quota information can be found under the Spark plan column in the Enterprise edition section of <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noreferrer" className="text-accent hover:underline">Firebase Pricing</a>.
              </p>
              <button 
                onClick={() => {
                  setHasShownQuotaPopup(true);
                  setShowQuotaPopup(false);
                  setIsAdminOpen(true);
                }}
                className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                Dismiss & Open Panel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
