import React, { useState, useEffect } from 'react';
import WorkbookBlank from './components/WorkbookBlank';
import GridScanner from './components/GridScanner';
import LetterCanvas from './components/LetterCanvas';
import Playground from './components/Playground';
import { GlyphData } from './types';
import { 
  FileText, Camera, Brush, Type, Sparkles, 
  Layers, HelpCircle, ArrowRight, CheckCircle2 
} from 'lucide-react';

type TabId = 'blank' | 'scanner' | 'draw' | 'playground';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('blank');
  
  // Persistent font glyph cache mapped by character string
  const [glyphsMap, setGlyphsMap] = useState<Record<string, GlyphData>>(() => {
    try {
      const saved = localStorage.getItem('typescribe_glyphs_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Automatically persist glyphs database
  useEffect(() => {
    try {
      localStorage.setItem('typescribe_glyphs_map', JSON.stringify(glyphsMap));
    } catch (err) {
      console.error('Failed to save glyphs cache', err);
    }
  }, [glyphsMap]);

  // Bulk update from scanning sheet
  const handleGlyphsExtracted = (extractedList: GlyphData[]) => {
    setGlyphsMap(prev => {
      const copy = { ...prev };
      for (const g of extractedList) {
        if (g.paths.length > 0) {
          copy[g.char] = g;
        }
      }
      return copy;
    });
    
    // Auto-advance to testing sandbox tab
    setActiveTab('playground');
  };

  // Update singular character from manual brush canvas drawer
  const handleSingleGlyphSaved = (glyph: GlyphData) => {
    setGlyphsMap(prev => ({
      ...prev,
      [glyph.char]: glyph
    }));
  };

  const handleClearDatabase = () => {
    if (window.confirm('Вы действительно хотите полностью очистить созданную базу символов? Все оцифрованные контуры будут удалены.')) {
      setGlyphsMap({});
      localStorage.removeItem('typescribe_glyphs_map');
      // Style refresh
      const styleEl = document.getElementById('dynamic-handwritten-style-tag');
      if (styleEl) styleEl.remove();
    }
  };

  const [isInsideIframe, setIsInsideIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInsideIframe(window.self !== window.top);
    } catch {
      setIsInsideIframe(true);
    }
  }, []);

  const totalGlyphsCount = (Object.values(glyphsMap) as GlyphData[]).filter(g => g.paths.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Dynamic inline warning bar for Sandbox limitations */}
      {isInsideIframe && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold text-center flex flex-col sm:flex-row items-center justify-center gap-2 select-none border-b border-amber-600/20 print:hidden shrink-0">
          <span>⚠️ Приложение запущено во встроенном фрейме. Браузер блокирует открытие диалога печати.</span>
          <a 
            href={window.location.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-slate-950 hover:bg-slate-900 text-white px-3 py-1 rounded-lg inline-flex items-center gap-1 hover:scale-[1.02] transition-transform"
          >
            Открыть приложение в другом окне ↗
          </a>
        </div>
      )}

      {/* HEADER BAR - Hidden on native print */}
      <header className="bg-white border-b border-slate-100 py-5 px-6 sticky top-0 z-30 shadow-sm/5 select-none print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-2xl shadow-md rotate-[-3deg] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Генератор Рукописных Шрифтов</h1>
              <p className="text-xs text-slate-400 font-medium">Создайте свой уникальный TrueType (.ttf) шрифт на основе почерка</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time status counter */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Символов в базе</p>
                <p className="text-xs font-bold text-slate-700 font-mono leading-none mt-1">
                  {totalGlyphsCount} шт.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 print:p-0">
        
        {/* STEPPER METRIC SWITCHER DECK - Hidden on print */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-1 relative select-none print:hidden">
          <button
            onClick={() => setActiveTab('blank')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'blank'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Распечатать бланк
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer relative ${
              activeTab === 'scanner'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-4 h-4" />
            2. Распознать фото бланка
          </button>

          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Brush className="w-4 h-4" />
            3. Нарисовать на экране
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer relative ${
              activeTab === 'playground'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Type className="w-4 h-4" />
            4. Песочница и экспорт
            {totalGlyphsCount >= 10 && activeTab !== 'playground' && (
              <span className="absolute top-1.5 right-2 w-2,5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-bounce"></span>
            )}
          </button>
        </div>

        {/* ACTIVE MODULE VIEWPORT ROUTER */}
        <div className="transition-all duration-300">
          {activeTab === 'blank' && <WorkbookBlank />}
          
          {activeTab === 'scanner' && (
            <GridScanner 
              onGlyphsExtracted={handleGlyphsExtracted} 
              extractedGlyphsCount={totalGlyphsCount} 
            />
          )}

          {activeTab === 'draw' && (
            <LetterCanvas 
              onGlyphSaved={handleSingleGlyphSaved} 
              savedGlyphsMap={glyphsMap} 
            />
          )}

          {activeTab === 'playground' && (
            <Playground 
              glyphsList={Object.values(glyphsMap)} 
              onClearAll={handleClearDatabase} 
            />
          )}
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center select-none print:hidden mt-12 text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Handwriting Font Generator. Все вычисления и оцифровка выполняются локально в вашем браузере.</p>
          <div className="flex items-center gap-4">
            <span className="bg-slate-50 border border-slate-200/50 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-500">
              VITE SECURE CLIENT RUNTIME
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
