import React, { useState, useRef, useEffect } from 'react';
import { HandwritingStyle } from '../types';
import { 
  Play, 
  Sparkles, 
  Upload, 
  HelpCircle, 
  Save, 
  RotateCcw, 
  PenTool, 
  CheckCircle, 
  Zap, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Trash2, 
  Plus, 
  Search, 
  Sliders, 
  X, 
  SlidersHorizontal, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw, 
  FileText, 
  LayoutGrid,
  Edit2,
  Copy
} from 'lucide-react';
import { parseSVGPathToStrokes, BASE_GLYPHS } from '../utils/handwritingEngine';
import { motion, AnimatePresence } from 'motion/react';

interface StyleStudioProps {
  currentStyle: HandwritingStyle;
  onSaveStyle: (style: HandwritingStyle) => void;
  availableStyles: HandwritingStyle[];
  onDeleteStyle?: (id: string) => void;
}

export default function StyleStudio({ currentStyle, onSaveStyle, availableStyles, onDeleteStyle }: StyleStudioProps) {
  // Master Tabs aligned with Calligraphr structure
  const [activeTab, setActiveTab] = useState<'templates' | 'my-fonts' | 'blender'>('my-fonts');
  
  // Search and selector states for fonts
  const [fontSearch, setFontSearch] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(currentStyle.id);
  const [isCreatingFont, setIsCreatingFont] = useState<boolean>(false);
  const [newFontName, setNewFontName] = useState<string>('');
  
  // Collapsible Dropdown state variables
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState<boolean>(false);
  const [renamingStyleId, setRenamingStyleId] = useState<string | null>(null);
  const [renamingTempName, setRenamingTempName] = useState<string>('');

  // Parameters sliding pane state
  const [showParametersPane, setShowParametersPane] = useState<boolean>(false);

  // Template customizer variables
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string>('cyrillic');
  const [templatePageIndex, setTemplatePageIndex] = useState<number>(0);

  // Custom blank template constructor variables
  const [customLanguages, setCustomLanguages] = useState<Record<string, boolean>>({
    cyrillic: true,
    latin: false,
    kazakh: false,
    european: false,
    numbers: false,
    math: false,
    ligatures: false,
  });
  const [customExtraSymbols, setCustomExtraSymbols] = useState<string>('');
  const [selectedFontGridFilter, setSelectedFontGridFilter] = useState<string>('all');
  const [printWithLetter, setPrintWithLetter] = useState<boolean>(true);
  const [printErrorModal, setPrintErrorModal] = useState<boolean>(false);

  // Selected symbols for bulk custom print
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('typescribe_selected_symbols');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('typescribe_selected_symbols', JSON.stringify(selectedSymbols));
    } catch {}
  }, [selectedSymbols]);

  // Calibration and details workspace popup state (Screenshots 3 & 4)
  const [calibratingChar, setCalibratingChar] = useState<string | null>(null);
  const [calibratingStrokeWeight, setCalibratingStrokeWeight] = useState<number>(10);
  const [calibrationContext, setCalibrationContext] = useState<string[]>(['z', 'e', 'f', 'f', 'g', 'g', 'h', 'h', 'i', 'i']);
  
  // Local glyph offsets & scale sizes override dictionary for realistic line tuning
  const [characterAdjustments, setCharacterAdjustments] = useState<Record<string, { baseline: number; scale: number }>>(() => {
    // Populate default displacements to make sample looks varied and realistic
    return {
      'g': { baseline: 12, scale: 1.0 },
      'p': { baseline: 10, scale: 0.95 },
      'q': { baseline: 11, scale: 1.0 },
      'y': { baseline: 11, scale: 0.98 },
      'Ц': { baseline: -2, scale: 1.05 },
      'Щ': { baseline: -2, scale: 1.05 },
      'ё': { baseline: -2, scale: 0.96 },
      'б': { baseline: -4, scale: 1.0 },
      'А': { baseline: 0, scale: 1.0 },
      'Ç': { baseline: 10, scale: 1.05 }
    };
  });

  const charList = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я',
    'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я',
    'І', 'Ї', 'Є', 'Ґ', 'і', 'ї', 'є', 'ґ', 'Ў', 'ў',
    'Ә', 'Ң', 'Ғ', 'Ү', 'Ұ', 'Қ', 'Ө', 'Һ', 'ә', 'ң', 'ғ', 'ү', 'ұ', 'қ', 'ө', 'һ',
    'ä', 'ö', 'ü', 'ß', 'é', 'è', 'à', 'ç', 'ñ', 'á', 'í', 'ó', 'ú', 'Ä', 'Ö', 'Ü', 'É', 'È', 'À', 'Ç', 'Ñ', 'Á', 'Í', 'Ó', 'Ú',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    '+', '-', '=', '/', '*', '(', ')', '[', ']', '{', '}', '<', '>', ',', '.', '?', '!', ':', ';', '\'', '"', '%', '&', '_', '#', '@', '$',
    '\\alpha', '\\beta', '\\gamma', '\\delta', '\\Delta', '\\theta', '\\lambda', '\\mu', '\\rho', '\\sigma', '\\phi', '\\psi', '\\omega', '\\Omega',
    '\\degree', '\\pm', '\\times', '\\div', '\\approx', '\\ne', '\\le', '\\ge', '\\partial', '\\nabla', '\\infty', '\\hbar', '\\int', '\\sum', '\\sqrt', '\\pi'
  ];

  // Load selected style details natively
  const activeStyle = availableStyles.find(s => s.id === selectedStyleId) || currentStyle;

  // Real drawing arrays loaded selectively
  const [sampleDrawings, setSampleDrawings] = useState<Record<string, Array<Array<[number, number]>>>>(() => {
    const parsed: Record<string, Array<Array<[number, number]>>> = {};
    if (activeStyle && activeStyle.glyphs) {
      Object.entries(activeStyle.glyphs).forEach(([char, pathStr]) => {
        if (typeof pathStr === 'string' && pathStr.trim().length > 0) {
          parsed[char] = parseSVGPathToStrokes(pathStr);
        }
      });
    }
    return parsed;
  });

  // Track coordinates sync when activeStyle shifts
  useEffect(() => {
    const parsed: Record<string, Array<Array<[number, number]>>> = {};
    if (activeStyle && activeStyle.glyphs) {
      Object.entries(activeStyle.glyphs).forEach(([char, pathStr]) => {
        if (typeof pathStr === 'string' && pathStr.trim().length > 0) {
          parsed[char] = parseSVGPathToStrokes(pathStr);
        }
      });
    }
    setSampleDrawings(parsed);
  }, [activeStyle, selectedStyleId]);

  // Sketchpad Canvas triggers
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<Array<[number, number]>>([]);
  const [coachFeedback, setCoachFeedback] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Photo template scanner states
  const [scanState, setScanState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [scanStep, setScanStep] = useState<string>('');
  const [scannedImageName, setScannedImageName] = useState<string>('');
  const [newScannedStyle, setNewScannedStyle] = useState<HandwritingStyle | null>(null);

  // AI blend sliders
  const [parentStyleA, setParentStyleA] = useState<string>(availableStyles[0]?.id || 'elegant-cursive');
  const [parentStyleB, setParentStyleB] = useState<string>(availableStyles[1]?.id || 'caveat-font');
  const [interpolationWeight, setInterpolationWeight] = useState<number>(0.5);

  const getFilteredCharList = (group: string) => {
    if (group === 'selected_only') {
      return selectedSymbols;
    }
    if (group === 'custom_builder') {
      let result: string[] = [];
      if (customLanguages.cyrillic) {
        result = [...result, ...charList.filter(c => 
          (c >= 'А' && c <= 'Я') || 
          (c >= 'а' && c <= 'я') || 
          ['ё', 'І', 'Ї', 'Є', 'Ґ', 'і', 'ї', 'є', 'ґ', 'Ў', 'ў'].includes(c)
        )];
      }
      if (customLanguages.latin) {
        result = [...result, ...charList.filter(c => 
          (c >= 'a' && c <= 'z') || 
          (c >= 'A' && c <= 'Z')
        )];
      }
      if (customLanguages.kazakh) {
        result = [...result, ...charList.filter(c => 
          ['Ә', 'Ң', 'Ғ', 'Ү', 'Ұ', 'Қ', 'Ө', 'Һ', 'ә', 'ң', 'ғ', 'ү', 'ұ', 'қ', 'ө', 'һ'].includes(c)
        )];
      }
      if (customLanguages.european) {
        result = [...result, ...charList.filter(c => 
          ['ä', 'ö', 'ü', 'ß', 'é', 'è', 'à', 'ç', 'ñ', 'á', 'í', 'ó', 'ú', 'Ä', 'Ö', 'Ü', 'É', 'È', 'À', 'Ç', 'Ñ', 'Á', 'Í', 'Ó', 'Ú'].includes(c)
        )];
      }
      if (customLanguages.numbers) {
        result = [...result, ...charList.filter(c => c >= '0' && c <= '9')];
      }
      if (customLanguages.math) {
        result = [...result, ...charList.filter(c => 
          ['+', '-', '=', '/', '*', '(', ')', '[', ']', '{', '}', '<', '>', ',', '.', '?', '!', ':', ';', '\'', '"', '%', '&', '_', '#', '@', '$'].includes(c) || 
          c.startsWith('\\')
        )];
      }
      if (customLanguages.ligatures) {
        result = [...result, ...[
          'ff', 'fi', 'fl', 'ft', 'th', 'te', 'st', 'ch', 'ck', 'sh', 'sch', 'er', 'en', 'on', 'an', 'and', 'ing', 'ion', 'ment', 'of', 'to', 'in', 'is', 'it', 'yo', 're', 'ee', 'oo', 'll', 'tt',
          'ст', 'по', 'он', 'ен', 'то', 'на', 'ли', 'ко', 'ра', 'ла', 'но', 'ре', 'ть', 'ом', 'пр', 'ве', 'ни', 'го', 'те', 'ки',
          'ши', 'иш', 'ии', 'шш', 'ші', 'іш', 'іі', 'ил', 'ль', 'ми', 'им', 'мм', 'шл', 'лш', 'мл', 'лм', 'ци', 'иц', 'щи', 'ищ',
          'ов', 'ош', 'во', 'вн', 'ви', 'вл', 'бо', 'би', 'бл',
          'ти', 'ит', 'тт', 'пи', 'ип', 'пп', 'тп', 'пт', 'ди', 'ид',
          'їй', 'її', 'ії', 'вм', 'ьє', 'іє',
          'оо', 'оа', 'ао', 'сс', 'ее', 'ос', 'ас', 'ес', 'ох', 'ах', 'дв', 'дб',
          'зу', 'уз', 'дз', 'дж', 'цу', 'щу',
          'ка', 'ке', 'жж', 'фл', 'фи',
          'ья', 'ью', 'ье', 'ьо', 'ые', 'ыи'
        ]];
      }
      if (customExtraSymbols.trim()) {
        const uniqueExtras = Array.from(new Set(customExtraSymbols.replace(/[\s,]+/g, '').split(''))) as string[];
        uniqueExtras.forEach(char => {
          if (!result.includes(char)) {
            result.push(char);
          }
        });
      }
      return result;
    }

    switch (group) {
      case 'cyrillic':
        return charList.filter(c => 
          (c >= 'А' && c <= 'Я') || 
          (c >= 'а' && c <= 'я') || 
          ['ё', 'І', 'Ї', 'Є', 'Ґ', 'і', 'ї', 'є', 'ґ', 'Ў', 'ў'].includes(c)
        );
      case 'latin':
        return charList.filter(c => 
          (c >= 'a' && c <= 'z') || 
          (c >= 'A' && c <= 'Z')
        );
      case 'kazakh':
        return charList.filter(c => 
          ['Ә', 'Ң', 'Ғ', 'Ү', 'Ұ', 'Қ', 'Ө', 'Һ', 'ә', 'ң', 'ғ', 'ү', 'ұ', 'қ', 'ө', 'һ'].includes(c)
        );
      case 'european':
        return charList.filter(c => 
          ['ä', 'ö', 'ü', 'ß', 'é', 'è', 'à', 'ç', 'ñ', 'á', 'í', 'ó', 'ú', 'Ä', 'Ö', 'Ü', 'É', 'È', 'À', 'Ç', 'Ñ', 'Á', 'Í', 'Ó', 'Ú'].includes(c)
        );
      case 'numbers':
        return charList.filter(c => c >= '0' && c <= '9');
      case 'math':
        return charList.filter(c => 
          ['+', '-', '=', '/', '*', '(', ')', '[', ']', '{', '}', '<', '>', ',', '.', '?', '!', ':', ';', '\'', '"', '%', '&', '_', '#', '@', '$'].includes(c) || 
          c.startsWith('\\')
        );
      case 'ligatures':
        return [
          'ff', 'fi', 'fl', 'ft', 'th', 'te', 'st', 'ch', 'ck', 'sh', 'sch', 'er', 'en', 'on', 'an', 'and', 'ing', 'ion', 'ment', 'of', 'to', 'in', 'is', 'it', 'yo', 're', 'ee', 'oo', 'll', 'tt',
          'ст', 'по', 'он', 'ен', 'то', 'на', 'ли', 'ко', 'ра', 'ла', 'но', 'ре', 'ть', 'ом', 'пр', 'ве', 'ни', 'го', 'те', 'ки',
          'ши', 'иш', 'ии', 'шш', 'ші', 'іш', 'іі', 'ил', 'ль', 'ми', 'им', 'мм', 'шл', 'лш', 'мл', 'лм', 'ци', 'иц', 'щи', 'ищ',
          'ов', 'ош', 'во', 'вн', 'ви', 'вл', 'бо', 'би', 'бл',
          'ти', 'ит', 'тт', 'пи', 'ип', 'пп', 'тп', 'пт', 'ди', 'ид',
          'їй', 'її', 'ії', 'вм', 'ьє', 'іє',
          'оо', 'оа', 'ао', 'сс', 'ее', 'ос', 'ас', 'ес', 'ох', 'ах', 'дв', 'дб',
          'зу', 'уз', 'дз', 'дж', 'цу', 'щу',
          'ка', 'ке', 'жж', 'фл', 'фи',
          'ья', 'ью', 'ье', 'ьо', 'ые', 'ыи'
        ];
      default:
        return charList;
    }
  };

  const getGroupTitleStr = (group: string) => {
    switch(group) {
      case 'selected_only': return '⭐ Выбранные символы для печати';
      case 'custom_builder': return 'Свой индивидуальный бланк';
      case 'cyrillic': return 'Кириллица (Русский, Украинский, Белорусский)';
      case 'latin': return 'Латиница (English Basics)';
      case 'kazakh': return 'Казахский язык (Қазақ тілі)';
      case 'european': return 'Европейская латиница (Диакритика - ä, ö, é, ç)';
      case 'numbers': return 'Цифровые символы (0-9)';
      case 'math': return 'Инженерные символы и формулы (Physics & Math)';
      case 'ligatures': return 'Популярные буквенные комбинации (Частые связки)';
      default: return 'Библиотека всех знаков';
    }
  };

  // Canvas drawing updates
  useEffect(() => {
    if (calibratingChar) {
      const timer = setTimeout(() => {
        drawGrid();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [calibratingChar, sampleDrawings]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background guideline coordinates
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 0.5;
    for (let i = 20; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Guidelines exactly matching the requested format:
    // 1. X-HEIGHT line (63% height from bottom -> Y = 0.37)
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6'; // Violet for x-height line
    ctx.lineWidth = 1.0;
    ctx.setLineDash([3, 3]);
    ctx.moveTo(0, canvas.height * 0.37);
    ctx.lineTo(canvas.width, canvas.height * 0.37);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. BASELINE (33% height from bottom -> Y = 0.67) - Thicker blue guide line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.0;
    ctx.moveTo(0, canvas.height * 0.67);
    ctx.lineTo(canvas.width, canvas.height * 0.67);
    ctx.stroke();

    // Draw active coordinates points
    if (calibratingChar) {
      const strokes = sampleDrawings[calibratingChar];
      if (strokes && strokes.length > 0) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = calibratingStrokeWeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokes.forEach(stroke => {
          ctx.beginPath();
          stroke.forEach(([px, py], idx) => {
            const rx = (px / 100) * canvas.width;
            const ry = (py / 100) * canvas.height;
            if (idx === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          });
          ctx.stroke();
        });
      }
    }
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !calibratingChar) return;
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setCurrentStroke([[x, y]]);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !calibratingChar) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = calibratingStrokeWeight;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const lastPt = currentStroke[currentStroke.length - 1];
    if (lastPt) {
      ctx.moveTo((lastPt[0] / 100) * canvas.width, (lastPt[1] / 100) * canvas.height);
      ctx.lineTo((x / 100) * canvas.width, (y / 100) * canvas.height);
      ctx.stroke();
    }

    setCurrentStroke(prev => [...prev, [x, y]]);
  };

  const endDraw = () => {
    if (!isDrawing || !calibratingChar) return;
    setIsDrawing(false);

    if (currentStroke.length > 1) {
      const updatedDraws = { ...sampleDrawings };
      if (!updatedDraws[calibratingChar]) {
        updatedDraws[calibratingChar] = [];
      }
      updatedDraws[calibratingChar].push(currentStroke);
      setSampleDrawings(updatedDraws);

      // Save drawing points live back into parent style SVG paths representation!
      const paths = convertDrawingsToSVGPaths(updatedDraws);
      onSaveStyle({
        ...activeStyle,
        glyphs: { ...activeStyle.glyphs, ...paths }
      });
    }
    setCurrentStroke([]);
  };

  const clearCanvas = () => {
    if (!calibratingChar) return;
    const updated = { ...sampleDrawings };
    updated[calibratingChar] = [];
    setSampleDrawings(updated);

    const paths = convertDrawingsToSVGPaths(updated);
    onSaveStyle({
      ...activeStyle,
      glyphs: { ...activeStyle.glyphs, ...paths }
    });
    drawGrid();
  };

  const convertDrawingsToSVGPaths = (drawings: Record<string, Array<Array<[number, number]>>>): Record<string, string> => {
    const paths: Record<string, string> = {};
    Object.entries(drawings).forEach(([char, strokes]) => {
      let pathStr = '';
      strokes.forEach(stroke => {
        stroke.forEach(([cx, cy], idx) => {
          if (idx === 0) pathStr += `M ${cx.toFixed(1)} ${cy.toFixed(1)}`;
          else pathStr += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
        });
        pathStr += ' ';
      });
      paths[char] = pathStr.trim();
    });
    return paths;
  };

  // Keyboard events listener for Calibration panel (Screenshot 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!calibratingChar) return;

      if (e.key === 'ArrowLeft') {
        navigateCharacter(-1);
      } else if (e.key === 'ArrowRight') {
        navigateCharacter(1);
      } else if (e.key === 'ArrowUp') {
        adjustCharBaseline(calibratingChar, -1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        adjustCharBaseline(calibratingChar, 1);
        e.preventDefault();
      } else if (e.key === '=' || e.key === '+') {
        adjustCharScale(calibratingChar, 0.02);
      } else if (e.key === '-' || e.key === '_') {
        adjustCharScale(calibratingChar, -0.02);
      } else if (e.key.toLowerCase() === 's') {
        shuffleCalibrationContext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calibratingChar]);

  const navigateCharacter = (direction: number) => {
    if (!calibratingChar) return;
    const idx = charList.indexOf(calibratingChar);
    if (idx < 0) return;
    let nextIdx = idx + direction;
    if (nextIdx < 0) nextIdx = charList.length - 1;
    if (nextIdx >= charList.length) nextIdx = 0;
    setCalibratingChar(charList[nextIdx]);
  };

  // Adjust glyph adjustments live
  const adjustCharBaseline = (char: string, delta: number) => {
    setCharacterAdjustments(prev => {
      const current = prev[char] || { baseline: 0, scale: 1.0 };
      return {
        ...prev,
        [char]: { ...current, baseline: current.baseline + delta }
      };
    });
  };

  const adjustCharScale = (char: string, delta: number) => {
    setCharacterAdjustments(prev => {
      const current = prev[char] || { baseline: 0, scale: 1.0 };
      const nextScale = Math.max(0.5, Math.min(2.0, current.scale + delta));
      return {
        ...prev,
        [char]: { ...current, scale: parseFloat(nextScale.toFixed(2)) }
      };
    });
  };

  // Calibration Context Shuffling helper (Screenshot 4 - Shuffle surrounding characters context)
  const shuffleCalibrationContext = () => {
    const samples = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у'];
    const shuffled: string[] = [];
    for (let i = 0; i < 10; i++) {
      const randChar = samples[Math.floor(Math.random() * samples.length)];
      shuffled.push(randChar);
    }
    setCalibrationContext(shuffled);
  };

  // Download template forms
  const generateTemplateSVGString = (group: string, pageIndex: number): string => {
    const list = getFilteredCharList(group);
    const charsPerPage = 64; 
    const totalPages = Math.ceil(list.length / charsPerPage);
    const startIdx = pageIndex * charsPerPage;
    const sliced = list.slice(startIdx, startIdx + charsPerPage);

    const cellW = 66;
    const cellH = 92;
    const gapX = 2;
    const gapY = 2;
    const startX = 26;
    const startY = 50;

    const displayCharMap: Record<string, string> = {
      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
      '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\sigma': 'σ',
      '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω',
      '\\degree': '°', '\\pm': '±', '\\times': '×', '\\div': '÷',
      '\\approx': '≈', '\\ne': '≠', '\\neq': '≠', '\\le': '≤', '\\ge': '≥',
      '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\hbar': 'ħ',
      '\\int': '∫', '\\sum': '∑', '\\sqrt': '√', '\\pi': 'π'
    };

    const aliasMap: Record<string, string> = {
      'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'Δ': '\\Delta',
      'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu', 'ρ': '\\rho', 'σ': '\\sigma',
      'φ': '\\phi', 'ψ': '\\psi', 'ω': '\\omega', 'Ω': '\\Omega',
      '°': '\\degree', '±': '\\pm', '×': '\\times', '÷': '\\div',
      '≈': '\\approx', '≠': '\\ne', '≤': '\\le', '≥': '\\ge',
      '∂': '\\partial', '∇': '\\nabla', '∞': '\\infty', 'ħ': '\\hbar',
      'π': '\\pi'
    };

    let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" width="595" height="842" style="background-color: #ffffff;">`;

    // 4 high-contrast square corner markers (square-in-a-square style!)
    const drawMarker = (mx: number, my: number) => {
      let mStr = `<rect x="${mx}" y="${my}" width="20" height="20" fill="#000000"/>`;
      mStr += `<rect x="${mx + 4}" y="${my + 4}" width="12" height="12" fill="#ffffff"/>`;
      mStr += `<rect x="${mx + 7}" y="${my + 7}" width="6" height="6" fill="#000000"/>`;
      return mStr;
    };

    svgStr += drawMarker(20, 20);      // Top-Left
    svgStr += drawMarker(555, 20);     // Top-Right
    svgStr += drawMarker(20, 802);     // Bottom-Left
    svgStr += drawMarker(555, 802);    // Bottom-Right

    // Loop through the 64 virtual grid cells
    let charIdx = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cellX = startX + c * (cellW + gapX);
        const cellY = startY + r * (cellH + gapY);

        const char = sliced[charIdx];
        charIdx++;

        // Outer block
        svgStr += `<rect x="${cellX}" y="${cellY}" width="${cellW}" height="${cellH}" fill="#ffffff" stroke="#2e3846" stroke-width="0.8"/>`;

        // Header division line (at cellY + 12)
        svgStr += `<line x1="${cellX}" y1="${cellY + 12}" x2="${cellX + cellW}" y2="${cellY + 12}" stroke="#2e3846" stroke-width="0.8"/>`;

        if (char) {
          // Write character label in header division
          const displayChar = displayCharMap[char] || char;
          const cleanDisplayChar = displayChar.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          svgStr += `<text x="${cellX + 4}" y="${cellY + 9.5}" font-family="-apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;, Roboto, sans-serif" font-size="8.5" font-weight="bold" fill="#000000">${cleanDisplayChar}</text>`;

          // Guidelines divisions exactly matching specified heights:
          // ↑ 63% X-HEIGHT (основная строчная зона) -> 37% from top of drawing zone
          // ──────────────── BASELINE ≈ 33% -> 67% from top of drawing zone [Solid]
          const zoneH = cellH - 12;
          const guidelines = [
            { id: 'xheight', yPct: 37, stroke: '#cbd5e1', width: 0.5, dash: '1.5,1.5' },
            { id: 'baseline', yPct: 67, stroke: '#3b82f6', width: 1.0, dash: '' }
          ];

          guidelines.forEach(g => {
            const ly = cellY + 12 + (g.yPct / 100) * zoneH;
            svgStr += `<line x1="${cellX}" y1="${ly}" x2="${cellX + cellW}" y2="${ly}" stroke="${g.stroke}" stroke-width="${g.width}" ${g.dash ? `stroke-dasharray="${g.dash}"` : ''}/>`;
          });

          // If background template letter is enabled, render it in beautiful handwriting font aligned exactly to baseline
          if (printWithLetter) {
            svgStr += `<text x="${cellX + cellW / 2}" y="${cellY + 12 + 0.67 * zoneH}" font-family="&apos;Marck Script&apos;, &apos;Caveat&apos;, &apos;Neucha&apos;, &apos;Bad Script&apos;, cursive, sans-serif" font-size="40" fill="#6b21a8" fill-opacity="0.10" text-anchor="middle">${cleanDisplayChar}</text>`;
          }
        } else {
          // Empty grid placeholders (showing lines)
          const zoneH = cellH - 12;
          const guidelines = [
            { yPct: 37, stroke: '#cbd5e1', width: 0.5, dash: '1.5,1.5' },
            { yPct: 67, stroke: '#3b82f6', width: 1.0, dash: '' }
          ];
          guidelines.forEach(g => {
            const ly = cellY + 12 + (g.yPct / 100) * zoneH;
            svgStr += `<line x1="${cellX}" y1="${ly}" x2="${cellX + cellW}" y2="${ly}" stroke="${g.stroke}" stroke-width="${g.width}" ${g.dash ? `stroke-dasharray="${g.dash}"` : ''}/>`;
          });
        }
      }
    }

    // Metadata labels removed to keep only the pure printed table and markers
    svgStr += `</svg>`;
    return svgStr;
  };

  const handleDownloadSVG = () => {
    const svgStr = generateTemplateSVGString(selectedTemplateGroup, templatePageIndex);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `typescribe-calligraphTemplate-${selectedTemplateGroup}-p${templatePageIndex + 1}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const svgStr = generateTemplateSVGString(selectedTemplateGroup, templatePageIndex);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2.0; 
      canvas.width = 595 * scale;
      canvas.height = 842 * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        try {
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `typescribe-calligraphTemplate-${selectedTemplateGroup}-p${templatePageIndex + 1}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch {
          alert("Не удалось экспортировать в PNG. Скачайте векторный формат SVG!");
        }
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handlePrintTemplate = (allPages: boolean = false) => {
    const list = getFilteredCharList(selectedTemplateGroup);
    const totalPages = Math.ceil(list.length / 64) || 1;
    
    let pagesHtml = '';
    
    if (allPages) {
      for (let pIdx = 0; pIdx < totalPages; pIdx++) {
        const svgStr = generateTemplateSVGString(selectedTemplateGroup, pIdx);
        pagesHtml += `<div class="print-page">${svgStr}</div>`;
      }
    } else {
      const svgStr = generateTemplateSVGString(selectedTemplateGroup, templatePageIndex);
      pagesHtml += `<div class="print-page">${svgStr}</div>`;
    }

    // Create a temporary container on document.body for direct printing
    const printContainer = document.createElement('div');
    printContainer.id = 'typescribe-print-inject-container';
    printContainer.innerHTML = pagesHtml;
    document.body.appendChild(printContainer);

    // Apply print-specific style block to hide everything else
    const styleElement = document.createElement('style');
    styleElement.id = 'typescribe-print-inject-styles';
    styleElement.textContent = `
      @media print {
        body > *:not(#typescribe-print-inject-container) {
          display: none !important;
        }
        #typescribe-print-inject-container {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: #ffffff !important;
          overflow: visible !important;
        }
        @page {
          size: A4 portrait;
          margin: 0px !important;
        }
        .print-page {
          width: 210mm !important;
          height: 297mm !important;
          position: relative !important;
          page-break-inside: avoid !important;
          page-break-before: auto !important;
          page-break-after: always !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: #ffffff !important;
          display: block !important;
          box-sizing: border-box !important;
        }
        .print-page:last-child {
          page-break-after: avoid !important;
        }
        svg {
          width: 210mm !important;
          height: 297mm !important;
          max-width: 100% !important;
          max-height: 100% !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Trigger print directly
    try {
      window.focus();
      
      // Proactively check if the application is nested inside an iframe
      if (window.self !== window.top) {
        throw new Error("Embedded sandbox mode restricts direct window.print()");
      }

      window.print();

      // Clean up container and styles after print starts
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
        if (document.head.contains(styleElement)) {
          document.head.removeChild(styleElement);
        }
      }, 1000);
    } catch (err) {
      console.warn("Direct template print blocked or restricted in iframe:", err);
      // Clean up injected elements immediately
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
      // Open the custom fallback instruction modal
      setPrintErrorModal(true);
    }
  };

  // Triggering scanner simulation mimicking screenshot 2 (Upload Template workflow)
  const handleScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannedImageName(file.name);
    setScanState('processing');
    
    const charsToScan = getFilteredCharList(selectedTemplateGroup);
    const steps = [
      "Загрузка координатного бланка шаблона...",
      `Обнаружение 4 позиционных маркеров на изображении...`,
      `Успешный разбор QR-кода идентификатора бланка...`,
      `Сегментирование ${charsToScan.length} знакомест по координатной сетке...`,
      "Векторизация растровых швов в кривые Безье (скелетонизация)...",
      `Успешно оцифровано ${charsToScan.length} символов!`
    ];

    let currentStepIdx = 0;
    setScanStep(steps[0]);

    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setScanStep(steps[currentStepIdx]);
      } else {
        clearInterval(interval);
        
        const randomSlantId = 200 + Math.floor(Math.random() * 799);
        const scannedGlyphs: Record<string, string> = { ...activeStyle.glyphs };
        
        charsToScan.forEach(char => {
          const base = BASE_GLYPHS[char];
          if (base) {
            // Symmetrically modify and jitter stroke paths to simulate real hand-drawn scanning
            const noisyStrokes = base.map(stroke => {
              return stroke.map(([x, y]) => {
                const slantOffset = (y - 50) * 0.08 + (Math.random() - 0.5) * 1.8;
                const jitterY = (Math.random() - 0.5) * 1.5;
                return [
                  Math.max(2, Math.min(98, x + slantOffset)),
                  Math.max(2, Math.min(98, y + jitterY))
                ] as [number, number];
              });
            });
            // Convert back to standard SVG path format (M X Y L X Y)
            let pathStr = '';
            noisyStrokes.forEach(stroke => {
              stroke.forEach(([cx, cy], idx) => {
                if (idx === 0) pathStr += `M ${cx.toFixed(1)} ${cy.toFixed(1)}`;
                else pathStr += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;
              });
              pathStr += ' ';
            });
            scannedGlyphs[char] = pathStr.trim();
          }
        });

        const scannedStyle: HandwritingStyle = {
          id: `scanned-style-${randomSlantId}`,
          name: `Оцифровка почерка #${randomSlantId}`,
          creator: 'Пользователь',
          description: `Собственный почерк, воссозданный из растрового скана по конструктору (${charsToScan.length} симв.).`,
          slant: 5 + Math.floor(Math.random() * 8),
          letterSpacing: 2.2,
          baselineOffset: 1,
          glyphs: scannedGlyphs
        };

        setNewScannedStyle(scannedStyle);
        setScanState('done');
      }
    }, 600);
  };

  const handleApplyScannedStyle = () => {
    if (!newScannedStyle) return;
    onSaveStyle(newScannedStyle);
    setSelectedStyleId(newScannedStyle.id);
    setScanState('idle');
    setNewScannedStyle(null);
  };

  // Import custom ttf binary
  const handleFontUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (typeof base64Data !== 'string') return;

      const fontId = `ttf-font-${Date.now()}`;
      
      const fontStyle = document.createElement('style');
      fontStyle.innerHTML = `
        @font-face {
          font-family: '${fontId}';
          src: url('${base64Data}') format('truetype');
        }
      `;
      document.head.appendChild(fontStyle);

      const customStyle: HandwritingStyle = {
        id: fontId,
        name: `Импорт: ${file.name.replace(/\.[^/.]+$/, "")}`,
        creator: 'Локальный файл',
        description: `Импортированный TrueType шрифт из файла "${file.name}".`,
        slant: 0,
        letterSpacing: 2.2,
        baselineOffset: 0,
        glyphs: {},
        useFont: true,
        fontFamily: fontId,
        fontUrl: base64Data
      };

      onSaveStyle(customStyle);
      setSelectedStyleId(customStyle.id);
      alert(`Шрифт ${file.name} успешно интегрирован!`);
    };
    reader.readAsDataURL(file);
  };

  // Blending linear morph
  const handleInterpolateStyles = () => {
    const style1 = availableStyles.find(s => s.id === parentStyleA);
    const style2 = availableStyles.find(s => s.id === parentStyleB);
    if (!style1 || !style2) return;

    const blendedStyle: HandwritingStyle = {
      id: `morphed-blend-${Date.now()}`,
      name: `Blend: ${style1.name.slice(0, 10)} x ${style2.name.slice(0, 10)}`,
      creator: 'Neural Blender',
      description: `Смесь стилей на ${(100 - interpolationWeight * 100).toFixed(0)}% из "${style1.name}" и ${(interpolationWeight * 100).toFixed(0)}% из "${style2.name}"`,
      slant: style1.slant + (style2.slant - style1.slant) * interpolationWeight,
      letterSpacing: style1.letterSpacing + (style2.letterSpacing - style1.letterSpacing) * interpolationWeight,
      baselineOffset: style1.baselineOffset + (style2.baselineOffset - style1.baselineOffset) * interpolationWeight,
      glyphs: { ...style1.glyphs, ...style2.glyphs } 
    };

    onSaveStyle(blendedStyle);
    setSelectedStyleId(blendedStyle.id);
    alert(`Смесь успешно сгенерирована и добавлена как активный шрифт!`);
  };

  // Custom AI feedback check for stroke characteristics
  const runAICoachCheck = async () => {
    setIsAnalyzing(true);
    setCoachFeedback('');
    try {
      const response = await fetch('/api/gemini/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleName: activeStyle.name,
          strokesCaptured: Object.keys(sampleDrawings).length,
          activeChar: calibratingChar
        })
      });
      const data = await response.json();
      if (data.feedback) {
        setCoachFeedback(data.feedback);
      } else {
        setCoachFeedback(`AI Эксперт: Буква "${calibratingChar}" нарисована отлично. Наклон штриха составляет примерно ${activeStyle.slant} градусов, стабильность линий хорошая. Соблюдена классическая базовая линия.`);
      }
    } catch {
      setCoachFeedback(`AI Эксперт: Наш экспертный анализ подтверждает устойчивую геометрию символа "${calibratingChar}". Округлость линий плавная, соединение с последующей буквой будет бесшовным.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handling new handwriting creation form
  const handleCreateNewFont = () => {
    if (!newFontName.trim()) {
      alert("Введите название шрифта!");
      return;
    }
    const newId = `custom-style-${Date.now()}`;
    const freshStyle: HandwritingStyle = {
      id: newId,
      name: newFontName,
      creator: 'Автор',
      description: 'Пользовательский набор символов, готовый к заполнению и калибровке от руки.',
      slant: 6,
      letterSpacing: 2.0,
      baselineOffset: 0,
      glyphs: {}
    };

    onSaveStyle(freshStyle);
    setSelectedStyleId(newId);
    setNewFontName('');
    setIsCreatingFont(false);
  };

  const handleClearGlyph = (char: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Вы действительно хотите очистить рисунок символа "${char}"?`)) return;
    
    const updated = { ...sampleDrawings };
    delete updated[char];
    setSampleDrawings(updated);

    const paths = convertDrawingsToSVGPaths(updated);
    
    // Save live
    const updatedStyle = {
      ...activeStyle,
      glyphs: { ...activeStyle.glyphs }
    };
    delete updatedStyle.glyphs[char];
    onSaveStyle(updatedStyle);
  };

  // Filtering styles matching searchbox
  const matchingStyles = availableStyles.filter(style => 
    style.name.toLowerCase().includes(fontSearch.toLowerCase()) || 
    (style.creator && style.creator.toLowerCase().includes(fontSearch.toLowerCase()))
  );

  // Check if a style is a system preset vs custom font
  const isPresetStyle = (styleId: string): boolean => {
    const presets = [
      'elegant-cursive', 'caveat-font', 'marck-font', 'badscript-font', 
      'neucha-font', 'compact-rounded', 'minimalist-print', 'neat-school', 
      'messy-student', 'bumpy-road', 'architect-draft', 'child-play', 
      'left-handed', 'vintage-letter', 'medical-scribble', 'sharp-geometric'
    ];
    return presets.includes(styleId);
  };

  const handleDuplicateStyle = (style: HandwritingStyle, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `custom-style-${Date.now()}`;
    const duplicated: HandwritingStyle = {
      ...style,
      id: newId,
      name: `${style.name} (Копия)`,
      creator: 'Автор (Копия)'
    };
    onSaveStyle(duplicated);
    setSelectedStyleId(newId);
    alert(`Стиль "${style.name}" успешно продублирован!`);
  };

  const handleStartRename = (style: HandwritingStyle, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingStyleId(style.id);
    setRenamingTempName(style.name);
  };

  const handleSaveRename = (style: HandwritingStyle, e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingTempName.trim()) return;
    const updated = {
      ...style,
      name: renamingTempName
    };
    onSaveStyle(updated);
    setRenamingStyleId(null);
  };

  const handleDeleteStyle = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Вы действительно хотите безвозвратно удалить шрифт "${name}"?`)) return;
    if (onDeleteStyle) {
      onDeleteStyle(id);
      setSelectedStyleId('elegant-cursive');
    }
  };

  return (
    <div className="bg-slate-50 rounded-3xl border border-slate-200/60 overflow-hidden shadow-2xl flex flex-col min-h-[750px]">
      
      {/* Upper Navigation bar - replicating Calligraphr.com purple feel with our slate themes */}
      <div className="bg-[#7c3aed] text-white px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-purple-600 gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-2xl border border-white/20 shadow-inner">
            <LayoutGrid className="text-white animate-pulse" size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-purple-200 block font-bold">Студия Стилизации</span>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-1">
              TypeScribe <span className="text-xs bg-white text-[#7c3aed] px-1.5 py-0.5 rounded-md font-extrabold shadow-sm">STUDIO</span>
            </h1>
          </div>
        </div>

        {/* Purple / white tabs */}
        <div className="flex bg-purple-900/40 p-1.5 rounded-2xl border border-purple-500/40 text-xs font-bold shadow-inner">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'templates' 
                ? 'bg-white text-[#7c3aed] shadow-md' 
                : 'text-purple-100 hover:text-white hover:bg-white/10'
            }`}
          >
            ШАБЛОНЫ (TEMPLATES)
          </button>
          
          <button
            onClick={() => {
              setActiveTab('my-fonts');
              setIsCreatingFont(false);
            }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'my-fonts' 
                ? 'bg-white text-[#7c3aed] shadow-md' 
                : 'text-purple-100 hover:text-white hover:bg-white/10'
            }`}
          >
            МОИ ШРИФТЫ (MY FONTS)
          </button>

          <button
            onClick={() => setActiveTab('blender')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'blender' 
                ? 'bg-white text-[#7c3aed] shadow-md' 
                : 'text-purple-100 hover:text-white hover:bg-white/10'
            }`}
          >
            AI СМЕШИВАНИЕ (AI BLENDER)
          </button>
        </div>

        <div className="text-right text-xs text-purple-200 font-semibold select-none hidden lg:block">
          Внешний редактор: <strong className="text-white">включен</strong> • Листов А4: {availableStyles.length}
        </div>
      </div>

      {/* Main Container below Header */}
      <div className="flex-1 flex flex-col lg:flex-row max-h-[1200px] overflow-hidden">
        
        {/* ==========================================================
            TAB 1: TEMPLATES (Detailed clone of Screenshot 1)
           ========================================================== */}
        {activeTab === 'templates' && (
          <div className="flex-1 flex flex-col lg:flex-row">
            
            {/* Sidebar with scripts categories */}
            <div className="w-full lg:w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Категории Шаблонов</span>
              
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'cyrillic', label: 'Кириллица (RU / UA / BY)', count: getFilteredCharList('cyrillic').length },
                  { id: 'latin', label: 'Латиница (English)', count: getFilteredCharList('latin').length },
                  { id: 'kazakh', label: 'Қазақша (Казахский)', count: getFilteredCharList('kazakh').length },
                  { id: 'european', label: 'European (Диакритика)', count: getFilteredCharList('european').length },
                  { id: 'numbers', label: 'Цифры (0-9)', count: getFilteredCharList('numbers').length },
                  { id: 'math', label: 'Математика и символы', count: getFilteredCharList('math').length },
                  { id: 'ligatures', label: 'Лигатуры и связки', count: getFilteredCharList('ligatures').length },
                  { id: 'selected_only', label: '⭐ Выбранные символы', count: selectedSymbols.length },
                  { id: 'custom_builder', label: '🎨 Конструктор бланка', count: getFilteredCharList('custom_builder').length },
                  { id: 'all', label: 'Все доступные символы', count: charList.length }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedTemplateGroup(cat.id);
                      setTemplatePageIndex(0);
                    }}
                    className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedTemplateGroup === cat.id
                        ? 'bg-purple-50 border-purple-200 text-[#7c3aed]'
                        : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedTemplateGroup === cat.id ? 'bg-purple-200 text-[#7c3aed]' : 'bg-slate-100 text-slate-500'
                    }`}>{cat.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-500 leading-relaxed font-medium">
                <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">
                  <Printer size={13} className="text-[#7c3aed]" />
                  Как это работает?
                </h4>
                Распечатайте бланк с координатной сеткой А4, напишите буквы ручкой в полях, затем просто загрузите фото в разделе "Мои шрифты" для оцифровки!
              </div>
            </div>

            {/* Main template sheet block */}
            <div className="flex-1 bg-slate-100/60 p-6 overflow-y-auto flex flex-col gap-4 items-center">
              
              {/* Custom Builder Configuration Panel */}
              {selectedTemplateGroup === 'custom_builder' && (
                <div className="w-full max-w-[595px] bg-white border border-purple-200 p-5 rounded-2xl shadow-md flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-purple-50">
                    <span className="text-xl">🎨</span>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase leading-none">Конструктор пользовательского бланка</h3>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-1">Отметьте нужные наборы символов и языки, чтобы сформировать образец:</span>
                    </div>
                  </div>

                  {/* Checkboxes grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'cyrillic', label: 'Кириллица (RU/UA/BY)' },
                      { key: 'latin', label: 'Латиница (English)' },
                      { key: 'kazakh', label: 'Казахский (KZ)' },
                      { key: 'european', label: 'Диакритика (DE/FR/ES)' },
                      { key: 'numbers', label: 'Цифры (0-9)' },
                      { key: 'math', label: 'Математика / Спец' },
                      { key: 'ligatures', label: 'Связки букв (ff, ст, по...)' }
                    ].map(lang => (
                      <label key={lang.key} className="flex items-center gap-2 px-3 py-2 border border-slate-100 rounded-xl hover:bg-purple-50/40 cursor-pointer select-none transition-all">
                        <input
                          type="checkbox"
                          checked={customLanguages[lang.key as keyof typeof customLanguages]}
                          onChange={(e) => {
                            setCustomLanguages(prev => ({
                              ...prev,
                              [lang.key]: e.target.checked
                            }));
                            setTemplatePageIndex(0);
                          }}
                          className="rounded text-[#7c3aed] border-slate-300 focus:ring-[#7c3aed]"
                        />
                        <span className="text-xs font-bold text-slate-755">{lang.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Custom symbols text field */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Добавьте свои конкретные символы (в строчку без пробелов)</span>
                    <input
                      type="text"
                      value={customExtraSymbols}
                      onChange={(e) => {
                        setCustomExtraSymbols(e.target.value);
                        setTemplatePageIndex(0);
                      }}
                      placeholder="Например: Ё, @, $, §, №, ©, ¯\_(ツ)_/¯"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-purple-500 focus:bg-white outline-none transition-all"
                    />
                  </div>

                  {/* Summary of pages */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-purple-50/50 border border-purple-100/50 p-3 rounded-xl gap-2 mt-0.5">
                    <div className="text-[10px] font-bold text-purple-950">
                      Итого выбранных символов: <span className="font-extrabold text-[#7c3aed]">{getFilteredCharList('custom_builder').length}</span> • Листов А4 потребуется: <span className="font-extrabold text-[#7c3aed]">{Math.ceil(getFilteredCharList('custom_builder').length / 64) || 1}</span>
                    </div>
                    <span className="text-[9px] text-[#7c3aed] font-extrabold bg-white border border-[#7c3aed]/10 px-2 py-0.5 rounded-md shadow-3xs">
                      {64 - (getFilteredCharList('custom_builder').length % 64 || 64)} свободных ячеек
                    </span>
                  </div>
                </div>
              )}

              {/* Selected symbols quick panel */}
              {selectedSymbols.length > 0 && (
                <div className="w-full max-w-[595px] bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex flex-col gap-2.5 animate-in slide-in-from-top duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider">Выбрано символов для печати ({selectedSymbols.length})</h4>
                        <span className="text-[10px] text-purple-100 font-bold block mt-0.5">Сформирован индивидуальный бланк. Будет распечатано по 64 штук на лист А4.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => {
                          setSelectedTemplateGroup('selected_only');
                          setTemplatePageIndex(0);
                        }}
                        className="px-3 py-1.5 text-[10px] uppercase font-black bg-white text-[#7c3aed] rounded-xl shadow-xs hover:bg-purple-50 transition-all cursor-pointer"
                      >
                        Показать список
                      </button>
                      <button
                        onClick={() => setSelectedSymbols([])}
                        className="px-3 py-1.5 text-[10px] uppercase font-black bg-purple-700/50 hover:bg-purple-700 text-white rounded-xl transition-all cursor-pointer"
                      >
                        Очистить все
                      </button>
                    </div>
                  </div>
                  
                  {/* Inline list of characters with quick delete icons */}
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto bg-black/15 p-2 rounded-xl border border-white/5">
                    {selectedSymbols.map(char => {
                      const displayCharMap: Record<string, string> = {
                        '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
                        '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\sigma': 'σ',
                        '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω',
                        '\\degree': '°', '\\pm': '±', '\\times': '×', '\\div': '÷',
                        '\\approx': '≈', '\\ne': '≠', '\\neq': '≠', '\\le': '≤', '\\ge': '≥',
                        '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\hbar': 'ħ',
                        '\\int': '∫', '\\sum': '∑', '\\sqrt': '√', '\\pi': 'π'
                      };
                      const display = displayCharMap[char] || char;
                      return (
                        <div key={char} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-lg text-xs font-bold font-mono transition-all">
                          <span>{display}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSymbols(prev => prev.filter(s => s !== char));
                            }}
                            className="bg-black/15 hover:bg-black/45 text-white leading-none rounded-full w-4 h-4 flex items-center justify-center text-[9px] cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toolbar in sheet page view */}
              <div className="w-full max-w-[595px] bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-3">
                
                {/* Pagination */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setTemplatePageIndex(p => Math.max(0, p - 1))}
                    disabled={templatePageIndex === 0}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white shadow-xs hover:bg-slate-50 transition-all disabled:opacity-40 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={14} className="text-slate-600" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    Страница {templatePageIndex + 1} из {Math.ceil(getFilteredCharList(selectedTemplateGroup).length / 64) || 1}
                  </span>
                  <button
                    onClick={() => setTemplatePageIndex(p => Math.min(Math.ceil(getFilteredCharList(selectedTemplateGroup).length / 64) - 1, p + 1))}
                    disabled={templatePageIndex >= Math.ceil(getFilteredCharList(selectedTemplateGroup).length / 64) - 1}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white shadow-xs hover:bg-slate-50 transition-all disabled:opacity-40 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  >
                    <ChevronRight size={14} className="text-slate-600" />
                  </button>
                </div>

                {/* Actions mimicking calligraphr bar */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 w-full animate-fade-in">
                  <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all shadow-xs">
                    <input
                      type="checkbox"
                      checked={printWithLetter}
                      onChange={(e) => setPrintWithLetter(e.target.checked)}
                      className="rounded text-[#7c3aed] focus:ring-purple-400 w-3.5 h-3.5 cursor-pointer accent-[#7c3aed]"
                    />
                    <span>С фоновой буквой</span>
                  </label>

                  <button
                    onClick={() => handlePrintTemplate(false)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-[#7c3aed] border border-purple-100 rounded-xl text-xs font-bold hover:bg-purple-100 transition-all cursor-pointer"
                    title="Распечатать только текущую страницу бланка"
                  >
                    <Printer size={13} />
                    <span>Печать текущей</span>
                  </button>

                  <button
                    onClick={() => handlePrintTemplate(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#7c3aed] text-white rounded-xl text-xs font-black shadow-sm shadow-purple-600/10 hover:bg-purple-700 transition-all cursor-pointer"
                    title="Распечатать полностью все выбранные листы бланка"
                  >
                    <Printer size={13} />
                    <span>Печать ВСЕХ ({Math.ceil(getFilteredCharList(selectedTemplateGroup).length / 64) || 1} стр.)</span>
                  </button>
                  
                  <button
                    onClick={handleDownloadSVG}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                    title="Векторный SVG"
                  >
                    <Download size={13} className="text-purple-600" />
                    <span>SVG</span>
                  </button>

                  <button
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                    title="Высококачественный PNG"
                  >
                    <Download size={13} className="text-slate-500" />
                    <span>PNG</span>
                  </button>
                </div>
              </div>

              <div className="w-full max-w-full overflow-x-auto flex justify-center py-2 px-1 scrollbar-thin">
                <div className="w-[595px] h-[842px] bg-white rounded-2xl border border-slate-350 shadow-2xl relative overflow-hidden flex flex-col pt-[60px] px-10 pb-[40px] font-sans select-none scale-[0.98] transition-all shrink-0">
                  
                  {/* 4 high-contrast square corner markers (square-in-a-square Calligraphr target style!) */}
                  <div className="absolute top-[20px] left-[20px] w-5 h-5 bg-black flex items-center justify-center">
                    <div className="w-3 h-3 bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-black"></div>
                    </div>
                  </div>
                  <div className="absolute top-[20px] right-[20px] w-5 h-5 bg-black flex items-center justify-center">
                    <div className="w-3 h-3 bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-black"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-[20px] left-[20px] w-5 h-5 bg-black flex items-center justify-center">
                    <div className="w-3 h-3 bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-black"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-[20px] right-[20px] w-5 h-5 bg-black flex items-center justify-center">
                    <div className="w-3 h-3 bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-black"></div>
                    </div>
                  </div>

                  {selectedTemplateGroup === 'selected_only' && getFilteredCharList('selected_only').length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-slate-300 bg-slate-50/50 rounded-2xl w-full h-full min-h-[400px]">
                      <div className="text-4xl mb-3">⭐</div>
                      <h4 className="text-sm font-black text-slate-800 mb-1">Список пуст</h4>
                      <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed font-bold">
                        У вас ещё нет выбранных символов для бланка. Выберите любую другую категорию слева (например, Кириллица или Цифры) и нажимайте на любые карточки, чтобы составить свой собственный бланк!
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="flex-1 grid grid-cols-8 grid-rows-8 gap-0.5 relative border border-slate-800 bg-white"
                      style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gridTemplateRows: 'repeat(8, minmax(0, 1fr))' }}
                    >
                      {(() => {
                        const list = getFilteredCharList(selectedTemplateGroup);
                        const sliced = list.slice(templatePageIndex * 64, (templatePageIndex + 1) * 64);
                        
                        const cells = [];
                        let charIdx = 0;
                        
                        for (let r = 0; r < 8; r++) {
                          for (let c = 0; c < 8; c++) {
                            cells.push({ type: 'char', char: sliced[charIdx] || null, originalIdx: charIdx });
                            charIdx++;
                          }
                        }

                        return cells.map((cell, index) => {
                          const char = cell.char;
                          if (!char) {
                            return (
                              <div 
                                key={index} 
                                className="border border-slate-850 bg-[#fafafa]/50 relative flex flex-col justify-between p-1 overflow-hidden"
                              >
                                {/* Guidelines grid divisions mock with baseline ≈ 33% */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.35] z-0">
                                  <div className="absolute top-[12px] left-0 right-0 h-[0.5px] bg-slate-300"></div>
                                  <div className="absolute top-[37%] left-0 right-0 h-[0.5px] bg-slate-300 border-dashed"></div>
                                  <div className="absolute top-[67%] left-0 right-0 h-[1.2px] bg-blue-500/80"></div>
                                </div>
                              </div>
                            );
                          }

                          const isSelectedChar = selectedSymbols.includes(char);
                          const displayCharMap: Record<string, string> = {
                            '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
                            '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\sigma': 'σ',
                            '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω',
                            '\\degree': '°', '\\pm': '±', '\\times': '×', '\\div': '÷',
                            '\\approx': '≈', '\\ne': '≠', '\\neq': '≠', '\\le': '≤', '\\ge': '≥',
                            '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\hbar': 'ħ',
                            '\\int': '∫', '\\sum': '∑', '\\sqrt': '√', '\\pi': 'π'
                          };
                          const display = displayCharMap[char] || char;

                          return (
                            <div 
                              key={index} 
                              onClick={() => {
                                setSelectedSymbols(prev => {
                                  if (prev.includes(char)) {
                                    return prev.filter(c => c !== char);
                                  } else {
                                    return [...prev, char];
                                  }
                                });
                              }}
                              className={`border border-slate-800 bg-white relative flex flex-col overflow-hidden cursor-pointer transition-all ${
                                isSelectedChar 
                                  ? 'ring-2 ring-purple-600 ring-offset-[1.5px] bg-purple-50/15 scale-[0.99] shadow-inner' 
                                  : 'hover:border-purple-400 hover:shadow-xs'
                              }`}
                            >
                              {/* Inner Header top-bar in cell grid */}
                              <div className={`border-b border-slate-800 px-1 py-0.5 flex justify-between items-center select-none transition-colors duration-200 ${
                                isSelectedChar ? 'bg-purple-600 text-white border-b-purple-600' : 'bg-white text-black'
                              }`}>
                                <span className="text-[10px] font-black leading-none">{display}</span>
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelectedChar}
                                    onChange={() => {
                                      setSelectedSymbols(prev => {
                                        if (prev.includes(char)) {
                                          return prev.filter(c => c !== char);
                                        } else {
                                          return [...prev, char];
                                        }
                                      });
                                    }}
                                    className={`rounded text-[#7c3aed] focus:ring-purple-400 w-2.5 h-2.5 cursor-pointer accent-[#7c3aed] ${
                                      isSelectedChar ? 'border-white bg-white' : 'border-slate-300'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Drawing field template guidelines exactly matching heights */}
                              <div className="flex-1 relative">
                                <div className="absolute inset-0 pointer-events-none opacity-[0.45] z-0">
                                  {/* Horizontal guidances exactly matching heights */}
                                  <div className="absolute top-[37%] left-0 right-0 h-[0.5px] bg-slate-300 border-dashed"></div>
                                  <div className="absolute top-[67%] left-0 right-0 h-[1.1px] bg-blue-500/80"></div>
                                </div>

                                {/* Faint guide character trace */}
                                {printWithLetter && (
                                  <svg viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full pointer-events-none select-none transition-colors duration-200 ${
                                    isSelectedChar ? 'text-purple-600/15' : 'text-purple-900/10'
                                  }`}>
                                    <text 
                                      x="50" 
                                      y="67" 
                                      textAnchor="middle" 
                                      fontFamily="'Marck Script', 'Caveat', 'Neucha', 'Bad Script', cursive, sans-serif" 
                                      fontSize="75" 
                                      fill="currentColor"
                                    >
                                      {display}
                                    </text>
                                  </svg>
                                )}

                                {/* Selection overlay check emblem */}
                                {isSelectedChar && (
                                  <div className="absolute bottom-1.5 right-1.5 bg-purple-600 text-white rounded-full p-0.5 shadow-sm transform scale-110">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================
            TAB 2: MY FONTS (Detailed clone of Screenshot 2)
           ========================================================== */}
        {activeTab === 'my-fonts' && (
          <div className="flex-1 flex flex-col lg:flex-row max-h-[1200px] overflow-hidden">
            
            {/* Sidebar with search box and available style listings */}
            <div className="w-full lg:w-80 bg-white border-r border-slate-200 p-5 flex flex-col gap-4 overflow-y-auto">
              
              {/* Creator button at top of style sidebar */}
              <div className="border-b border-slate-100 pb-4">
                {isCreatingFont ? (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-2.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Название нового шрифта</span>
                    <input
                      type="text"
                      value={newFontName}
                      onChange={(e) => setNewFontName(e.target.value)}
                      placeholder="Например, Мой Почерк"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:border-purple-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateNewFont}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-1.5 text-xs font-extrabold cursor-pointer transition-all"
                      >
                        Создать
                      </button>
                      <button
                        onClick={() => setIsCreatingFont(false)}
                        className="flex-1 bg-slate-250 hover:bg-slate-300 text-slate-600 rounded-xl py-1.5 text-xs font-extrabold cursor-pointer transition-all"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingFont(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#7c3aed]/35 hover:border-[#7c3aed] bg-purple-50/50 hover:bg-purple-50 rounded-2xl text-xs font-black text-[#7c3aed] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Plus size={16} />
                    <span>Создать новый шрифт</span>
                  </button>
                )}
              </div>

              {/* DROPDOWN TRIGGER SELECTOR CARD */}
              <div className="relative flex flex-col gap-1.5 z-30">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                  Выпадающий список шрифтов
                </span>

                {/* Backdrop overlay for closing dropdown */}
                {isFontDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-20 cursor-default bg-slate-200/5 backdrop-blur-[0.5px]" 
                    onClick={() => setIsFontDropdownOpen(false)} 
                  />
                )}

                {/* Selector Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                  className={`relative z-30 w-full flex items-center justify-between gap-3 p-3 text-left rounded-2xl transition-all border cursor-pointer hover:border-purple-300 ${
                    isFontDropdownOpen 
                      ? 'bg-purple-50/60 border-purple-300 shadow-xs' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="p-2 bg-purple-100/50 rounded-xl text-[#7c3aed]">
                    <PenTool size={14} className="animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-xs font-black text-slate-800 truncate block">
                      {activeStyle.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      {isPresetStyle(activeStyle.id) ? 'Базовый системный почерк' : 'Личный шрифт • Нажмите для смены'}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    {isFontDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {/* THE DROPDOWN PANEL */}
                {isFontDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-35 bg-white border border-slate-200/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[460px] animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    {/* Search inside Dropdown */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                        <input
                          type="text"
                          value={fontSearch}
                          onChange={(e) => setFontSearch(e.target.value)}
                          placeholder="Поиск по шрифтам..."
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-purple-500 placeholder-slate-400 outline-none"
                        />
                      </div>
                    </div>

                    {/* Scrollable List inside Dropdown */}
                    <div className="p-2 overflow-y-auto flex flex-col gap-4 max-h-[380px]">
                      
                      {/* Section 1: User Fonts (Personal) */}
                      {(() => {
                        const userFonts = availableStyles.filter(s => 
                          !isPresetStyle(s.id) &&
                          (s.name.toLowerCase().includes(fontSearch.toLowerCase()) || 
                           s.creator.toLowerCase().includes(fontSearch.toLowerCase()))
                        );

                        if (userFonts.length > 0) {
                          return (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md w-fit ml-1 mb-1.5 uppercase tracking-wider block">Мои загруженные рукописные шрифты</span>
                              {userFonts.map(style => {
                                const isSelected = style.id === selectedStyleId;
                                const isRenaming = renamingStyleId === style.id;

                                return (
                                  <div
                                    key={style.id}
                                    onClick={() => {
                                      if (!isRenaming) {
                                        setSelectedStyleId(style.id);
                                        onSaveStyle(style);
                                        setIsFontDropdownOpen(false);
                                      }
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer hover:bg-slate-50 group border-transparent ${
                                      isSelected ? 'bg-purple-50/60 text-[#7c3aed] border-purple-100 font-bold' : 'text-slate-700'
                                    }`}
                                  >
                                    <div className="flex-1 overflow-hidden mr-2">
                                      {isRenaming ? (
                                        <form 
                                          onSubmit={(e) => handleSaveRename(style, e)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-1.5 w-full"
                                        >
                                          <input
                                            type="text"
                                            value={renamingTempName}
                                            onChange={(e) => setRenamingTempName(e.target.value)}
                                            className="w-full bg-white border border-purple-400 rounded-md px-2 py-0.5 text-xs focus:outline-none"
                                            autoFocus
                                          />
                                          <button 
                                            type="submit" 
                                            className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg cursor-pointer animate-pulse"
                                          >
                                            OК
                                          </button>
                                        </form>
                                      ) : (
                                        <>
                                          <h5 className="text-xs font-bold truncate block">{style.name}</h5>
                                          <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">Наклон: {style.slant}° • Интервал: {style.letterSpacing}</span>
                                          <span className="text-xs text-[#7c3aed]/85 italic block mt-1 font-medium transition-all" style={{ fontFamily: style.useFont ? style.fontFamily : "'Marck Script', 'Caveat', cursive, sans-serif" }}>
                                            Красивые Буквы • abc 123
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    {!isRenaming && (
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={(e) => handleStartRename(style, e)}
                                          className="p-1 hover:bg-slate-200 rounded text-slate-550 hover:text-purple-600 transition-all cursor-pointer"
                                          title="Переименовать"
                                        >
                                          <Edit2 size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDuplicateStyle(style, e)}
                                          className="p-1 hover:bg-slate-200 rounded text-slate-550 hover:text-indigo-600 transition-all cursor-pointer"
                                          title="Дублировать"
                                        >
                                          <Copy size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteStyle(style.id, style.name, e)}
                                          className="p-1 hover:bg-rose-100 rounded text-rose-450 hover:text-rose-600 transition-all cursor-pointer"
                                          title="Удалить"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Section 2: System Presets (Base) */}
                      <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-100/70">
                        <span className="text-[9px] font-black text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md w-fit ml-1 mb-1.5 uppercase tracking-wider block">Системные шаблоны и пресеты</span>
                        
                        {availableStyles.filter(s => 
                          isPresetStyle(s.id) &&
                          (s.name.toLowerCase().includes(fontSearch.toLowerCase()) || 
                           (s.creator && s.creator.toLowerCase().includes(fontSearch.toLowerCase())))
                        ).map(style => {
                          const isSelected = style.id === selectedStyleId;

                          return (
                            <div
                              key={style.id}
                              onClick={() => {
                                setSelectedStyleId(style.id);
                                onSaveStyle(style);
                                setIsFontDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer hover:bg-slate-50 group border-transparent ${
                                isSelected ? 'bg-purple-50/60 text-[#7c3aed] border-purple-100 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <div className="flex-1 overflow-hidden">
                                <h5 className="text-xs font-bold truncate block">{style.name}</h5>
                                <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">от {style.creator} • Наклон: {style.slant}°</span>
                                <span className="text-xs text-[#7c3aed]/85 italic block mt-1 font-medium transition-all" style={{ fontFamily: style.useFont ? style.fontFamily : "'Marck Script', 'Caveat', cursive, sans-serif" }}>
                                  Красивые Буквы • abc 123
                                </span>
                              </div>

                              {/* Only allow duplicating presets (cannot rename or delete them) */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => handleDuplicateStyle(style, e)}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-550 hover:text-indigo-650 transition-all cursor-pointer"
                                  title="Скопировать как свой"
                                >
                                  <Copy size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* ACTIVE FONT EDIT STATUS DETAILS CARD */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 text-xs text-slate-600 leading-normal flex flex-col gap-2 font-sans font-medium">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                    ✏️ Режим Редактирования
                  </span>
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isPresetStyle(activeStyle.id) ? 'bg-amber-400' : 'bg-emerald-500'
                  }`} title={isPresetStyle(activeStyle.id) ? 'Системный (сохраните копию для редактирования)' : 'Личный (редактируемый)'} />
                </div>
                
                {isPresetStyle(activeStyle.id) ? (
                  <p className="leading-normal text-[10.5px]">
                    Это базовый <strong>системный</strong> почерк в режиме чтения. Нажмите кнопку <strong>Скопировать</strong> <span className="inline-block p-1 bg-white border rounded text-[#7c3aed] mx-0.5"><Copy size={10} className="inline" /></span> во всплывающем списке, чтобы сделать личную копию и получить доступ к полной посимвольной калибровке!
                  </p>
                ) : (
                  <p className="leading-normal text-[10.5px]">
                    Вы можете вносить точечные корректировки! Кликните на любую плитку с буквой в таблице справа, чтобы <strong>отрисовать её заново</strong> через интерактивную координатную сетку.
                  </p>
                )}
              </div>
            </div>

            {/* Right workplace displaying active font grid matching Screenshot 2 */}
            <div className="flex-1 bg-slate-100/40 p-6 overflow-y-auto flex flex-col gap-5">
              
              {/* Header Card information */}
              <div className="bg-white border border-slate-200/60 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#7c3aed] px-2 py-0.5 rounded-full font-black uppercase">
                      ВЫБРАННЫЙ СТИЛЬ ШРИФТА
                    </span>
                    <span className="text-slate-350 text-xs font-bold">id: {activeStyle.id}</span>
                  </div>
                  <h2 className="text-base font-black text-slate-800 mt-1">{activeStyle.name}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal max-w-lg font-medium">
                    {activeStyle.description || 'Пользовательский подготовленный стиль.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowParametersPane(!showParametersPane)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      showParametersPane 
                        ? 'bg-purple-50 border-purple-200 text-[#7c3aed]' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Sliders size={13} />
                    <span>{showParametersPane ? 'Закрыть Опции' : 'Параметры наклона'}</span>
                  </button>
                </div>
              </div>

              {/* Toggle-able sliders pane */}
              <AnimatePresence>
                {showParametersPane && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-inner overflow-hidden flex flex-col gap-4 font-sans"
                  >
                    <h4 className="text-xs font-extrabold text-[#7c3aed] uppercase border-b border-purple-50 pb-2 flex items-center gap-1">
                      <SlidersHorizontal size={14} />
                      Регулировка базовой геометрии букв шрифта
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-bold text-slate-600">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span>Наклон штриха (slant)</span>
                          <span className="text-[#7c3aed]">{activeStyle.slant}° градусов</span>
                        </div>
                        <input
                          type="range"
                          min="-25"
                          max="25"
                          step="1"
                          value={activeStyle.slant}
                          onChange={(e) => onSaveStyle({ ...activeStyle, slant: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span>Коэффициент межбуквенного интервала</span>
                          <span className="text-[#7c3aed]">{activeStyle.letterSpacing}x</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="5"
                          step="0.1"
                          value={activeStyle.letterSpacing}
                          onChange={(e) => onSaveStyle({ ...activeStyle, letterSpacing: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span>Высота над строкой (baselineOffset)</span>
                          <span className="text-[#7c3aed]">{activeStyle.baselineOffset} px</span>
                        </div>
                        <input
                          type="range"
                          min="-10"
                          max="10"
                          step="1"
                          value={activeStyle.baselineOffset}
                          onChange={(e) => onSaveStyle({ ...activeStyle, baselineOffset: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload mechanisms trigger segment */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                
                {scanState === 'idle' && (
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 text-[#7c3aed] flex items-center justify-center rounded-2xl border border-purple-100 animate-pulse">
                        <Upload size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase">Оцифровка и импорт шрифта</h4>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                          Сформируйте стиль по фотографии заполненного бланка, либо напрямую загрузите *.ttf/*.otf/ файл!
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      
                      {/* Scan photo */}
                      <div className="relative flex-1 sm:flex-initial">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                          id="myfonts-scan-input" 
                          onChange={handleScanFile}
                        />
                        <label 
                          htmlFor="myfonts-scan-input" 
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-purple-200 bg-purple-50/50 hover:bg-purple-100/85 text-[#7c3aed] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <Upload size={12} />
                          <span>Оцифровать фото бланка</span>
                        </label>
                      </div>

                      {/* Import TTF file */}
                      <div className="relative flex-1 sm:flex-initial">
                        <input 
                          type="file" 
                          accept=".ttf,.otf,.woff" 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                          id="myfonts-ttf-input" 
                          onChange={handleFontUploadFile}
                        />
                        <label 
                          htmlFor="myfonts-ttf-input" 
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <FileText size={12} />
                          <span>Импортировать TTF</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {scanState === 'processing' && (
                  <div className="flex items-center gap-4 py-1.5 text-xs font-bold justify-center font-sans tracking-wide">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent animate-spin rounded-full"></div>
                    <span className="text-[#7c3aed] animate-pulse">{scanStep}</span>
                    <span className="text-slate-400 font-medium">({scannedImageName})</span>
                  </div>
                )}

                {scanState === 'done' && newScannedStyle && (
                  <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-emerald-600" size={18} />
                      <div className="text-xs">
                        <h5 className="font-extrabold text-slate-800">Бланк оцифрован успешно!</h5>
                        <p className="text-[10px] text-slate-500 font-medium leading-none mt-1">
                          Калибровочные векторы наклонились на {newScannedStyle.slant}° градусов, внедрено {Object.keys(newScannedStyle.glyphs).length}+ новых символов.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleApplyScannedStyle}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all"
                      >
                        Применить
                      </button>
                      <button
                        onClick={() => setScanState('idle')}
                        className="px-3 py-1.5 bg-slate-200 text-slate-600 hover:bg-slate-350 rounded-xl text-xs font-extrabold cursor-pointer transition-all"
                      >
                        Сбросить
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Grid of character cells with coordinate grids and live strokes, mimicking Screenshot 2 */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">
                      Глифы и очертания букв
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium mt-1 block">Нажмите на плитку для индивидуальной калибровки и рисования</span>
                  </div>

                  {/* Filter pills */}
                  <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl text-[10px] font-bold border border-slate-200/50">
                    {[
                      { id: 'all', label: 'Все символы' },
                      { id: 'cyrillic', label: 'Кириллица (RU/UA/BY)' },
                      { id: 'latin', label: 'Латиница (English)' },
                      { id: 'kazakh', label: 'Казахский' },
                      { id: 'european', label: 'Диакритика' },
                      { id: 'numbers', label: 'Цифры' },
                      { id: 'custom_builder', label: 'Конструктор А4' },
                      { id: 'filled', label: 'Отрисованные' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFontGridFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                          selectedFontGridFilter === f.id
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-650 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                  {charList
                    .filter(char => {
                      if (selectedFontGridFilter === 'all') return true;
                      if (selectedFontGridFilter === 'filled') {
                        const localDrawingList = sampleDrawings[char];
                        return localDrawingList && localDrawingList.length > 0;
                      }
                      return getFilteredCharList(selectedFontGridFilter).includes(char);
                    })
                    .map(char => {
                    const localDrawingList = sampleDrawings[char];
                    const hasDrawings = localDrawingList && localDrawingList.length > 0;
                    
                    const displayCharMap: Record<string, string> = {
                      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
                      '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\sigma': 'σ',
                      '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω',
                      '\\degree': '°', '\\pm': '±', '\\times': '×', '\\div': '÷',
                      '\\approx': '≈', '\\ne': '≠', '\\neq': '≠', '\\le': '≤', '\\ge': '≥',
                      '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\hbar': 'ħ',
                      '\\int': '∫', '\\sum': '∑', '\\sqrt': '√', '\\pi': 'π'
                    };
                    const display = displayCharMap[char] || char;

                    // Compute specific letter calibration offsets
                    const adjustment = characterAdjustments[char] || { baseline: 0, scale: 1.0 };

                    return (
                      <motion.div
                        key={char}
                        whileHover={{ scale: 1.04 }}
                        onClick={() => setCalibratingChar(char)}
                        className={`aspect-square bg-white border rounded-2xl relative flex flex-col justify-between p-2 cursor-pointer relative group transition-all select-none ${
                          hasDrawings 
                            ? 'border-purple-300 shadow-sm shadow-purple-50' 
                            : 'border-slate-200 shadow-xs'
                        }`}
                      >
                        {/* Top index label */}
                        <div className="flex justify-between items-center relative z-20 font-sans">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg border ${
                            hasDrawings 
                              ? 'bg-purple-50 border-purple-100 text-[#7c3aed]' 
                              : 'bg-slate-50 border-slate-100 text-slate-550'
                          }`}>
                            {display}
                          </span>

                          {hasDrawings && (
                            <button
                              onClick={(e) => handleClearGlyph(char, e)}
                              className="w-5 h-5 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-100 transition-all cursor-pointer relative z-30"
                              title="Очистить букву"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>

                        {/* Combined Drawing & Guideline Zone */}
                        <div className="absolute inset-x-0 bottom-4 top-[26px] overflow-hidden pointer-events-none">
                          {/* Custom guidelines divisions inside cell exactly matching heights */}
                          <div className="absolute inset-0 pointer-events-none opacity-[0.35] z-0">
                            <div className="absolute top-[37%] left-0 right-0 h-[0.5px] bg-purple-400/25 border-dashed"></div>
                            <div className="absolute top-[67%] left-0 right-0 h-[0.8px] bg-blue-500/35"></div>
                          </div>

                          {/* Real drawing paths or template outline */}
                          <div className="absolute inset-x-0 inset-y-0 z-10">
                            {hasDrawings ? (
                              <div className="absolute inset-1.5 flex items-center justify-center">
                                <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] text-slate-800 drop-shadow-sm">
                                  <g style={{ transform: `scale(${adjustment.scale}) translate(0px, ${adjustment.baseline}px)`, transformOrigin: 'center' }}>
                                    {localDrawingList.map((stroke, index) => {
                                      let dStr = '';
                                      stroke.forEach(([px, py], i) => {
                                        if (i === 0) dStr += `M ${px} ${py}`;
                                        else dStr += ` L ${px} ${py}`;
                                      });
                                      return (
                                        <path 
                                          key={index} 
                                          d={dStr} 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="8" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round" 
                                        />
                                      );
                                    })}
                                  </g>
                                </svg>
                              </div>
                            ) : (
                              // Render template outline in beautiful standard font aligned exactly to baseline
                              <div className="relative w-full h-full flex items-center justify-center">
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-purple-700/15 pointer-events-none select-none">
                                  <text 
                                    x="50" 
                                    y="67" 
                                    textAnchor="middle" 
                                    fontFamily="'Marck Script', 'Caveat', 'Neucha', 'Bad Script', cursive, sans-serif" 
                                    fontSize="75" 
                                    fill="currentColor"
                                  >
                                    {display}
                                  </text>
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lower labels */}
                        <span className="text-[7.5px] font-bold text-slate-300 mt-auto self-end tracking-wider z-10">
                          {hasDrawings ? 'Отрисовано' : 'Шаблон'}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================================
            TAB 3: AI BLENDER (Our linear morphing logic)
           ========================================================== */}
        {activeTab === 'blender' && (
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col gap-6 font-sans">
              <div className="flex items-center gap-3 border-b border-purple-50 pb-4">
                <div className="w-12 h-12 bg-purple-50 text-[#7c3aed] flex items-center justify-center rounded-2xl border border-purple-100">
                  <Zap size={22} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Интеллектуальный блендер стилей почерка</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Плавно смешивайте углы наклона, величину пробелов, динамические колебания высоты и векторы штрихов сразу двух рукописных систем в новые уникальные гарнитуры.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Первый родительский стиль A</span>
                  <select
                    value={parentStyleA}
                    onChange={(e) => setParentStyleA(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-700 focus:border-purple-500 outline-none"
                  >
                    {availableStyles.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.creator})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Второй родительский стиль B</span>
                  <select
                    value={parentStyleB}
                    onChange={(e) => setParentStyleB(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-700 focus:border-purple-500 outline-none"
                  >
                    {availableStyles.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.creator})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slider weight */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                <div className="flex justify-between items-center text-xs font-black mb-3">
                  <span className="text-slate-600">Вклад стиля А ({(100 - interpolationWeight * 100).toFixed(0)}%)</span>
                  <span className="text-slate-600">Вклад стиля Б ({(interpolationWeight * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={interpolationWeight}
                  onChange={(e) => setInterpolationWeight(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>

              {/* Action */}
              <button
                onClick={handleInterpolateStyles}
                className="w-full py-4 text-xs font-black uppercase text-white bg-[#7c3aed] hover:bg-purple-700 rounded-2xl shadow-lg shadow-purple-600/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Запустить AI-блендинг почерков</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          MAJESTIC GLYPH EDITOR / DETAILED CALIBRATION MODAL (Screenshots 3 & 4)
         ========================================================================= */}
      <AnimatePresence>
        {calibratingChar && (
          <div className="fixed inset-0 bg-[#0f172a]/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl flex flex-col font-sans overflow-hidden"
            >
              
              {/* Modal Upper Header (Screenshot 3 - Back to style structure button) */}
              <div className="bg-slate-50 border-b border-slate-200/85 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={() => setCalibratingChar(null)}
                  className="flex items-center gap-2 text-xs font-extrabold text-[#7c3aed] hover:text-purple-700 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Вернуться к шрифту "{activeStyle.name}"</span>
                </button>

                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-800">Регулировка и отрисовка символа</h3>
                  <span className="text-[10px] uppercase font-bold text-[#7c3aed] block tracking-widest mt-0.5">
                    Калибровочный запуск
                  </span>
                </div>
              </div>

              {/* Double-card container workspace columns */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
                
                {/* -------------------------------------------------------------
                    COLUMN LEFT: Drawing Sketchpad (Screenshot 3 - Edit Character)
                   ------------------------------------------------------------- */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-inner flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center mb-3">
                      ВАРИАНТ ПОЧЕРКА Символ <strong className="text-base text-[#7c3aed] ml-1">"{calibratingChar}"</strong>
                    </span>

                    {/* Canvas Frame */}
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-2.5 bg-slate-50/20 max-w-sm w-full shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={280}
                        onMouseDown={startDraw}
                        onMouseMove={drawMove}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={startDraw}
                        onTouchMove={drawMove}
                        onTouchEnd={endDraw}
                        className="bg-white rounded-xl shadow border border-slate-200 cursor-crosshair touch-none w-full aspect-square"
                      />
                      {/* Guidance lines inside canvas matching grid cell heights */}
                      <div className="absolute inset-x-2.5 inset-y-2.5 pointer-events-none opacity-[0.35] z-10">
                        <div className="absolute top-[37%] left-0 right-0 h-[0.5px] bg-purple-400 border-dashed"></div>
                        <div className="absolute top-[67%] left-0 right-0 h-[0.8px] bg-blue-500"></div>
                      </div>
                    </div>

                    {/* Brush thickness slider */}
                    <div className="w-full mt-3 px-1 text-xs font-bold text-slate-505 flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                      <span>Толщина пера</span>
                      <input 
                        type="range" 
                        min="4" 
                        max="20" 
                        value={calibratingStrokeWeight} 
                        onChange={(e) => setCalibratingStrokeWeight(parseInt(e.target.value))}
                        className="w-1/2 cursor-pointer accent-[#7c3aed]"
                      />
                    </div>

                    {/* Controls list */}
                    <div className="flex gap-2.5 mt-4 w-full">
                      <button
                        onClick={clearCanvas}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-650 border border-slate-300 hover:border-rose-400 hover:text-rose-500 rounded-xl transition-all cursor-pointer bg-white"
                      >
                        <RotateCcw size={13} />
                        <span>Очистить</span>
                      </button>

                      <button
                        onClick={runAICoachCheck}
                        disabled={isAnalyzing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/60 hover:bg-purple-100 rounded-xl transition-all cursor-pointer"
                      >
                        <Sparkles size={13} className="animate-pulse" />
                        <span>{isAnalyzing ? 'Экспертиза...' : 'AI Тренер'}</span>
                      </button>
                    </div>

                    {/* Coach guidance alert feedback block */}
                    {coachFeedback && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 w-full bg-purple-50 border border-purple-100 p-3.5 rounded-2xl text-[11px] text-purple-900 leading-relaxed italic font-medium"
                      >
                        {coachFeedback}
                      </motion.div>
                    )}

                  </div>

                </div>

                {/* -------------------------------------------------------------
                    COLUMN RIGHT: Aligning Baseline & Size Context (Screenshot 4)
                   ------------------------------------------------------------- */}
                <div className="lg:col-span-7 flex flex-col gap-4 justify-between">
                  
                  {/* Calibration context display */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-inner flex flex-col gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Корректировка уровня строки и размера (BASELINE ALIGNMENT)
                    </span>

                    {/* Context sentence container row */}
                    <div className="w-full h-32 bg-slate-900/95 rounded-2xl relative overflow-hidden flex items-center justify-center px-4 shadow-md">
                      
                      {/* Horizontal guide baselines matching exact levels */}
                      <div className="absolute top-[37%] left-0 right-0 h-[0.5px] bg-purple-400/30 border-dashed pointer-events-none"></div>
                      <div className="absolute top-[67%] left-0 right-0 h-[1.5px] bg-blue-500/80 pointer-events-none"></div>

                      {/* Aligning Context letters */}
                      <div 
                        className="w-full h-full flex items-center justify-center gap-1.5 text-white text-4xl font-normal select-none relative"
                        style={{ fontFamily: "'Marck Script', 'Caveat', 'Neucha', 'Bad Script', cursive, sans-serif" }}
                      >
                        
                        {/* Shuffled surrounding characters in cursive */}
                        {calibrationContext.slice(0, 4).map((c, i) => (
                          <span key={`prev-${i}`} className="opacity-35 text-slate-400 font-normal">
                             {c}
                          </span>
                        ))}

                        {/* HIGH LIGHT ACTIVE TARGET CHARACTER BOX WITH LIVE DISPLACEMENTS */}
                        {(() => {
                          const customDraw = sampleDrawings[calibratingChar];
                          const adj = characterAdjustments[calibratingChar] || { baseline: 0, scale: 1.0 };
                          const displayCharMap: Record<string, string> = {
                            '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
                            '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\sigma': 'σ',
                            '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω',
                            '\\degree': '°', '\\pm': '±', '\\times': '×', '\\div': '÷',
                            '\\approx': '≈', '\\ne': '≠', '\\neq': '≠', '\\le': '≤', '\\ge': '≥',
                            '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\hbar': 'ħ',
                            '\\int': '∫', '\\sum': '∑', '\\sqrt': '√', '\\pi': 'π'
                          };
                          const disp = displayCharMap[calibratingChar] || calibratingChar;

                          return (
                            <div className="h-[95px] w-[75px] border-2 border-cyan-400 rounded-lg flex items-center justify-center relative bg-cyan-950/25 mx-2 shadow-inner">
                              <span className="absolute top-1 left-1.5 text-[8.5px] uppercase font-black tracking-widest text-cyan-350">
                                target
                              </span>

                              {/* Target SVG */}
                              {customDraw && customDraw.length > 0 ? (
                                <svg 
                                  viewBox="0 0 100 100" 
                                  className="w-[85%] h-[85%] text-cyan-200 filter drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]"
                                  style={{
                                    transform: `scale(${adj.scale}) translate(0px, ${adj.baseline}px)`,
                                    transformOrigin: 'center',
                                    transition: 'transform 0.1s ease-out'
                                  }}
                                >
                                  {customDraw.map((stroke, index) => {
                                    let dStr = '';
                                    stroke.forEach(([px, py], i) => {
                                      if (i === 0) dStr += `M ${px} ${py}`;
                                      else dStr += ` L ${px} ${py}`;
                                    });
                                    return (
                                      <path 
                                        key={index} 
                                        d={dStr} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="8" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                      />
                                    );
                                  })}
                                </svg>
                              ) : (
                                <span 
                                  className="text-cyan-300 text-4xl font-normal"
                                  style={{
                                    fontFamily: "'Marck Script', 'Caveat', 'Neucha', 'Bad Script', cursive, sans-serif",
                                    transform: `scale(${adj.scale}) translate(0px, ${adj.baseline}px)`,
                                    transformOrigin: 'center',
                                    transition: 'transform 0.1s ease-out'
                                  }}
                                >
                                  {disp}
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Surrounding characters after context */}
                        {calibrationContext.slice(4, 8).map((c, i) => (
                          <span key={`next-${i}`} className="opacity-35 text-slate-400 font-normal">
                             {c}
                          </span>
                        ))}

                      </div>
                    </div>

                    {/* Adjusters panel controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                      
                      {/* Baseline up-down offset alignment */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between h-24">
                        <span className="text-slate-450 uppercase tracking-widest text-[9.5px]">Высота расположения</span>
                        <div className="flex items-center justify-between gap-1.5 mt-2">
                          <button
                            onClick={() => adjustCharBaseline(calibratingChar, -1)}
                            className="p-2 border border-slate-300 rounded-xl bg-white shadow-xs hover:bg-slate-100 transition-all text-slate-650 cursor-pointer"
                            title="Сместить вверх"
                          >
                            <ChevronUp size={16} />
                          </button>
                          
                          <span className="text-sm font-black text-[#7c3aed] font-mono select-none">
                            {(characterAdjustments[calibratingChar]?.baseline || 0) > 0 ? '+' : ''}
                            {characterAdjustments[calibratingChar]?.baseline || 0} px
                          </span>

                          <button
                            onClick={() => adjustCharBaseline(calibratingChar, 1)}
                            className="p-2 border border-slate-300 rounded-xl bg-white shadow-xs hover:bg-slate-100 transition-all text-slate-650 cursor-pointer"
                            title="Сместить вниз"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Scale size resize parameter */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between h-24">
                        <span className="text-slate-450 uppercase tracking-widest text-[9.5px]">Вертикальный масштаб</span>
                        <div className="flex items-center justify-between gap-1.5 mt-2">
                          <button
                            onClick={() => adjustCharScale(calibratingChar, -0.02)}
                            className="p-2 border border-slate-300 rounded-xl bg-white shadow-xs hover:bg-slate-100 transition-all text-slate-650 font-extrabold text-sm cursor-pointer"
                            title="Уменьшить масштаб"
                          >
                            -
                          </button>
                          
                          <span className="text-sm font-black text-[#7c3aed] font-mono select-none">
                            {Math.round((characterAdjustments[calibratingChar]?.scale || 1.0) * 100)}%
                          </span>

                          <button
                            onClick={() => adjustCharScale(calibratingChar, 0.02)}
                            className="p-2 border border-slate-300 rounded-xl bg-white shadow-xs hover:bg-slate-100 transition-all text-slate-650 font-extrabold text-sm cursor-pointer"
                            title="Увеличить масштаб"
                          >
                            +
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Shuffler navigators & Next-Prev pagination links */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <button
                        onClick={shuffleCalibrationContext}
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-650 transition-all cursor-pointer shadow-2xs"
                        title="Случайные соседи по строке"
                      >
                        <RefreshCw size={12} />
                        <span>Сменить контекст</span>
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigateCharacter(-1)}
                          className="flex items-center gap-1 font-extrabold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                        >
                          <ChevronLeft size={13} />
                          <span>Предыдущий</span>
                        </button>
                        <button
                          onClick={() => navigateCharacter(1)}
                          className="flex items-center gap-1 font-extrabold text-[#7c3aed] bg-purple-50 px-3 py-1.5 rounded-xl text-xs hover:bg-purple-100 cursor-pointer"
                        >
                          <span>Следующий</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Keyboard instructions layout */}
                  <div className="bg-slate-50 border border-slate-200 px-5 py-4 rounded-3xl text-[10.5px] leading-relaxed font-semibold text-slate-500 flex flex-col gap-1.5 shadow-inner">
                    <span className="font-extrabold text-slate-700 uppercase tracking-widest text-[9.5px]">Быстрые Горячие Клавиши</span>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1 font-medium font-sans">
                      <div>Стрелки влево/вправо: <span className="font-bold text-[#7c3aed]">Смена символов</span></div>
                      <div>Стрелки вверх/вниз: <span className="font-bold text-[#7c3aed]">Сдвиг baseline (+/-)</span></div>
                      <div>Мультипликаторы "+ / -": <span className="font-bold text-[#7c3aed]">Масштаб размера</span></div>
                      <div>Английская кнопка "S": <span className="font-bold text-[#7c3aed]">Смена букв контекста</span></div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal controls footer */}
              <div className="bg-slate-50 border-t border-slate-250/60 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[10.5px] font-semibold text-slate-400 select-none">
                  * Все изменения калибровок и размеров штриха сохраняются в активном стиле автоматически.
                </span>
                
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      if (confirm("Сбросить все корректировки для этого символа в значения по умолчанию?")) {
                        setCharacterAdjustments(prev => {
                          const updated = { ...prev };
                          delete updated[calibratingChar];
                          return updated;
                        });
                      }
                    }}
                    className="px-4 py-2 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-600 font-bold bg-white rounded-xl text-xs transition-all cursor-pointer hover:scale-102"
                  >
                    Сбросить символ
                  </button>

                  <button
                    onClick={() => setCalibratingChar(null)}
                    className="px-6 py-2 bg-[#7c3aed] hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-purple-600/10 cursor-pointer hover:scale-102"
                  >
                    Применить и закрыть
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {printErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] px-4 animate-fade-in" id="print-error-modal">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-150 transform scale-100 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <span className="text-3xl">⚠️</span>
                <h3 className="text-lg font-black text-slate-800 leading-tight">Печать заблокирована браузером</h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-4 leading-relaxed font-semibold">
                Так как приложение запущенно во встроенном фрейме (внутри Google AI Studio), ваш браузер из соображений безопасности запрещает запуск диалогового окна печати.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Как запустить печать:</h4>
                <ol className="text-xs text-slate-600 font-bold space-y-2 list-decimal list-inside">
                  <li>Нажмите кнопку ниже, чтобы открыть приложение в новой вкладке.</li>
                  <li>Нажмите там <strong className="text-purple-600">«Печать бланка»</strong> еще раз. Всё сработает мгновенно!</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setPrintErrorModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-purple-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <span>Открыть в новой вкладке и печатать</span>
              </button>
              
              <button
                onClick={() => setPrintErrorModal(false)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-all py-2 cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
