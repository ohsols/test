export interface Game {
  id: string;
  title: string;
  platform?: string;
  system: string;
  year: string;
  color: string;
  desc?: string;
  icon?: string;
  iconColor?: string;
  image?: string;
  link?: string;
  frame?: boolean;
}

export interface FavoriteItem {
  id: string;
  type: 'movie' | 'tv' | 'anime' | 'manga' | 'game';
  title: string;
  imageUrl: string;
  link: string;
}

export interface LibraryItem {
  t: string; // Title
  l?: string; // Link
  img?: string; // Optional hardcoded poster
  banner?: string; // Optional hardcoded banner
  year?: number;
  genre?: string[];
  rating?: number;
  links?: { part: string; url: string }[]; // Optional multiple links
  desc?: string;
}

export interface Movie {
  title: string;
  imageUrl: string;
  link: string;
  description: string;
  year: string;
}

export interface Manga {
  title: string;
  imageUrl: string;
  url: string;
  description: string;
  year: string;
}

export interface PartnerItem {
  name: string;
  owner: string;
  url?: string;
  urls?: { name: string; url: string }[];
  banner?: string;
  avatar?: string;
}

export interface ProxyItem {
  url: string;
  name?: string;
}

export type Category = 'home' | 'movies' | 'tv shows' | 'anime' | 'manga' | 'proxies' | 'partners' | 'dev' | 'support' | 'donate' | 'apps' | 'browser' | 'settings' | 'music' | 'games';

export interface Anime {
  title: string;
  imageUrl: string;
  link?: string;
  links?: { part: string; url: string }[];
  description?: string;
  year?: string;
}

export interface TVShow {
  title: string;
  imageUrl: string;
  link?: string;
  links?: { part: string; url: string }[];
  description?: string;
  year?: string;
}

export interface StaffMember {
  name: string;
  role: string;
  img?: string; // Optional portrait image
  link?: string; // Social link
}

