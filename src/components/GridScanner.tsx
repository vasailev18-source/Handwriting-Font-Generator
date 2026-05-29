import React, { useState, useRef, useEffect } from 'react';
import { ALL_TEMPLATES } from '../utils/templates';
import { warpImage, getBinaryGrid, traceContours, createFontPaths, getGlyphAlignment } from '../utils/contourTracer';
import { Point, DeskewCorners, GlyphData, TemplateCell } from '../types';
import { 
  Upload, Sparkles, Sliders, Check, RotateCcw, 
  Search, Info, Eye, ClipboardCheck, Trash2, Edit2, Eraser, Move, Printer
} from 'lucide-react';

interface GridScannerProps {
  onGlyphsExtracted: (glyphs: GlyphData[]) => void;
  extractedGlyphsCount: number;
}

export default function GridScanner({ onGlyphsExtracted, extractedGlyphsCount }: GridScannerProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('cyrillic_8row_p1');
  const activeTemplate = ALL_TEMPLATES.find(t => t.id === selectedTemplateId) || ALL_TEMPLATES[0];

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [corners, setCorners] = useState<DeskewCorners>({
    topLeft: { x: 50, y: 50 },
    topRight: { x: 350, y: 50 },
    bottomRight: { x: 350, y: 550 },
    bottomLeft: { x: 50, y: 550 },
  });

  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeThreshold, setActiveThreshold] = useState(130);
  const [rdpEpsilon, setRdpEpsilon] = useState(1.0); // Smoothness

  // Crop & extracted state
  const [scannedGlyphs, setScannedGlyphs] = useState<GlyphData[]>([]);
  const [selectedGlyphIndex, setSelectedGlyphIndex] = useState<number | null>(null);
  const [retouchMode, setRetouchMode] = useState<'none' | 'draw' | 'erase'>('none');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const uploadedImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const retouchCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedCorner, setDraggedCorner] = useState<keyof DeskewCorners | null>(null);

  // Initialize initial corner points based on image bounds
  useEffect(() => {
    if (imageSrc && uploadedImgRef.current) {
      const img = uploadedImgRef.current;
      const setupCorners = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setImgDimensions({ width: w, height: h });
        
        // 8% margins
        const mx = Math.round(w * 0.08);
        const my = Math.round(h * 0.08);

        setCorners({
          topLeft: { x: mx, y: my },
          topRight: { x: w - mx, y: my },
          bottomRight: { x: w - mx, y: h - my },
          bottomLeft: { x: mx, y: h - my },
        });
      };

      if (img.complete) {
        setupCorners();
      } else {
        img.onload = setupCorners;
      }
    }
  }, [imageSrc]);

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Helper to load pdf.js in-browser from a reliable CDN on-demand
  const loadPdfJS = async (): Promise<any> => {
    if ((window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = (err) => reject(new Error('Не удалось загрузить PDF-рендерер из CDN'));
      document.head.appendChild(script);
    });
  };

  const loadPdfPage = async (pdf: any, pageNum: number) => {
    setIsProcessing(true);
    try {
      const page = await pdf.getPage(pageNum);
      
      // Use a resolution multiplier of 4.0 to ensure glyph lines stay clean and crisp (maximum possible resolution)
      const viewport = page.getViewport({ scale: 4.0 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Контекст рендеринга пуст');
      }

      await page.render({ canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      
      setImageSrc(dataUrl);
      setScannedGlyphs([]); // Reset
      setSelectedGlyphIndex(null);

      // Automatically swap active template page to match PDF workbook pages
      if (pageNum >= 1 && pageNum <= 5) {
        setSelectedTemplateId(`cyrillic_8row_p${pageNum}`);
      }
    } catch (err: any) {
      console.error('Error rendering PDF page:', err);
      alert(err.message || 'Ошибка рендеринга страницы PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = async (newPageNum: number) => {
    if (!pdfDoc || newPageNum < 1 || newPageNum > pdfNumPages) return;
    setPdfCurrentPage(newPageNum);
    await loadPdfPage(pdfDoc, newPageNum);
  };

  // Reset file state entirely
  const resetImageSrc = () => {
    setImageSrc(null);
    setPdfDoc(null);
    setPdfNumPages(0);
    setPdfCurrentPage(1);
    setScannedGlyphs([]);
    setSelectedGlyphIndex(null);
  };

  // Dry run file parsing depending on PDF / standard images
  const processUploadFile = async (file: File) => {
    if (file.type === 'application/pdf' || file.name.trim().toLowerCase().endsWith('.pdf')) {
      setIsProcessing(true);
      try {
        const pdfjsLib = await loadPdfJS();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (pdf.numPages === 0) {
          throw new Error('Файлы PDF пустые');
        }

        setPdfDoc(pdf);
        setPdfNumPages(pdf.numPages);
        setPdfCurrentPage(1);

        // Get first page of workbook
        await loadPdfPage(pdf, 1);
      } catch (err: any) {
        console.error('Error importing PDF:', err);
        alert(err.message || 'Ошибка оцифровки PDF. Попробуйте конвертировать файл в формат PNG/JPG и загрузить заново.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setScannedGlyphs([]); // Reset
          setSelectedGlyphIndex(null);
          setPdfDoc(null);
          setPdfNumPages(0);
          setPdfCurrentPage(1);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file uploads via input click
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadFile(file);
    }
  };

  // Handle file drag activities
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadFile(file);
    }
  };

  // Convert screen coordinates of cursor drag to natural image coordinates
  const handlePointerDown = (cornerKey: keyof DeskewCorners, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDraggedCorner(cornerKey);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedCorner || !containerRef.current || !uploadedImgRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Relative position in display box [0 to 1]
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    // Map to natural dimensions
    const rawX = Math.round(relX * imgDimensions.width);
    const rawY = Math.round(relY * imgDimensions.height);

    setCorners(prev => ({
      ...prev,
      [draggedCorner]: { x: rawX, y: rawY }
    }));
  };

  const handlePointerUp = () => {
    setDraggedCorner(null);
  };

  // Run the perspective deskew, slicing, and vector trace pipeline
  const processImagePipeline = async () => {
    if (!imageSrc || !uploadedImgRef.current) return;
    setIsProcessing(true);

    try {
      // 1. Create source offscreen canvas
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = imgDimensions.width;
      srcCanvas.height = imgDimensions.height;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) throw new Error('Could not create Canvas context');
      srcCtx.drawImage(uploadedImgRef.current, 0, 0);

      // 2. Warp image into normalized A4 coordinate space with ultra high 300 DPI resolution (2480 x 3508 px)
      const targetW = 2480;
      const targetH = 3508;
      const warpedCanvas = warpImage(srcCanvas, corners, targetW, targetH);

      const cellW = targetW / activeTemplate.cols;
      const cellH = targetH / activeTemplate.rows;

      const warpedCtx = warpedCanvas.getContext('2d');
      if (!warpedCtx) throw new Error('Could not get warped canvas context');

      // --- ДИНАМИЧЕСКАЯ АДАПТАЦИЯ СЕТКИ (ADAPTIVE GRID LINE DETECTION) ---
      // Поиск горизонтальных и вертикальных линий разметки по профилю вертикальной проекции.
      // Для исключения влияния рисунков букв мы берем тонкие полосы без символов 
      // (например, центр листа для горизонтальных линий, и горизонтальный центр для вертикальных).
      const detectedY: number[] = new Array(activeTemplate.rows + 1);
      detectedY[0] = 0;
      detectedY[activeTemplate.rows] = targetH;

      try {
        const stripW = 200;
        const stripXStart = Math.round((targetW - stripW) / 2);
        const stripDataY = warpedCtx.getImageData(stripXStart, 0, stripW, targetH);
        const pixelsY = stripDataY.data;

        for (let r = 1; r < activeTemplate.rows; r++) {
          const expectedY = r * cellH;
          // Окно локального поиска горизонтальной линии ±9% от высоты ячейки
          const searchRange = Math.round(cellH * 0.09);
          const yStart = Math.round(expectedY - searchRange);
          const yEnd = Math.round(expectedY + searchRange);

          let bestY = Math.round(expectedY);
          let minIntensity = Infinity;

          for (let y = yStart; y <= yEnd; y++) {
            if (y < 0 || y >= targetH) continue;
            let sumRef = 0;
            for (let sx = 0; sx < stripW; sx++) {
              const idx = (y * stripW + sx) * 4;
              const ref = 0.299 * pixelsY[idx] + 0.587 * pixelsY[idx + 1] + 0.114 * pixelsY[idx + 2];
              sumRef += ref;
            }
            if (sumRef < minIntensity) {
              minIntensity = sumRef;
              bestY = y;
            }
          }
          detectedY[r] = bestY;
        }
      } catch (e) {
        console.warn('Ошибка локального поиска строк. Откат к жесткой разметке.', e);
        for (let r = 1; r < activeTemplate.rows; r++) {
          detectedY[r] = r * cellH;
        }
      }

      const detectedX: number[] = new Array(activeTemplate.cols + 1);
      detectedX[0] = 0;
      detectedX[activeTemplate.cols] = targetW;

      try {
        const stripH = 200;
        const stripYStart = Math.round((targetH - stripH) / 2);
        const stripDataX = warpedCtx.getImageData(0, stripYStart, targetW, stripH);
        const pixelsX = stripDataX.data;

        for (let c = 1; c < activeTemplate.cols; c++) {
          const expectedX = c * cellW;
          // Окно локального поиска вертикальной линии ±9% от ширины ячейки
          const searchRange = Math.round(cellW * 0.09);
          const xStart = Math.round(expectedX - searchRange);
          const xEnd = Math.round(expectedX + searchRange);

          let bestX = Math.round(expectedX);
          let minIntensity = Infinity;

          for (let x = xStart; x <= xEnd; x++) {
            if (x < 0 || x >= targetW) continue;
            let sumRef = 0;
            for (let sy = 0; sy < stripH; sy++) {
              const idx = (sy * targetW + x) * 4;
              const ref = 0.299 * pixelsX[idx] + 0.587 * pixelsX[idx + 1] + 0.114 * pixelsX[idx + 2];
              sumRef += ref;
            }
            if (sumRef < minIntensity) {
              minIntensity = sumRef;
              bestX = x;
            }
          }
          detectedX[c] = bestX;
        }
      } catch (e) {
        console.warn('Ошибка локального поиска колонок. Откат к жесткой разметке.', e);
        for (let c = 1; c < activeTemplate.cols; c++) {
          detectedX[c] = c * cellW;
        }
      }

      // Стираем фактические физические линии сетки поверх деформированного холста белым цветом
      warpedCtx.strokeStyle = 'white';
      
      // Стирание вертикальных разделителей
      for (let c = 0; c <= activeTemplate.cols; c++) {
        const x = detectedX[c];
        warpedCtx.lineWidth = Math.max(5, Math.round(cellW * 0.025));
        warpedCtx.beginPath();
        warpedCtx.moveTo(x, 0);
        warpedCtx.lineTo(x, targetH);
        warpedCtx.stroke();
      }

      // Стирание горизонтальных разделителей (предотвращает кумулятивное смещение на нижних строках)
      for (let r = 0; r <= activeTemplate.rows; r++) {
        const y = detectedY[r];
        warpedCtx.lineWidth = Math.max(5, Math.round(cellH * 0.025));
        warpedCtx.beginPath();
        warpedCtx.moveTo(0, y);
        warpedCtx.lineTo(targetW, y);
        warpedCtx.stroke();
      }

      // 3. Нарезка ячеек шаблона по динамически определенным координатам
      const extractedGlyphs: GlyphData[] = [];

      // Offscreen холст для обработки отдельного символа (блок высокого разрешения 2048x2048)
      const cellCanvas = document.createElement('canvas');
      cellCanvas.width = 2048;
      cellCanvas.height = 2048;
      const cellCtx = cellCanvas.getContext('2d');

      if (!cellCtx) throw new Error('Cell rendering canvas failed');

      for (const cell of activeTemplate.cells) {
        if (cell.isLogo) continue; // Пропуск логотипов

        // Использование динамических скорректированных ребер ячейки
        const srcX = detectedX[cell.col];
        const srcY = detectedY[cell.row];
        const srcW_crop = detectedX[cell.col + 1] - srcX;
        const srcH_crop = detectedY[cell.row + 1] - srcY;

        // Нормализация и центрирование пропорций в пространстве ячейки
        const maxInnerSize = 1960;
        const scale = Math.min(maxInnerSize / srcW_crop, maxInnerSize / srcH_crop);
        const destW = srcW_crop * scale;
        const destH = srcH_crop * scale;
        const destX = (2048 - destW) / 2;
        const destY = (2048 - destH) / 2;

        cellCtx.fillStyle = 'white';
        cellCtx.fillRect(0, 0, 2048, 2048);
        cellCtx.drawImage(
          warpedCanvas,
          srcX,
          srcY,
          srcW_crop,
          srcH_crop,
          destX,
          destY,
          destW,
          destH
        );

        // Clean up any stray outer layout elements and the top-left template label
        cellCtx.fillStyle = 'white';
        
        // 1. Wipe out any leaked grid margins touching the absolute outer 2048x2048 canvas edges (very safe 40px sweep)
        const edgeClear = 40;
        cellCtx.fillRect(0, 0, 2048, edgeClear);                      // Top canvas edge
        cellCtx.fillRect(0, 2048 - edgeClear, 2048, edgeClear);        // Bottom canvas edge
        cellCtx.fillRect(0, 0, edgeClear, 2048);                      // Left canvas edge
        cellCtx.fillRect(2048 - edgeClear, 0, edgeClear, 2048);        // Right canvas edge

        // 2. Erase the top-left printed reference digit/letter label (e.g. "А", "Б", "восклицание" etc.)
        // Highly adaptive based on the label string length to completely eliminate any printed label remnants!
        const labelLength = cell.label ? cell.label.length : 1;
        const labelW = Math.round(destW * (0.15 + Math.min(8, labelLength) * 0.06));
        const labelH = Math.round(destH * 0.17);
        cellCtx.fillRect(destX, destY, labelW, labelH);

        // 3. Clear any physical deskew line remnants utilizing an extremely conservative safety zone (1%)
        // This completely swallows black grid borders while keeping wide handwritten letters perfectly intact and centered!
        const borderW = Math.max(1, Math.round(destW * 0.01));
        const borderH = Math.max(1, Math.round(destH * 0.01));
        
        // Left border of the cropped cell
        cellCtx.fillRect(destX, destY, borderW, destH);
        // Right border of the cropped cell
        cellCtx.fillRect(destX + destW - borderW, destY, borderW, destH);
        // Top border of the cropped cell
        cellCtx.fillRect(destX, destY, destW, borderH);
        // Bottom border of the cropped cell
        cellCtx.fillRect(destX, destY + destH - borderH, destW, borderH);

        // Convert cropped cell to binary grid (black-and-white)
        const binary = getBinaryGrid(cellCanvas, activeThreshold, true);
        
        // Trace boundaries/contours
        const contours = traceContours(binary.data, binary.width, binary.height);
        
        // Convert to font units paths (passing destX, destY, destW, destH for smart contour filtering)
        const fontPaths = createFontPaths(contours, binary.width, binary.height, cell.char, destX, destY, destW, destH);

        extractedGlyphs.push({
          char: cell.char,
          paths: fontPaths.paths,
          width: fontPaths.advanceWidth
        });
      }

      setScannedGlyphs(extractedGlyphs);
      setSelectedGlyphIndex(extractedGlyphs.length > 0 ? 0 : null);
    } catch (err) {
      console.error(err);
      alert('Ошибка при заполнении бланка. Убедитесь, что все маркеры выбраны правильно.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save the extracted glyphs to the global font registry
  const handleSaveToFont = () => {
    onGlyphsExtracted(scannedGlyphs);
    
    // Celebration
    const sound = new Audio();
    // we can also throw a brief status
  };

  // Retouch canvas drawing/erasing handlers
  const handleRetouchStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (retouchMode === 'none' || selectedGlyphIndex === null) return;
    const canvas = retouchCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x * scaleX, y * scaleY);
    ctx.lineWidth = retouchMode === 'draw' ? Math.round(canvas.width * 0.045) : Math.round(canvas.width * 0.09);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = retouchMode === 'draw' ? '#0f172a' : '#ffffff';

    const handleMove = (me: MouseEvent | TouchEvent) => {
      const mx = 'touches' in me ? me.touches[0].clientX - rect.left : me.clientX - rect.left;
      const my = 'touches' in me ? me.touches[0].clientY - rect.top : me.clientY - rect.top;
      ctx.lineTo(mx * scaleX, my * scaleY);
      ctx.stroke();
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      
      // Re-run trace on refined canvas
      retraceSelectedGlyph();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
  };

  const retraceSelectedGlyph = () => {
    if (selectedGlyphIndex === null || !retouchCanvasRef.current) return;
    const canvas = retouchCanvasRef.current;
    const glyph = scannedGlyphs[selectedGlyphIndex];

    const binary = getBinaryGrid(canvas, activeThreshold); // Dynamic threshold
    const contours = traceContours(binary.data, binary.width, binary.height);
    const fontPaths = createFontPaths(contours, binary.width, binary.height, glyph.char);

    setScannedGlyphs(prev => {
      const copy = [...prev];
      copy[selectedGlyphIndex] = {
        ...copy[selectedGlyphIndex],
        paths: fontPaths.paths,
        width: fontPaths.advanceWidth
      };
      return copy;
    });
  };

  // Sync retouch canvas when glyph index changes
  useEffect(() => {
    if (selectedGlyphIndex !== null && scannedGlyphs[selectedGlyphIndex]) {
      const glyph = scannedGlyphs[selectedGlyphIndex];
      const canvas = retouchCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw active glyph onto canvas as black ink on white background for retouching
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Re-project SVG paths onto canvas viewport nicely centered
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      const W = canvas.width;
      const retouchBaselineY = W * 0.75; // Exactly 75% of the canvas height (avoids descender clipping)
      const FONT_HEIGHT_UNITS = 13500;
      const verticalScale = retouchBaselineY / FONT_HEIGHT_UNITS;

      for (const contour of glyph.paths) {
        let first = true;
        const leftMargin = (W - glyph.width * verticalScale) / 2;
        for (const pt of contour) {
          // Inverse transform using mathematically correct uniform scaling with original proportions
          const cx = leftMargin + pt.x! * verticalScale;

          // Y:
          const cy = retouchBaselineY - pt.y! * verticalScale;

          if (first || pt.type === 'M') {
            ctx.moveTo(cx, cy);
            first = false;
          } else if (pt.type === 'L') {
            ctx.lineTo(cx, cy);
          } else if (pt.type === 'Q') {
            const cx1 = leftMargin + pt.x1! * verticalScale;
            const cy1 = retouchBaselineY - pt.y1! * verticalScale;
            ctx.quadraticCurveTo(cx1, cy1, cx, cy);
          } else if (pt.type === 'Z') {
            ctx.closePath();
          }
        }
      }
      ctx.fill();
    }
  }, [selectedGlyphIndex]);

  // Display dragging metrics mapping inside relative screen coordinates
  const getDisplayCoords = (pt: Point) => {
    if (imgDimensions.width === 0) return { x: 0, y: 0 };
    return {
      x: (pt.x / imgDimensions.width) * 100,
      y: (pt.y / imgDimensions.height) * 100
    };
  };

  const activeGlyph = selectedGlyphIndex !== null ? scannedGlyphs[selectedGlyphIndex] : null;

  return (
    <div className="space-y-8">
      {/* 1. UPLOADER OR RECTIFIER VIEW */}
      {!imageSrc ? (
        <label 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group flex flex-col items-center justify-center border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 shadow-sm ${
            isDraggingFile 
              ? 'border-emerald-500 bg-emerald-50/40 scale-[1.01]' 
              : 'border-slate-200 hover:border-emerald-400 bg-white hover:bg-slate-50/50'
          }`}
        >
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
          <div className={`p-4 rounded-2xl mb-4 transition-all duration-300 ${
            isDraggingFile 
              ? 'bg-emerald-100 text-emerald-600 scale-110' 
              : 'bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600'
          }`}>
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-slate-800 mb-1">
            {isDraggingFile ? 'Отпустите файл здесь!' : 'Загрузите фотографию бланка или PDF'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
            Поддерживаются форматы <strong>JPG, PNG, WEBP</strong>, а также многостраничные или одностраничные документы <strong>PDF</strong>. Убедитесь, что все 4 угловых маркера полностью видны на снимке.
          </p>
          <span className="bg-slate-800 group-hover:bg-emerald-600 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-sm">
            Выбрать файл
          </span>
        </label>
      ) : scannedGlyphs.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                Шаг 2: Настройка сетки
              </span>
              <h3 className="text-lg font-bold text-slate-800">Совместите маркеры углов</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Перетяните 4 круглых маркера на центры чёрных угловых квадратов, расположенных на вашем листе.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {pdfNumPages > 1 && (
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <button
                    type="button"
                    disabled={pdfCurrentPage <= 1 || isProcessing}
                    onClick={() => handlePageChange(pdfCurrentPage - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 disabled:opacity-40 rounded-lg shadow-sm transition-all text-xs font-bold font-mono cursor-pointer disabled:cursor-not-allowed"
                    title="Предыдущая страница PDF"
                  >
                    ←
                  </button>
                  <span className="text-xs font-bold text-slate-700 select-none px-1">
                    Стр. {pdfCurrentPage} из {pdfNumPages}
                  </span>
                  <button
                    type="button"
                    disabled={pdfCurrentPage >= pdfNumPages || isProcessing}
                    onClick={() => handlePageChange(pdfCurrentPage + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 disabled:opacity-40 rounded-lg shadow-sm transition-all text-xs font-bold font-mono cursor-pointer disabled:cursor-not-allowed"
                    title="Следующая страница PDF"
                  >
                    →
                  </button>
                </div>
              )}

              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none animate-in fade-in"
              >
                {ALL_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <button
                onClick={resetImageSrc}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 text-xs font-semibold cursor-pointer transition-colors"
              >
                Снять бланк
              </button>
            </div>
          </div>

          {/* Draggable Alignment Canvas Window */}
          <div 
            ref={containerRef}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="relative rounded-2xl overflow-hidden border border-slate-200 cursor-crosshair bg-slate-900 select-none flex items-center justify-center"
            style={{ touchAction: 'none' }}
          >
            <img 
              ref={uploadedImgRef}
              src={imageSrc} 
              alt="Uploaded scan" 
              className="max-h-[600px] object-contain pointer-events-none"
              onLoad={() => {}}
            />

            {/* Draggable Handles and Alignment Polygon */}
            {imgDimensions.width > 0 && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Outer rect shade overlay */}
                  <polygon 
                    points={`
                      ${getDisplayCoords(corners.topLeft).x},${getDisplayCoords(corners.topLeft).y} 
                      ${getDisplayCoords(corners.topRight).x},${getDisplayCoords(corners.topRight).y} 
                      ${getDisplayCoords(corners.bottomRight).x},${getDisplayCoords(corners.bottomRight).y} 
                      ${getDisplayCoords(corners.bottomLeft).x},${getDisplayCoords(corners.bottomLeft).y}
                    `}
                    fill="rgba(16, 185, 129, 0.08)"
                    stroke="#10b981"
                    strokeWidth="0.4"
                    strokeDasharray="1.5, 1.5"
                  />
                </svg>

                {/* Corner Draggable Knobs */}
                {(Object.keys(corners) as Array<keyof DeskewCorners>).map((cornerKey) => {
                  const pt = corners[cornerKey];
                  const dPos = getDisplayCoords(pt);
                  return (
                    <div
                      key={cornerKey}
                      onMouseDown={(e) => handlePointerDown(cornerKey, e)}
                      onTouchStart={(e) => handlePointerDown(cornerKey, e)}
                      className={`absolute w-8 h-8 -ml-4 -mt-4 bg-emerald-500 text-white rounded-full border-3 border-white shadow-xl flex items-center justify-center cursor-move transition-all active:scale-125 select-none z-20 ${
                        draggedCorner === cornerKey ? 'ring-4 ring-emerald-500/30' : ''
                      }`}
                      style={{ left: `${dPos.x}%`, top: `${dPos.y}%` }}
                    >
                      <Move className="w-3.5 h-3.5" />
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {/* Filter controls */}
            <div className="flex items-center gap-6 w-full sm:w-auto">
              <div className="space-y-1 flex-1 sm:flex-none">
                <label className="text-xs font-semibold text-slate-500 flex items-center justify-between gap-1">
                  <span>Порог яркости:</span>
                  <span className="text-emerald-600 font-bold font-mono">{activeThreshold}</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="210"
                  value={activeThreshold}
                  onChange={(e) => setActiveThreshold(Number(e.target.value))}
                  className="w-full sm:w-48 accent-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={processImagePipeline}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isProcessing ? 'Распознавание...' : 'Оцифровать и извлечь сетку'}
            </button>
          </div>
        </div>
      ) : (
        /* 2. RESULTS INSPECTION SIDE DYNAMIC GRID */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
          
          {/* Output characters catalog column (2 cols span on desktop) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Распознанные символы</h3>
                <p className="text-xs text-slate-400">Нажмите на любой символ для ретуши и ручной корректировки контура.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPrintPreviewOpen(true)}
                  className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Распечатать распознанные символы"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Распечатать символы
                </button>
                <button
                  onClick={() => setScannedGlyphs([])}
                  className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Перезагрузить лист
                </button>
                <button
                  onClick={handleSaveToFont}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Сохранить в реестр
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto pr-2">
              {scannedGlyphs.map((g, idx) => {
                const hasPaths = g.paths.length > 0;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedGlyphIndex(idx);
                      setRetouchMode('none');
                    }}
                    title={`Символ: ${g.char}${!hasPaths ? ' (Пусто)' : ''}`}
                    className={`aspect-square border rounded-2xl flex items-center justify-center transition-all p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white hover:bg-slate-50 relative ${
                      selectedGlyphIndex === idx
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500'
                        : hasPaths 
                          ? 'border-slate-200 shadow-sm' 
                          : 'border-dashed border-slate-200 bg-slate-50/20 opacity-40'
                    }`}
                  >
                    {hasPaths ? (
                      <svg className="w-12 h-12 text-slate-800" viewBox={`0 -10000 ${g.width || 12000} 14000`}>
                        <g transform="scale(1, -1)">
                          <path
                            d={g.paths.map((pts) => pts.map((pt, i) => {
                              if (pt.type === 'M' || i === 0) return `M ${pt.x} ${pt.y}`;
                              if (pt.type === 'L') return `L ${pt.x} ${pt.y}`;
                              if (pt.type === 'Q') return `Q ${pt.x1} ${pt.y1} ${pt.x} ${pt.y}`;
                              if (pt.type === 'Z') return 'Z';
                              return '';
                            }).join(' ')).join(' ')}
                            fill="currentColor"
                            fillRule="evenodd"
                          />
                        </g>
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* EDITING / RETOUCH DRAWER COLUMN */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between gap-6">
            {activeGlyph ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs font-mono">
                      Активный символ: {activeGlyph.char}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Ширина: {activeGlyph.width} em</span>
                  </div>

                  {/* Refinement Canvas Area */}
                  <div className="aspect-square bg-slate-50 rounded-2xl relative border border-slate-200 overflow-hidden flex items-center justify-center">
                    <canvas
                      ref={retouchCanvasRef}
                      width={4096}
                      height={4096}
                      onMouseDown={handleRetouchStart}
                      onTouchStart={handleRetouchStart}
                      className={`w-64 h-64 bg-white shadow-inner rounded-xl ${
                        retouchMode !== 'none' ? 'cursor-pencil' : ''
                      }`}
                    />

                    {/* Guidelines overlays */}
                    <div className="absolute inset-0 w-64 h-64 mx-auto pointer-events-none border border-slate-200 rounded-xl">
                      {/* Baseline */}
                      <div className="absolute top-[75%] left-0 w-full border-t border-dashed border-red-300/60 flex items-center justify-end px-1.5">
                        <span className="text-[7px] text-red-400 font-mono select-none">Base</span>
                      </div>
                      {/* lowercase height */}
                      {getGlyphAlignment(activeGlyph.char).type === 'standard' && (
                        <div className="absolute top-[40.5%] left-0 w-full border-t border-dashed border-blue-300/40"></div>
                      )}
                      {/* tall height */}
                      {getGlyphAlignment(activeGlyph.char).type === 'tall' && (
                        <div className="absolute top-[24%] left-0 w-full border-t border-dashed border-blue-300/40"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drawing/Erasing Retouch Tools bar */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 grid grid-cols-3">
                    <button
                      onClick={() => setRetouchMode(retouchMode === 'draw' ? 'none' : 'draw')}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                        retouchMode === 'draw' 
                          ? 'bg-slate-800 text-white border-transparent' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Перо
                    </button>
                    
                    <button
                      onClick={() => setRetouchMode(retouchMode === 'erase' ? 'none' : 'erase')}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                        retouchMode === 'erase' 
                          ? 'bg-slate-800 text-white border-transparent' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      Ластик
                    </button>

                    <button
                      onClick={() => {
                        setScannedGlyphs(prev => {
                          const copy = [...prev];
                          if (selectedGlyphIndex !== null) {
                            copy[selectedGlyphIndex].paths = [];
                            copy[selectedGlyphIndex].width = 300;
                          }
                          return copy;
                        });
                        setRetouchMode('none');
                      }}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Сброс
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-[10px] space-y-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                      Инструкция ретуши:
                    </span>
                    <p className="text-slate-500 leading-relaxed">
                      Выберите <strong>«Перо»</strong> или <strong>«Ластик»</strong> и рисуйте курсором прямо в окне выше, чтобы сгладить зазубрины или стереть пыль от сканирования бумаги. Контур переоцифруется автоматически.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <ClipboardCheck className="w-12 h-12 mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Выберите символ</p>
                <p className="text-xs max-w-[200px]">Выберите символ на основном поле слева, чтобы начать тонкую настройку.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. DESIGNED PRINT PREVIEW & FALLBACK MODAL */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 z-50 print:hidden overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-4xl shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-lg">Печать оцифрованных символов</h3>
                  <p className="text-xs text-slate-400">Распишите или сохраните PDF со всеми распознанными буквами</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsPrintPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-xs font-bold"
              >
                Закрыть
              </button>
            </div>

            {/* Browser Iframe Sandbox Warning & Instructions */}
            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 md:p-5 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold mb-1 text-amber-950">
                <span className="text-sm">⚠️</span>
                <span>Обратите внимание на вызов окна печати у браузера!</span>
              </div>
              <p className="leading-relaxed">
                Поскольку данное приложение запущено внутри интерактивной песочницы (iframe), браузеры по умолчанию могут временно отклонить или заблокировать вызов окна печати при клике на кнопку.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-white/60 p-3 rounded-xl border border-amber-200/40">
                  <span className="font-semibold block mb-0.5 text-amber-950">Вариант 1 (Рекомендуемый):</span>
                  Откройте это веб-приложение в новой вкладке через кнопку-стрелку <strong className="text-emerald-700">«Open in new tab»</strong> в правом верхнем углу экрана AI Studio, и затем нажмите кнопку печати.
                </div>
                <div className="bg-white/60 p-3 rounded-xl border border-amber-200/40">
                  <span className="font-semibold block mb-0.5 text-amber-950">Вариант 2:</span>
                  Просто нажмите горячую комбинацию клавиш на клавиатуре <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded">Ctrl + P</strong> (Windows / Linux) или <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded">Cmd + P</strong> (macOS).
                </div>
              </div>
            </div>

            {/* Action deck */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  try {
                    window.focus();
                    window.print();
                  } catch (e) {
                    console.error('Print trigger failed', e);
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-xs"
              >
                <Printer className="w-4 h-4" />
                Запустить системную печать
              </button>

              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950 text-white font-semibold px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-xs text-center"
              >
                Открыть в новом окне ↗
              </a>

              <button
                onClick={() => setIsPrintPreviewOpen(false)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl cursor-pointer transition-all text-xs"
              >
                Вернуться к списку
              </button>
            </div>

            {/* Visual preview list on-screen */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Предварительный просмотр сетки ({activeTemplate.name}):</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto p-1 bg-white rounded-xl border border-slate-200/60">
                {scannedGlyphs.map((g, idx) => {
                  const hasPaths = g.paths.length > 0;
                  return (
                    <div 
                      key={idx} 
                      title={`Символ: ${g.char}${!hasPaths ? ' (Пусто)' : ''}`}
                      className="border border-slate-200 rounded-xl flex items-center justify-center aspect-square bg-slate-50/10 p-2 relative"
                    >
                      {hasPaths ? (
                        <svg className="w-12 h-12 text-slate-800" viewBox={`0 -10000 ${g.width || 12000} 14000`}>
                          <g transform="scale(1, -1)">
                            <path
                              d={g.paths.map((pts) => pts.map((pt, i) => {
                                if (pt.type === 'M' || i === 0) return `M ${pt.x} ${pt.y}`;
                                if (pt.type === 'L') return `L ${pt.x} ${pt.y}`;
                                if (pt.type === 'Q') return `Q ${pt.x1} ${pt.y1} ${pt.x} ${pt.y}`;
                                if (pt.type === 'Z') return 'Z';
                                return '';
                              }).join(' ')).join(' ')}
                              fill="currentColor"
                              fillRule="evenodd"
                            />
                          </g>
                        </svg>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. PRINT-ONLY BEAUTIFIED CATALOG FILE */}
      {scannedGlyphs.length > 0 && (
        <div className="hidden print:block print:p-8 bg-white min-h-screen text-slate-950 font-sans" id="print-content">
          <div className="border-b-2 border-slate-900 pb-4 mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-1">Каталог распознанных символов</h1>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Шаблон: {activeTemplate.name} • Оцифровано {scannedGlyphs.filter(g => g.paths.length > 0).length} из {scannedGlyphs.length} символов
            </p>
          </div>

          <div className="grid grid-cols-6 gap-6">
            {scannedGlyphs.map((g, idx) => {
              const hasPaths = g.paths.length > 0;
              return (
                <div
                  key={idx}
                  title={`Символ: ${g.char}${!hasPaths ? ' (Пусто)' : ''}`}
                  className="border-2 border-slate-200 rounded-2xl flex items-center justify-center aspect-square bg-slate-50/10 p-4 break-inside-avoid relative"
                >
                  {hasPaths ? (
                    <svg className="w-20 h-20 text-slate-900" viewBox={`0 -10000 ${g.width || 12000} 14000`}>
                      <g transform="scale(1, -1)">
                        <path
                          d={g.paths.map((pts) => pts.map((pt, i) => {
                            if (pt.type === 'M' || i === 0) return `M ${pt.x} ${pt.y}`;
                            if (pt.type === 'L') return `L ${pt.x} ${pt.y}`;
                            if (pt.type === 'Q') return `Q ${pt.x1} ${pt.y1} ${pt.x} ${pt.y}`;
                            if (pt.type === 'Z') return 'Z';
                            return '';
                          }).join(' ')).join(' ')}
                          fill="currentColor"
                          fillRule="evenodd"
                        />
                      </g>
                    </svg>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-16 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 font-medium">
            Сгенерировано в приложении Handwriting Font Generator • Все права защищены • {new Date().toLocaleDateString('ru-RU')}
          </div>
        </div>
      )}
    </div>
  );
}
