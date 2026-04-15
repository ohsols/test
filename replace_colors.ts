import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  './components/DateTimeWidget.tsx',
  './components/Sidebar.tsx',
  './components/MusicPlayer.tsx',
  './components/Settings.tsx',
  './components/Home.tsx',
  './components/GameCard.tsx',
  './components/UpdateLog.tsx',
  './components/GamesSection.tsx',
  './components/ItemCard.tsx',
  './components/LibrarySection.tsx',
  './App.tsx',
  './logo.svg'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace hex colors
    content = content.replace(/bg-black/g, 'bg-bg');
    content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-surface');
    content = content.replace(/bg-\[#1c1c1f\]/g, 'bg-surface-hover');
    content = content.replace(/bg-\[#27272a\]/g, 'bg-surface-active');
    
    content = content.replace(/border-\[#1c1c1f\]/g, 'border-surface-hover');
    
    content = content.replace(/text-\[#52525b\]/g, 'text-text-secondary');
    content = content.replace(/text-\[#a1a1aa\]/g, 'text-text-muted');
    content = content.replace(/text-\[#fafafa\]/g, 'text-text-primary');
    
    content = content.replace(/divide-\[#1c1c1f\]/g, 'divide-surface-hover');
    
    fs.writeFileSync(filePath, content);
  }
});
console.log("Done replacing colors.");
