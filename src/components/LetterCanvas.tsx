import React, { useState, useRef, useEffect } from 'react';
import { Point, GlyphData } from '../types';
import { getBinaryGrid, traceContours, createFontPaths, getGlyphAlignment } from '../utils/contourTracer';
import { ALL_TEMPLATES } from '../utils/templates';
import { 
  ChevronLeft, ChevronRight, Trash2, CheckCircle2, 
  Info, Brush, Save, ArrowRight, Eye, Sparkles
} from 'lucide-react';

interface LetterCanvasProps {
  onGlyphSaved: (glyph: GlyphData) => void;
  savedGlyphsMap: Record<string, GlyphData>;
}

export default function LetterCanvas({ onGlyphSaved, savedGlyphsMap }: LetterCanvasProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('cyrillic');
  const activeTemplate = ALL_TEMPLATES.find(t => t.id === selectedTemplateId) || ALL_TEMPLATES[0];

  // Filter out logo cells for letters list
  const activeChars = activeTemplate.cells
    .filter(cell => !cell.isLogo)
    .map(cell => cell.char);

  const [charIndex, setCharIndex] = useState(0);
  const currentChar = activeChars[charIndex] || activeChars[0];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(60);

  const alignInfo = getGlyphAlignment(currentChar);

  // Clear canvas action
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Safe layout updates
  useEffect(() => {
    clearCanvas();
    loadExistingGlyph();
  }, [charIndex, selectedTemplateId]);

  // Load previously drawn letter if available
  const loadExistingGlyph = () => {
    const existing = savedGlyphsMap[currentChar];
    if (!existing || existing.paths.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw SVG contours back onto canvas nicely
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    const W = canvas.width;
    const letterCanvasBaselineY = W * 0.85; // Exactly 85% of canvas height
    const FONT_HEIGHT_UNITS = 12000;
    const verticalScale = letterCanvasBaselineY / FONT_HEIGHT_UNITS;

    for (const contour of existing.paths) {
      let first = true;
      for (const pt of contour) {
        // Inverse transform based on dynamic canvas width matching our uniform coordinates
        // X: scale [0, existing.width] with elegant 10% side padding
        const cx = (W * 0.1) + pt.x! * ((W * 0.8) / (existing.width || 1));

        // Y:
        const cy = letterCanvasBaselineY - pt.y! * verticalScale;

        if (first || pt.type === 'M') {
          ctx.moveTo(cx, cy);
          first = false;
        } else if (pt.type === 'L') {
          ctx.lineTo(cx, cy);
        } else if (pt.type === 'Q') {
          const cx1 = (W * 0.1) + pt.x1! * ((W * 0.8) / (existing.width || 1));
          const cy1 = letterCanvasBaselineY - pt.y1! * verticalScale;
          ctx.quadraticCurveTo(cx1, cy1, cx, cy);
        } else if (pt.type === 'Z') {
          ctx.closePath();
        }
      }
    }
    ctx.fill();
  };

  // Drawing mouse/touch handlers
  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
    ctx.stroke();
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  // Vectorize and save glyph
  const handleSaveGlyph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const binary = getBinaryGrid(canvas, 130);
    const contours = traceContours(binary.data, binary.width, binary.height);
    const fontPaths = createFontPaths(contours, binary.width, binary.height, currentChar);

    // Save
    onGlyphSaved({
      char: currentChar,
      paths: fontPaths.paths,
      width: fontPaths.advanceWidth
    });
  };

  const traverseNext = () => {
    handleSaveGlyph();
    if (charIndex < activeChars.length - 1) {
      setCharIndex(prev => prev + 1);
    }
  };

  const traversePrev = () => {
    handleSaveGlyph();
    if (charIndex > 0) {
      setCharIndex(prev => prev - 1);
    }
  };

  // Quick select cell clicker
  const jumpToChar = (index: number) => {
    handleSaveGlyph();
    setCharIndex(index);
  };

  return (
    <div id="letter-canvas-pad" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT DRAWING BOARD AND SETTINGS */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Режим: Прямое рисование
            </span>
            <h3 className="text-lg font-bold text-slate-800">Нарисуйте символ: {currentChar}</h3>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                setCharIndex(0);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none flex-1 sm:flex-none cursor-pointer"
            >
              {ALL_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            
            <div className="flex items-center gap-2">
              <button
                onClick={traversePrev}
                disabled={charIndex === 0}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 outline-none disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {charIndex + 1}/{activeChars.length}
              </span>
              <button
                onClick={traverseNext}
                disabled={charIndex === activeChars.length - 1}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 outline-none disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Stylus Art Pad */}
        <div className="flex justify-center py-4 bg-slate-50/50 rounded-2xl relative select-none">
          <div className="relative w-64 h-64 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={4096}
              height={4096}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
              onTouchStart={handleDrawStart}
              onTouchMove={handleDrawMove}
              onTouchEnd={handleDrawEnd}
              className="w-full h-full cursor-pencil"
              style={{ touchAction: 'none' }}
            />

            {/* Typography Grid Guidelines alignment */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Baseline */}
              <div className="absolute top-[85%] left-0 w-full border-t-2 border-dashed border-red-200/50 flex justify-end px-3">
                <span className="text-[8px] text-red-400 font-mono font-bold tracking-wider uppercase select-none">Базовая линия</span>
              </div>
              
              {/* x-Height (for standard lowercases) */}
              {alignInfo.type === 'standard' && (
                <div className="absolute top-[40%] left-0 w-full border-t border-dashed border-blue-300/30"></div>
              )}
              {/* Cap height (for upper/talls) */}
              {alignInfo.type === 'tall' && (
                <div className="absolute top-[15%] left-0 w-full border-t border-dashed border-blue-300/40"></div>
              )}

              {/* Faint character help backdrop to let user trace */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05]">
                <span className="text-[120px] font-sans font-light">{currentChar}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stroke controls & Save controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500">Толщина кисти:</span>
            <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
              {[16, 32, 60, 100].map(w => (
                <button
                  key={w}
                  onClick={() => setLineWidth(w)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    lineWidth === w 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={clearCanvas}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Очистить
            </button>

            <button
              onClick={traverseNext}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Save className="w-3.5 h-3.5" />
              Сохранить и зайти далее
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE CHARACTER MATRIX TO VIEW PROGRESS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between gap-5">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-800 text-sm">Сетка символов</h4>
          <p className="text-[11px] text-slate-400">Нажмите на ячейку ниже, чтобы быстро переключиться.</p>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[360px] overflow-y-auto pr-1">
          {activeChars.map((char, index) => {
            const isSaved = !!savedGlyphsMap[char] && savedGlyphsMap[char].paths.length > 0;
            const isCurrent = currentChar === char;

            return (
              <button
                key={index}
                onClick={() => jumpToChar(index)}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all outline-none cursor-pointer text-xs font-bold ${
                  isCurrent 
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' 
                    : isSaved 
                      ? 'border-slate-200 bg-slate-50 text-slate-800' 
                      : 'border-dashed border-slate-200 text-slate-400 hover:bg-slate-50/50'
                }`}
              >
                {char}
                {isSaved && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-[10px] space-y-1.5">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            Как работает рисование:
          </span>
          <p className="text-slate-500 leading-relaxed">
            Пользуйтесь пунктирными линиями выравнивания! Буквы должны плотно лежать на <strong>Базовой линии (Base Line)</strong>, а строчные символы (как а, о, с) не должны превышать половину ячейки.
          </p>
        </div>
      </div>
    </div>
  );
}
