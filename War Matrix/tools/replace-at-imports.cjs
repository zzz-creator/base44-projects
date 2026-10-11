#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

function toPosix(p){ return p.split(path.sep).join('/'); }

function walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for(const e of entries){
    const full = path.join(dir, e.name);
    if(e.isDirectory()){
      walk(full);
    } else if(/\.(js|jsx|ts|tsx)$/.test(e.name)){
      fixFile(full);
    }
  }
}

function fixFile(filePath){
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  const importRegex = /(from\s+['\"])@\/([^'"\n]+)(['\"])/g;
  const sideEffectRegex = /(import\s+['\"])@\/([^'"\n]+)(['\"])/g;

  const replacer = (match, p1, p2, p3) => {
    const target = path.join(srcRoot, p2);
    let rel = path.relative(path.dirname(filePath), target);
    rel = toPosix(rel);
    if(!rel.startsWith('.')) rel = './' + rel;
    return p1 + rel + p3;
  };

  src = src.replace(importRegex, replacer);
  src = src.replace(sideEffectRegex, replacer);

  if(src !== original){
    fs.writeFileSync(filePath, src, 'utf8');
    console.log('Updated:', path.relative(projectRoot, filePath));
  }
}

if(!fs.existsSync(srcRoot)){
  console.error('src directory not found at', srcRoot);
  process.exit(1);
}

walk(srcRoot);
console.log('Import replacement complete. Please run your formatter/git diff to review changes.');
