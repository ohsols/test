import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  './components/Home.tsx',
  './components/GamesSection.tsx',
  './components/LibrarySection.tsx',
  './App.tsx',
  './index.html',
  './constants.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace zinc colors
    content = content.replace(/bg-zinc-900/g, 'bg-surface-hover');
    content = content.replace(/text-zinc-600/g, 'text-text-muted');
    content = content.replace(/text-zinc-500/g, 'text-text-secondary');
    content = content.replace(/text-zinc-400/g, 'text-text-muted');
    content = content.replace(/placeholder:text-zinc-600/g, 'placeholder:text-text-muted');
    
    // Replace #3f3f46
    content = content.replace(/text-\[#3f3f46\]/g, 'text-text-muted');
    content = content.replace(/placeholder:text-\[#3f3f46\]/g, 'placeholder:text-text-muted');
    content = content.replace(/bg-\[#3f3f46\]/g, 'bg-surface-hover');
    
    // Replace #d4d4d8
    content = content.replace(/text-\[#d4d4d8\]/g, 'text-text-primary');
    
    fs.writeFileSync(filePath, content);
  }
});
console.log("Done replacing remaining colors.");
