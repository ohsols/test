import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Music as MusicIcon, Loader2, X, ChevronDown, Maximize2, Trash2, Plus, Heart } from 'lucide-react';
import { Track, searchMusic, getStreamUrl } from '../services/musicService';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

const MusicPlayer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState<'all' | 'tidal' | 'soundcloud'>('all');
  const [results, setResults] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'search' | 'playlists'>('search');
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [miniPos, setMiniPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const searchTimeout = useRef<any>(null);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const resolveStream = async () => {
      if (currentTrack) {
        try {
          const url = await getStreamUrl(currentTrack);
          setResolvedStreamUrl(url);
        } catch (error) {
          console.error("Error resolving stream URL:", error);
        }
      } else {
        setResolvedStreamUrl(undefined);
      }
    };
    resolveStream();
  }, [currentTrack]);

  useEffect(() => {
    if (resolvedStreamUrl && isPlaying && audioRef.current) {
      audioRef.current.play().catch(err => console.error("Playback failed:", err));
    }
  }, [resolvedStreamUrl, isPlaying]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'playlists'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'playlists');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setMiniPos({
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      const tracks = await searchMusic(query, source);
      setResults(tracks);
      setIsLoading(false);
    }, 500);
  };

  const playTrack = (track: Track) => {
    const newQueue = [...queue];
    const existingIndex = newQueue.findIndex(t => t.id === track.id);
    
    if (existingIndex >= 0) {
      setCurrentIndex(existingIndex);
    } else {
      newQueue.push(track);
      setQueue(newQueue);
      setCurrentIndex(newQueue.length - 1);
    }
    
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!currentTrack && queue.length > 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    setCurrentIndex((currentIndex + 1) % queue.length);
  };

  const prevTrack = () => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      setCurrentIndex(currentIndex <= 0 ? queue.length - 1 : currentIndex - 1);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const addToPlaylist = async (track?: Track) => {
    if (!auth.currentUser) return;
    const playlistName = window.prompt('Enter playlist name:');
    if (!playlistName) return;

    try {
      // Find or create playlist
      let playlistId = '';
      const existing = playlists.find(p => p.name.toLowerCase() === playlistName.toLowerCase());
      
      if (existing) {
        playlistId = existing.id;
        if (track && track.id !== 'dummy') {
          const songs = existing.songs || [];
          if (songs.some((s: any) => s.id === track.id)) return;
          await addDoc(collection(db, `playlists/${playlistId}/songs`), {
            ...track,
            addedAt: serverTimestamp()
          });
        }
      } else {
        const docRef = await addDoc(collection(db, 'playlists'), {
          name: playlistName,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        playlistId = docRef.id;
        if (track && track.id !== 'dummy') {
          await addDoc(collection(db, `playlists/${playlistId}/songs`), {
            ...track,
            addedAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'playlists');
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await deleteDoc(doc(db, 'playlists', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `playlists/${id}`);
    }
  };

  return (
    <div className="py-12 px-6 relative">
      <AnimatePresence>
        {isMiniPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[100] bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex items-center p-3 gap-4"
            style={{ 
              left: miniPos.x, 
              top: miniPos.y,
              width: '320px',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              setIsDragging(true);
              setDragOffset({
                x: e.clientX - miniPos.x,
                y: e.clientY - miniPos.y
              });
            }}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
              {currentTrack?.thumbnail ? (
                <img src={`/api/music/infamous/image?url=${encodeURIComponent(currentTrack.thumbnail)}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MusicIcon size={20} className="text-white/20" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{currentTrack?.title || 'Not Playing'}</h4>
              <p className="text-[10px] text-white/40 truncate">{currentTrack?.artist || '-'}</p>
              <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={togglePlay} className="p-2 hover:bg-white/5 rounded-lg text-white">
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <button onClick={() => setIsMiniPlayer(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white">
                <Maximize2 size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`music-wrapper ${isMiniPlayer ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className="music-player-container">
          {/* Left Section: Search and Results */}
          <div className="music-search-section">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('search')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'search' ? 'bg-accent text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                >
                  Search
                </button>
                <button 
                  onClick={() => setActiveTab('playlists')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'playlists' ? 'bg-accent text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                >
                  Playlists
                </button>
              </div>
              <button onClick={() => setIsMiniPlayer(true)} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                <ChevronDown size={20} />
              </button>
            </div>

            {activeTab === 'search' ? (
              <>
                <div className="music-source-toggle">
                  {(['all', 'tidal', 'soundcloud'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSource(s);
                        if (searchQuery) handleSearch(searchQuery);
                      }}
                      className={`music-source-btn ${s} ${source === s ? 'active' : ''}`}
                    >
                      <MusicIcon size={14} />
                      <span className="capitalize">{s}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search for songs, artists..."
                  className="music-search-input"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />

                <div className="music-results custom-scrollbar">
                  {isLoading ? (
                    <div className="music-loading">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p>Searching {source}...</p>
                    </div>
                  ) : results.length > 0 ? (
                    results.map((track) => (
                      <div
                        key={track.id}
                        className={`music-result-item group ${currentTrack?.id === track.id ? 'playing' : ''}`}
                      >
                        <div className="music-result-thumb" onClick={() => playTrack(track)}>
                          {track.thumbnail ? (
                            <img src={`/api/music/infamous/image?url=${encodeURIComponent(track.thumbnail)}`} alt={track.title} referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                              <MusicIcon size={16} />
                            </div>
                          )}
                        </div>
                        <div className="music-result-info" onClick={() => playTrack(track)}>
                          <h4>{track.title}</h4>
                          <p>{track.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => addToPlaylist(track)}
                            className="p-2 rounded-lg bg-white/5 text-white/20 opacity-0 group-hover:opacity-100 hover:text-accent transition-all"
                            title="Add to playlist"
                          >
                            <Plus size={16} />
                          </button>
                          <div className={`music-source-badge ${track.source}`}>
                            {track.source === 'tidal' ? 'M' : 'SC'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <div className="music-empty">
                      <MusicIcon size={24} className="mx-auto mb-2 opacity-20" />
                      <p>No results found</p>
                    </div>
                  ) : (
                    <div className="music-empty">
                      <MusicIcon size={24} className="mx-auto mb-2 opacity-20" />
                      <p>Search for music to start playing</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4 custom-scrollbar overflow-y-auto max-h-[400px]">
                <button 
                  onClick={() => addToPlaylist()}
                  className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest mb-4"
                >
                  <Plus size={16} />
                  Create New Playlist
                </button>
                {playlists.length === 0 ? (
                  <div className="text-center py-12 text-white/20 italic text-sm">
                    No playlists created yet.
                  </div>
                ) : (
                  playlists.map(playlist => (
                    <div key={playlist.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                          <ListMusic size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{playlist.name}</h4>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Playlist</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => deletePlaylist(playlist.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Section: Now Playing */}
          <div className="music-now-playing">
            <div className="music-artwork">
              {currentTrack?.thumbnail ? (
                <img src={`/api/music/infamous/image?url=${encodeURIComponent(currentTrack.thumbnail)}`} alt={currentTrack.title} referrerPolicy="no-referrer" />
              ) : (
                <MusicIcon size={48} className="opacity-20" />
              )}
            </div>

            <div className="music-track-info">
              <h3>{currentTrack?.title || 'Not Playing'}</h3>
              <p>{currentTrack?.artist || 'Select a track'}</p>
            </div>

            <div className="music-progress-container">
              <div 
                className="music-progress-bar"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const clickedTime = (x / rect.width) * duration;
                  if (audioRef.current) audioRef.current.currentTime = clickedTime;
                }}
              >
                <div 
                  className="music-progress-fill" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="music-time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="music-controls">
              <button onClick={prevTrack}>
                <SkipBack size={18} />
              </button>
              <button onClick={togglePlay} className="play-btn">
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={nextTrack}>
                <SkipForward size={18} />
              </button>
            </div>

            <div className="music-volume">
              <Volume2 size={14} className="opacity-50" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
              />
            </div>

            <button 
              onClick={() => {
                setQueue([]);
                setCurrentIndex(-1);
                setIsPlaying(false);
              }}
              className="mt-6 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 transition-all"
            >
              Clear Queue
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={resolvedStreamUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default MusicPlayer;
