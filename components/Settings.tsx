import React, { useState, useEffect, useRef } from 'react';
import { VenetianMask, Palette, ChevronDown, Edit2, X, ExternalLink, Globe, User, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { auth, db, handleFirestoreError, OperationType, isQuotaExceeded } from '../firebase';
import { doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { deleteUser, updateProfile } from 'firebase/auth';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export type ThemeColors = {
  bg: string;
  textPrimary: string;
  surface: string;
  border: string;
  accent: string;
  surfaceHover: string;
};

export type Theme = {
  id: string;
  name: string;
  colors: ThemeColors;
};

export const defaultThemes: Record<string, Theme> = {
  chillzone: {
    id: 'chillzone',
    name: 'ChillZone (Default)',
    colors: {
      bg: '#050505',
      textPrimary: '#ffffff',
      surface: '#0f0f0f',
      border: '#1a1a1a',
      accent: '#ff0000',
      surfaceHover: '#1a1a1a',
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: '#0a0a0a',
      textPrimary: '#ffffff',
      surface: '#141414',
      border: '#262626',
      accent: '#ffffff',
      surfaceHover: '#1c1c1f',
    }
  },
  cloud: {
    id: 'cloud',
    name: 'Cloud',
    colors: {
      bg: '#e4e4e7',
      textPrimary: '#09090b',
      surface: '#ffffff',
      border: '#d4d4d8',
      accent: '#0ea5e9',
      surfaceHover: '#f4f4f5',
    }
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    colors: {
      bg: '#050505',
      textPrimary: '#22c55e',
      surface: '#0a0a0a',
      border: '#14532d',
      accent: '#22c55e',
      surfaceHover: '#0f0f0f',
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#020617',
      textPrimary: '#f8fafc',
      surface: '#0f172a',
      border: '#1e293b',
      accent: '#0ea5e9',
      surfaceHover: '#1e293b',
    }
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    colors: {
      bg: '#1c1917',
      textPrimary: '#fafaf9',
      surface: '#292524',
      border: '#44403c',
      accent: '#f97316',
      surfaceHover: '#44403c',
    }
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    colors: {
      bg: '#0f0728',
      textPrimary: '#f3e8ff',
      surface: '#1a0b3c',
      border: '#2e1065',
      accent: '#8b5cf6',
      surfaceHover: '#2e1065',
    }
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    colors: {
      bg: '#0a0a0a',
      textPrimary: '#ffffff',
      surface: '#1a0f00',
      border: '#2a1a00',
      accent: '#ff7518',
      surfaceHover: '#2a1a00',
    }
  },
  aprilfools: {
    id: 'aprilfools',
    name: 'April Fools',
    colors: {
      bg: '#ff69b4',
      textPrimary: '#39ff14',
      surface: '#00ffff',
      border: '#ffff00',
      accent: '#ff0000',
      surfaceHover: '#ffffff',
    }
  }
};

const CLOAK_PRESETS = [
  { id: 'google', label: 'Google', title: 'Google', icon: 'https://www.google.com/favicon.ico' },
  { id: 'drive', label: 'My Drive - Google Drive', title: 'My Drive - Google Drive', icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png' },
  { id: 'classroom', label: 'Classes', title: 'Classes', icon: 'https://ssl.gstatic.com/classroom/favicon.png' },
  { id: 'clever', label: 'Clever | Portal', title: 'Clever | Portal', icon: 'https://assets.clever.com/resource-icons/apps/5c6d1ba5626d0800015b6b10/icon_226591b.png' },
  { id: 'canvas', label: 'Dashboard', title: 'Dashboard', icon: 'https://canvas.instructure.com/favicon.ico' },
  { id: 'schoology', label: 'Home | Schoology', title: 'Home | Schoology', icon: 'https://asset-cdn.schoology.com/sites/all/themes/schoology_theme/favicon.ico' },
  { id: 'kahoot', label: 'Kahoot!', title: 'Kahoot!', icon: 'https://kahoot.com/favicon.ico' },
  { id: 'quizlet', label: 'Quizlet', title: 'Quizlet', icon: 'https://quizlet.com/favicon.ico' },
  { id: 'desmos', label: 'Desmos | Graphing Calculator', title: 'Desmos | Graphing Calculator', icon: 'https://www.desmos.com/favicon.ico' },
  { id: 'khan', label: 'Khan Academy', title: 'Khan Academy', icon: 'https://cdn.kastatic.org/images/favicon.ico' },
  { id: 'custom', label: 'Custom', title: '', icon: '' },
];

const CustomSelect = ({ value, options, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar z-50">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors ${
                value === opt.value ? 'bg-surface-hover text-accent' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ColorPickerItem = ({ label, colorKey, value, isCustom, onChange }: any) => {
  return (
    <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs opacity-60 mt-0.5">{isCustom ? 'Custom' : 'Default'}</div>
      </div>
      <div className="relative w-14 h-8 rounded-md overflow-hidden border border-border shadow-sm">
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: value }}
        />
        <input 
          type="color" 
          value={value}
          onChange={(e) => onChange(colorKey, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

const menuItems = [
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'cloak', label: 'Cloak', icon: VenetianMask },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'account', label: 'Account', icon: User },
];

const LANGUAGES = [
  { value: 'en-US', label: 'English (Default)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'vi-VN', label: 'Vietnamese' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese' },
];

const TIME_ZONES = [
  { value: 'auto', label: 'System Default' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const ParticleBackground = ({ color }: { color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    for (let i = 0; i < 60; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - distance / 120) * 0.5;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
};

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('theme');
  const [currentThemeId, setCurrentThemeId] = useState(() => localStorage.getItem('custom_theme_id') || 'chillzone');
  const [customThemes, setCustomThemes] = useState(() => {
    const saved = localStorage.getItem('custom_themes');
    const themes = saved ? JSON.parse(saved) : { ...defaultThemes };
    
    // Merge new default themes if they don't exist in saved themes
    Object.keys(defaultThemes).forEach(key => {
      if (!themes[key]) {
        themes[key] = defaultThemes[key];
      }
    });
    return themes;
  });

  const [cloakPreset, setCloakPreset] = useState('google');
  const [customTitle, setCustomTitle] = useState(localStorage.getItem('siteTitle') || 'Google');
  const [customIcon, setCustomIcon] = useState(localStorage.getItem('faviconUrl') || 'https://www.google.com/favicon.ico');

  const { language, setLanguage, militaryTime, setMilitaryTime, timeZone, setTimeZone, t } = useLanguage();

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [newDisplayName, setNewDisplayName] = useState(auth.currentUser?.displayName || '');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [lastUsernameChange, setLastUsernameChange] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser || isQuotaExceeded) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setLastUsernameChange(userDoc.data().lastUsernameChange);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${auth.currentUser?.uid}`);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdateUsername = async () => {
    if (!auth.currentUser || !newDisplayName.trim()) return;
    if (newDisplayName === auth.currentUser.displayName) return;

    // Check cooldown
    if (lastUsernameChange) {
      const lastChange = lastUsernameChange.toDate();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastChange.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        const remainingDays = 7 - Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setUsernameError(`You can only change your username once every 7 days. Please wait ${remainingDays} more day(s).`);
        return;
      }
    }

    setIsUpdatingUsername(true);
    setUsernameError(null);
    setUsernameSuccess(false);

    if (isQuotaExceeded) {
      setUsernameError("Database quota exceeded. Please try again later.");
      setIsUpdatingUsername(false);
      return;
    }

    try {
      // 1. Update Auth Profile
      await updateProfile(auth.currentUser, { displayName: newDisplayName });

      // 2. Update Firestore
      const now = new Date();
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: newDisplayName,
        lastUsernameChange: serverTimestamp()
      });

      setLastUsernameChange({ toDate: () => now });
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err: any) {
      if (!String(err).includes('Quota limit exceeded') && !String(err).includes('Quota exceeded')) {
        console.error("Error updating username:", err);
      }
      setUsernameError("Failed to update username. Please try again.");
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    if (!auth.currentUser) return;

    setIsDeleting(true);
    setDeleteError(null);

    if (isQuotaExceeded) {
      setDeleteError("Database quota exceeded. Please try again later.");
      setIsDeleting(false);
      return;
    }

    try {
      const user = auth.currentUser;
      const userId = user.uid;

      // 1. Delete Firestore document
      await deleteDoc(doc(db, 'users', userId));

      // 2. Delete Auth account
      await deleteUser(user);

      // 3. Close settings and refresh or redirect
      onClose();
      window.location.href = '/';
    } catch (err: any) {
      if (!String(err).includes('Quota limit exceeded') && !String(err).includes('Quota exceeded')) {
        console.error("Error deleting account:", err);
      }
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError("This action requires a recent login. Please log out and log back in, then try again.");
      } else {
        setDeleteError("Failed to delete account. Please try again later.");
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser?.uid}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const activeTheme = customThemes[currentThemeId] || defaultThemes.chillzone;

  useEffect(() => {
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

    localStorage.setItem('custom_theme_id', currentThemeId);
    localStorage.setItem('custom_themes', JSON.stringify(customThemes));
    
    // Sync to Firebase if logged in
    if (auth.currentUser && !isQuotaExceeded) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        theme: currentThemeId,
        customThemes: JSON.stringify(customThemes)
      }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
      });
    }
  }, [activeTheme, currentThemeId, customThemes]);

  const handleColorChange = (key: keyof ThemeColors, color: string) => {
    setCustomThemes((prev: any) => ({
      ...prev,
      [currentThemeId]: {
        ...prev[currentThemeId],
        colors: {
          ...prev[currentThemeId].colors,
          [key]: color
        }
      }
    }));
  };

  const handleNameChange = (newName: string) => {
    setCustomThemes((prev: any) => ({
      ...prev,
      [currentThemeId]: {
        ...prev[currentThemeId],
        name: newName
      }
    }));
  };

  const handleReset = () => {
    setCurrentThemeId('chillzone');
    setCustomThemes(defaultThemes);
  };

  const openAboutBlank = () => {
    const preset = CLOAK_PRESETS.find(p => p.id === cloakPreset);
    const title = cloakPreset === 'custom' ? customTitle : preset?.title || 'Google';
    const icon = cloakPreset === 'custom' ? customIcon : preset?.icon || 'https://www.google.com/favicon.ico';

    const url = window.location.href;
    const win = window.open('about:blank', '_blank');
    if (!win) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }
    
    const doc = win.document;
    const iframe = doc.createElement('iframe');
    const style = iframe.style;

    doc.title = title;
    
    // Favicon for the new tab
    if (icon) {
      const link = doc.createElement('link');
      link.rel = 'icon';
      link.href = icon;
      doc.head.appendChild(link);
    }

    iframe.src = url;
    style.position = 'fixed';
    style.top = '0';
    style.left = '0';
    style.bottom = '0';
    style.right = '0';
    style.width = '100%';
    style.height = '100%';
    style.border = 'none';
    style.margin = '0';
    style.padding = '0';
    style.overflow = 'hidden';
    style.zIndex = '999999';

    doc.body.appendChild(iframe);
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';
    doc.body.style.overflow = 'hidden';

    // Save settings for next time if custom
    if (cloakPreset === 'custom') {
      localStorage.setItem('siteTitle', customTitle);
      localStorage.setItem('faviconUrl', customIcon);
    }
  };

  return (
    <div className="relative bg-bg text-text-primary font-sans flex flex-col min-h-[400px]">
      <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
        <ParticleBackground color={activeTheme.colors.accent} />
      </div>
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-border z-10 bg-bg/80 backdrop-blur-sm shrink-0">
        <div className="flex gap-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = item.id === activeSection;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-accent text-white' 
                    : 'hover:bg-surface-hover opacity-70 hover:opacity-100'
                }`}
              >
                <Icon size={16} />
                {t(item.label)}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors text-text-secondary hover:text-text-primary">
          <X size={18} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 z-10 relative overflow-y-auto custom-scrollbar">
        <div className="max-w-full mx-auto">
          {activeSection === 'theme' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">{t('Theme')}</h2>
                <p className="text-xs opacity-60">{t('Changes apply instantly.')}</p>
              </div>

              {currentThemeId === 'aprilfools' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-xl text-center backdrop-blur-sm"
                >
                  <p className="text-sm font-black text-accent italic uppercase tracking-widest">"Wait, are the words moving? I think I'm losing it..." 🤡</p>
                </motion.div>
              )}

              <div className="space-y-6">
                {/* Theme Selection */}
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Edit2 className="text-accent" size={16} />
                    <div>
                      <h3 className="font-medium text-sm">{t('Theme')}</h3>
                    </div>
                  </div>
                  
                  <div className="ml-7">
                    <CustomSelect 
                      value={currentThemeId}
                      onChange={setCurrentThemeId}
                      options={Object.values(customThemes).map((t: any) => ({ value: t.id, label: t.name }))}
                    />
                  </div>
                </div>

                {/* Theme Name */}
                <div>
                  <h3 className="font-medium text-sm mb-2">{t('Theme Name')}</h3>
                  <input 
                    type="text" 
                    value={activeTheme.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors mb-1 text-text-primary"
                  />
                </div>

                {/* Colors Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <ColorPickerItem 
                    label={t('Background')} 
                    colorKey="bg" 
                    value={activeTheme.colors.bg} 
                    isCustom={activeTheme.colors.bg !== defaultThemes[currentThemeId].colors.bg}
                    onChange={handleColorChange} 
                    t={t}
                  />
                  <ColorPickerItem 
                    label={t('Foreground')} 
                    colorKey="textPrimary" 
                    value={activeTheme.colors.textPrimary} 
                    isCustom={activeTheme.colors.textPrimary !== defaultThemes[currentThemeId].colors.textPrimary}
                    onChange={handleColorChange} 
                    t={t}
                  />
                  <ColorPickerItem 
                    label={t('Card')} 
                    colorKey="surface" 
                    value={activeTheme.colors.surface} 
                    isCustom={activeTheme.colors.surface !== defaultThemes[currentThemeId].colors.surface}
                    onChange={handleColorChange} 
                    t={t}
                  />
                  <ColorPickerItem 
                    label={t('Border')} 
                    colorKey="border" 
                    value={activeTheme.colors.border} 
                    isCustom={activeTheme.colors.border !== defaultThemes[currentThemeId].colors.border}
                    onChange={handleColorChange} 
                    t={t}
                  />
                  <ColorPickerItem 
                    label={t('Primary')} 
                    colorKey="accent" 
                    value={activeTheme.colors.accent} 
                    isCustom={activeTheme.colors.accent !== defaultThemes[currentThemeId].colors.accent}
                    onChange={handleColorChange} 
                    t={t}
                  />
                  <ColorPickerItem 
                    label={t('Accent')} 
                    colorKey="surfaceHover" 
                    value={activeTheme.colors.surfaceHover} 
                    isCustom={activeTheme.colors.surfaceHover !== defaultThemes[currentThemeId].colors.surfaceHover}
                    onChange={handleColorChange} 
                    t={t}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <button 
                    onClick={handleReset}
                    className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium hover:bg-surface-hover transition-colors text-text-primary"
                  >
                    {t('Reset to Default')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'cloak' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">{t('Cloak Methods')}</h2>
                <p className="text-xs opacity-60">{t('Hide your activity in an about:blank tab.')}</p>
              </div>

              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="mb-4">
                    <h3 className="font-medium text-xs text-text-secondary uppercase tracking-wider mb-2">{t('Cloak Site')}</h3>
                    <CustomSelect 
                      value={cloakPreset}
                      onChange={setCloakPreset}
                      options={CLOAK_PRESETS.map((p: any) => ({ value: p.id, label: p.id === 'custom' ? t('Custom') : p.label }))}
                    />
                  </div>

                  {cloakPreset === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 mt-4 pt-4 border-t border-border"
                    >
                      <div>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Tab Title')}</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Google"
                          value={customTitle} 
                          onChange={(e) => setCustomTitle(e.target.value)}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">{t('Tab Icon (URL)')}</label>
                        <input 
                          type="text" 
                          placeholder="Favicon URL"
                          value={customIcon} 
                          onChange={(e) => setCustomIcon(e.target.value)}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-text-primary"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openAboutBlank}
                  className="w-full bg-accent text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-[0_0_15px_var(--accent-glow)] text-sm uppercase tracking-wider"
                >
                  {t('Open Now')}
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeSection === 'language' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">{t('Language')}</h2>
                <p className="text-xs opacity-60">{t('Pick your preferred locale for time formatting and future language support.')}</p>
              </div>

              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="mb-4">
                    <h3 className="font-medium text-sm text-text-primary mb-1">{t('Language')}</h3>
                    <p className="text-xs text-text-secondary mb-3">{t('English is the default. Other options adjust locale formatting.')}</p>
                    <CustomSelect 
                      value={language}
                      onChange={setLanguage}
                      options={LANGUAGES}
                    />
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm text-text-primary mb-1">{t('Military Time')}</h3>
                    <p className="text-xs text-text-secondary">{t('Uses 24-hour clock format for the time widget.')}</p>
                  </div>
                  <button 
                    onClick={() => setMilitaryTime(!militaryTime)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${militaryTime ? 'bg-accent' : 'bg-surface-hover border border-border'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${militaryTime ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4">
                  <div className="mb-4">
                    <h3 className="font-medium text-sm text-text-primary mb-1">{t('Time Zone')}</h3>
                    <p className="text-xs text-text-secondary mb-3">{t('Select a specific time zone or use your system default.')}</p>
                    <CustomSelect 
                      value={timeZone}
                      onChange={setTimeZone}
                      options={TIME_ZONES.map((tz: any) => ({ value: tz.value, label: tz.value === 'auto' ? t('System Default') : tz.label }))}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-1">{t('Account')}</h2>
                <p className="text-xs opacity-60">{t('Manage your account settings.')}</p>
              </div>

              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      {auth.currentUser?.photoURL ? (
                        <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{auth.currentUser?.displayName || 'User'}</h3>
                      <p className="text-sm text-text-secondary">{auth.currentUser?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                        {t('Display Name')}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          placeholder="Enter new username"
                          className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-white"
                        />
                        <button
                          disabled={isUpdatingUsername || !newDisplayName.trim() || newDisplayName === auth.currentUser?.displayName}
                          onClick={handleUpdateUsername}
                          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {isUpdatingUsername ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : usernameSuccess ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <Edit2 size={16} />
                          )}
                          {usernameSuccess ? t('Updated') : t('Update')}
                        </button>
                      </div>
                      {usernameError && (
                        <p className="text-xs text-red-500 font-bold mt-2">{usernameError}</p>
                      )}
                      {lastUsernameChange && (
                        <p className="text-[10px] text-text-secondary mt-2">
                          {t('Last changed:')} {lastUsernameChange.toDate().toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h4 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {t('Danger Zone')}
                    </h4>
                    
                    {!isDeletingAccount ? (
                      <button 
                        onClick={() => setIsDeletingAccount(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={16} />
                        {t('Delete Account')}
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <p className="text-sm text-text-secondary">
                          {t('This action is permanent and cannot be undone.')}
                        </p>
                        
                        <div>
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                            {t('Type "DELETE" to confirm')}
                          </label>
                          <input 
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE"
                            className="w-full bg-bg border border-red-500/30 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors text-white"
                          />
                        </div>

                        {deleteError && (
                          <p className="text-xs text-red-500 font-bold">{deleteError}</p>
                        )}

                        <div className="flex gap-3">
                          <button 
                            disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                            onClick={handleDeleteAccount}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? t('Deleting...') : t('Confirm Deletion')}
                          </button>
                          <button 
                            disabled={isDeleting}
                            onClick={() => {
                              setIsDeletingAccount(false);
                              setDeleteConfirmation('');
                              setDeleteError(null);
                            }}
                            className="flex-1 bg-surface border border-border text-text-primary py-2 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-surface-hover transition-all"
                          >
                            {t('Cancel')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
