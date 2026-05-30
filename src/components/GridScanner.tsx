import React, { useState, useRef, useEffect } from 'react';
import { ALL_TEMPLATES } from '../utils/templates';
import { warpImage, getBinaryGrid, traceContours, createFontPaths, getGlyphAlignment } from '../utils/contourTracer';
import { Point, DeskewCorners, GlyphData, TemplateCell } from '../types';
import { 
  Upload, Sparkles, Sliders, Check, RotateCcw, 
  Search, Info, Eye, ClipboardCheck, Trash2, Edit2, Eraser, Move, Printer, FileText
} from 'lucide-react';

interface GridScannerProps {
  onGlyphsExtracted: (glyphs: GlyphData[]) => void;
  extractedGlyphsCount: number;
}

export default function GridScanner({ onGlyphsExtracted, extractedGlyphsCount }: GridScannerProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('cyrillic_8row_p1');
  const [isForensicOpen, setIsForensicOpen] = useState(false);
  const [selectedForensicChar, setSelectedForensicChar] = useState<string | null>(null);
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
  const [isSaved, setIsSaved] = useState(false);

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
      setIsSaved(false);

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
    setIsSaved(false);
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

  // Generate all 9 high-fidelity interactive PNG diagnostics for visual forensic debugging
  const generateAllNineDiagnostics = (
    cell: TemplateCell, 
    srcCanvas: HTMLCanvasElement, 
    corners: DeskewCorners, 
    warpedCanvas: HTMLCanvasElement, 
    srcX: number, srcY: number, srcW_crop: number, srcH_crop: number,
    cellCanvas: HTMLCanvasElement,
    labelW: number, labelH: number, destX: number, destY: number, destW: number, destH: number,
    labelInkBefore: number, labelInkAfter: number,
    binary: { width: number; height: number; data: boolean[][] },
    rawContours: Point[][],
    filteredContours: Point[][],
    finalFontPaths: any[][],
    advanceWidth: number
  ) => {
    try {
      const u1 = cell.col / activeTemplate.cols;
      const u2 = (cell.col + 1) / activeTemplate.cols;
      const v1 = cell.row / activeTemplate.rows;
      const v2 = (cell.row + 1) / activeTemplate.rows;

      const lerp = (p1: Point, p2: Point, t: number) => ({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
      });
      const bilinear = (tl: Point, tr: Point, br: Point, bl: Point, u: number, v: number) => {
        const top = lerp(tl, tr, u);
        const bottom = lerp(bl, br, u);
        return lerp(top, bottom, v);
      };

      const cTL = bilinear(corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft, u1, v1);
      const cTR = bilinear(corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft, u2, v1);
      const cBR = bilinear(corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft, u2, v2);
      const cBL = bilinear(corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft, u1, v2);

      const minX = Math.round(Math.min(cTL.x, cTR.x, cBR.x, cBL.x));
      const maxX = Math.round(Math.max(cTL.x, cTR.x, cBR.x, cBL.x));
      const minY = Math.round(Math.min(cTL.y, cTR.y, cBR.y, cBL.y));
      const maxY = Math.round(Math.max(cTL.y, cTR.y, cBR.y, cBL.y));
      const cropW = Math.max(1, maxX - minX);
      const cropH = Math.max(1, maxY - minY);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 256;
      tempCanvas.height = 256;
      const tempCtx = tempCanvas.getContext('2d')!;

      // 01_original.png
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, 256, 256);
      const img_01 = tempCanvas.toDataURL('image/png');

      // 02_after_warp.png
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.drawImage(warpedCanvas, srcX, srcY, srcW_crop, srcH_crop, 0, 0, 256, 256);
      const img_02 = tempCanvas.toDataURL('image/png');

      // 03_after_label_removal.png
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.drawImage(cellCanvas, 0, 0, 2048, 2048, 0, 0, 256, 256);
      const img_03 = tempCanvas.toDataURL('image/png');

      // 04_binary.png
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.fillStyle = '#0f172a';
      const stepX = binary.width / 256;
      const stepY = binary.height / 256;
      for (let y = 0; y < 256; y++) {
        const binaryY = Math.floor(y * stepY);
        if (binaryY >= binary.height) continue;
        for (let x = 0; x < 256; x++) {
          const binaryX = Math.floor(x * stepX);
          if (binaryX >= binary.width) continue;
          if (binary.data[binaryY][binaryX]) {
            tempCtx.fillRect(x, y, 1.2, 1.2);
          }
        }
      }
      const img_04 = tempCanvas.toDataURL('image/png');

      // 05_connected_components.png
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, 256, 256);
      const ft = (window as any).__forensic_trace;
      const labels = ft && ft.lastCcLabels;
      if (labels && labels.length > 0) {
        const getLabelColor = (labelVal: number) => {
          if (labelVal === 0) return 'rgba(255, 255, 255, 1)';
          const hue = (labelVal * 113) % 360;
          return `hsla(${hue}, 85%, 55%, 1)`;
        };
        for (let y = 0; y < 256; y++) {
          const ly = Math.floor(y * stepY);
          if (ly >= labels.length) continue;
          for (let x = 0; x < 256; x++) {
            const lx = Math.floor(x * stepX);
            if (lx >= labels[ly].length) continue;
            const lVal = labels[ly][lx];
            if (lVal > 0) {
              tempCtx.fillStyle = getLabelColor(lVal);
              tempCtx.fillRect(x, y, 1.2, 1.2);
            }
          }
        }
      } else {
        tempCtx.drawImage(cellCanvas, 0, 0, 2048, 2048, 0, 0, 256, 256);
      }
      const img_05 = tempCanvas.toDataURL('image/png');

      // 06_contours.png
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      tempCtx.lineWidth = 1;
      for (const cnt of rawContours) {
        tempCtx.beginPath();
        for (let i = 0; i < cnt.length; i++) {
          const px = cnt[i].x / 8;
          const py = cnt[i].y / 8;
          if (i === 0) tempCtx.moveTo(px, py);
          else tempCtx.lineTo(px, py);
        }
        tempCtx.stroke();
        if (cnt.length > 0) {
          tempCtx.fillStyle = '#22c55e';
          tempCtx.beginPath();
          tempCtx.arc(cnt[0].x / 8, cnt[0].y / 8, 2, 0, 2 * Math.PI);
          tempCtx.fill();
        }
      }
      const img_06 = tempCanvas.toDataURL('image/png');

      // 07_filtered_contours.png
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.strokeStyle = '#22c55e';
      tempCtx.lineWidth = 1.5;
      for (const cnt of filteredContours) {
        tempCtx.beginPath();
        for (let i = 0; i < cnt.length; i++) {
          const px = cnt[i].x / 8;
          const py = cnt[i].y / 8;
          if (i === 0) tempCtx.moveTo(px, py);
          else tempCtx.lineTo(px, py);
        }
        tempCtx.stroke();
      }
      tempCtx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      tempCtx.setLineDash([2, 2]);
      tempCtx.lineWidth = 1;
      for (const cnt of rawContours) {
        if ((cnt as any).isFiltered) {
          tempCtx.beginPath();
          for (let i = 0; i < cnt.length; i++) {
            const px = cnt[i].x / 8;
            const py = cnt[i].y / 8;
            if (i === 0) tempCtx.moveTo(px, py);
            else tempCtx.lineTo(px, py);
          }
          tempCtx.stroke();
        }
      }
      tempCtx.setLineDash([]);
      const img_07 = tempCanvas.toDataURL('image/png');

      // 08_final_glyph.png
      const scaleX = (256 - 40) / (advanceWidth || 5000);
      const scaleY = (256 - 40) / 14000;
      const mapX = (x: number) => 20 + x * scaleX;
      const mapY = (y: number) => 256 - 20 - (y - (-4000)) * scaleY;

      tempCtx.fillStyle = '#fcfbfa';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      tempCtx.setLineDash([2, 4]);
      tempCtx.beginPath();
      tempCtx.moveTo(0, mapY(0));
      tempCtx.lineTo(256, mapY(0));
      tempCtx.stroke();
      tempCtx.setLineDash([]);

      tempCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      for (const subpath of finalFontPaths) {
        tempCtx.beginPath();
        for (let i = 0; i < subpath.length; i++) {
          const cmd = subpath[i];
          if (cmd.type === 'M') tempCtx.moveTo(mapX(cmd.x), mapY(cmd.y));
          else if (cmd.type === 'L') tempCtx.lineTo(mapX(cmd.x), mapY(cmd.y));
          else if (cmd.type === 'Q') tempCtx.quadraticCurveTo(mapX(cmd.x1), mapY(cmd.y1), mapX(cmd.x), mapY(cmd.y));
          else if (cmd.type === 'Z') tempCtx.closePath();
        }
        tempCtx.fill();
      }
      const img_08 = tempCanvas.toDataURL('image/png');

      // 09_font_path.png
      tempCtx.fillStyle = '#f8fafc';
      tempCtx.fillRect(0, 0, 256, 256);
      tempCtx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
      tempCtx.beginPath();
      tempCtx.moveTo(0, mapY(0));
      tempCtx.lineTo(256, mapY(0));
      tempCtx.stroke();

      tempCtx.strokeStyle = '#3b82f6';
      tempCtx.lineWidth = 1.5;
      for (const subpath of finalFontPaths) {
        tempCtx.beginPath();
        for (let i = 0; i < subpath.length; i++) {
          const cmd = subpath[i];
          if (cmd.type === 'M') tempCtx.moveTo(mapX(cmd.x), mapY(cmd.y));
          else if (cmd.type === 'L') tempCtx.lineTo(mapX(cmd.x), mapY(cmd.y));
          else if (cmd.type === 'Q') tempCtx.quadraticCurveTo(mapX(cmd.x1), mapY(cmd.y1), mapX(cmd.x), mapY(cmd.y));
          else if (cmd.type === 'Z') tempCtx.closePath();
        }
        tempCtx.stroke();

        for (const cmd of subpath) {
          if (cmd.x !== undefined && cmd.y !== undefined) {
            tempCtx.fillStyle = '#ef4444';
            tempCtx.beginPath();
            tempCtx.arc(mapX(cmd.x), mapY(cmd.y), 2.5, 0, 2 * Math.PI);
            tempCtx.fill();
          }
          if (cmd.x1 !== undefined && cmd.y1 !== undefined) {
            tempCtx.fillStyle = '#3b82f6';
            tempCtx.beginPath();
            tempCtx.arc(mapX(cmd.x1), mapY(cmd.y1), 2, 0, 2 * Math.PI);
            tempCtx.fill();
          }
        }
      }
      const img_09 = tempCanvas.toDataURL('image/png');

      return {
        img_01, img_02, img_03, img_04, img_05, img_06, img_07, img_08, img_09
      };
    } catch (err) {
      console.error('Diagnostic generation error', err);
      return null;
    }
  };

  // Run the perspective deskew, slicing, and vector trace pipeline
  const processImagePipeline = async () => {
    if (!imageSrc || !uploadedImgRef.current) return;
    setIsProcessing(true);

    console.log(`%c[FORENSIC ENTER] processImagePipeline`, "color: #e11d48; font-weight: bold; font-size: 14px;");
    console.log(`Active Template: ${activeTemplate.name} (ID: ${activeTemplate.id})`);
    console.log(`Document grid layout: ${activeTemplate.cols} columns x ${activeTemplate.rows} rows`);
    console.log(`Upload dimensions: ${imgDimensions.width}x${imgDimensions.height}`);

    if (typeof window !== 'undefined') {
      (window as any).__forensic_trace = {
        warnings: [],
        totalProcessedCells: 0,
        totalContours: 0,
        totalRejectedContours: 0,
        totalGlyphs: 0,
        totalCollisions: 0,
        savedImages: {},
        lastCcLabels: []
      };
    }

    try {
      // 1. Check for Duplicate/overlapping grid coordinates
      console.log(`%c[FORENSIC] RUNNING GRID ANALYSIS...`, "color: #7c3aed; font-weight: bold;");
      const coordSet = new Set<string>();
      const dupCells: string[] = [];
      for (const cell of activeTemplate.cells) {
        if (cell.isLogo) continue;
        const coordKey = `${cell.row},${cell.col}`;
        if (coordSet.has(coordKey)) {
          dupCells.push(`Cell '${cell.char}' at row ${cell.row}, col ${cell.col}`);
        }
        coordSet.add(coordKey);
      }
      if (dupCells.length > 0) {
        const dupMsg = `DUPLICATE CELLS DETECTED: ${JSON.stringify(dupCells)}`;
        console.error(`%c[FORENSIC ERROR] ${dupMsg}`, "color: #dc2626; font-weight: bold;");
        if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
          (window as any).__forensic_trace.warnings.push(dupMsg);
        }
      } else {
        console.log(`Grid coordinates coverage check: Passed. All cells are uniquely assigned.`);
      }

      // 2. Warp shift analysis
      const idealW = imgDimensions.width;
      const idealH = imgDimensions.height;
      const warpDisplacements = {
        topLeft: Math.hypot(corners.topLeft.x - 0, corners.topLeft.y - 0),
        topRight: Math.hypot(corners.topRight.x - idealW, corners.topRight.y - 0),
        bottomRight: Math.hypot(corners.bottomRight.x - idealW, corners.bottomRight.y - idealH),
        bottomLeft: Math.hypot(corners.bottomLeft.x - 0, corners.bottomLeft.y - idealH),
      };
      console.log(`%c[FORENSIC] WARP ANALYSIS`, "color: #7c3aed; font-weight: bold;");
      console.log(`  Top-Left Corner shift: ${warpDisplacements.topLeft.toFixed(1)}px`);
      console.log(`  Top-Right Corner shift: ${warpDisplacements.topRight.toFixed(1)}px`);
      console.log(`  Bottom-Right Corner shift: ${warpDisplacements.bottomRight.toFixed(1)}px`);
      console.log(`  Bottom-Left Corner shift: ${warpDisplacements.bottomLeft.toFixed(1)}px`);
      
      const maxWarpShift = Math.max(warpDisplacements.topLeft, warpDisplacements.topRight, warpDisplacements.bottomRight, warpDisplacements.bottomLeft);
      if (maxWarpShift > 200) {
        const warnMsg = `Severe warp/skew distortion! Max corner displacement is ${maxWarpShift.toFixed(1)}px. This might cause cell slicing errors!`;
        console.warn(`%cWARNING: ${warnMsg}`, "color: #b45309; font-weight: bold;");
        if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
          (window as any).__forensic_trace.warnings.push(warnMsg);
        }
      }

      // 3. Create source offscreen canvas
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = imgDimensions.width;
      srcCanvas.height = imgDimensions.height;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) throw new Error('Could not create Canvas context');
      srcCtx.drawImage(uploadedImgRef.current, 0, 0);

      // 4. Warp image into normalized A4 coordinate space with ultra high 300 DPI resolution (2480 x 3508 px)
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
        const labelW = Math.round(destW * (0.18 + Math.min(8, labelLength) * 0.07));
        const labelH = Math.round(destH * 0.20);

        // FORENSIC: Calculate ink density inside label area before erasing it
        let labelInkCountBefore = 0;
        try {
          const lImg = cellCtx.getImageData(Math.round(destX), Math.round(destY), labelW, labelH);
          for (let i = 0; i < lImg.data.length; i += 4) {
            const ref = 0.299 * lImg.data[i] + 0.587 * lImg.data[i+1] + 0.114 * lImg.data[i+2];
            if (lImg.data[i+3] > 50 && ref < activeThreshold) {
              labelInkCountBefore++;
            }
          }
        } catch(e) {}

        cellCtx.fillRect(destX, destY, labelW, labelH);

        // FORENSIC: Calculate ink density inside label area after erasing it
        let labelInkCountAfter = 0;
        try {
          const lImg = cellCtx.getImageData(Math.round(destX), Math.round(destY), labelW, labelH);
          for (let i = 0; i < lImg.data.length; i += 4) {
            const ref = 0.299 * lImg.data[i] + 0.587 * lImg.data[i+1] + 0.114 * lImg.data[i+2];
            if (lImg.data[i+3] > 50 && ref < activeThreshold) {
              labelInkCountAfter++;
            }
          }
        } catch(e) {}

        const cellWarns: string[] = [];
        if (labelInkCountAfter > 20) {
          const lblMsg = `Ink remnants detected inside label area after erasure! (ink pixels left: ${labelInkCountAfter})`;
          cellWarns.push(lblMsg);
          console.warn(`%c[FORENSIC WARNING] Cell '${cell.char}' : ${lblMsg}`, "color: #b45309;");
        }

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

        // Collect contour classifications for visual rendering survival lines
        const filteredContoursList: Point[][] = [];
        for (const cnt of contours) {
          if (!(cnt as any).isFiltered) {
            filteredContoursList.push(cnt);
          }
        }

        // Generate the 9 diagnostic PNG files!
        const dImgs = generateAllNineDiagnostics(
          cell,
          srcCanvas,
          corners,
          warpedCanvas,
          srcX, srcY, srcW_crop, srcH_crop,
          cellCanvas,
          labelW, labelH, destX, destY, destW, destH,
          labelInkCountBefore, labelInkCountAfter,
          binary,
          contours,
          filteredContoursList,
          fontPaths.paths,
          fontPaths.advanceWidth
        );

        if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
          const ft = (window as any).__forensic_trace;
          ft.totalProcessedCells++;
          ft.totalContours += contours.length;
          const rejectedInThisCell = contours.length - filteredContoursList.length;
          ft.totalRejectedContours += rejectedInThisCell;
          if (fontPaths.paths.length > 0) {
            ft.totalGlyphs++;
          } else {
            cellWarns.push("Empty glyph contour paths list (character extracted as empty space/skipped)");
          }

          ft.savedImages[cell.char] = {
            char: cell.char,
            label: cell.label,
            warnings: cellWarns,
            stats: {
              row: cell.row,
              col: cell.col,
              labelInkBefore: labelInkCountBefore,
              labelInkAfter: labelInkCountAfter,
              warpDisplacement: Math.hypot(srcX - cell.col * (targetW / activeTemplate.cols), srcY - cell.row * (targetH / activeTemplate.rows)),
              contourCount: contours.length,
              filteredCount: filteredContoursList.length,
              advanceWidth: fontPaths.advanceWidth
            },
            images: dImgs
          };

          if (cellWarns.length > 0) {
            ft.warnings.push(`Cell '${cell.char}': ${cellWarns.join('; ')}`);
          }
        }
      }

      setScannedGlyphs(extractedGlyphs);
      setSelectedGlyphIndex(extractedGlyphs.length > 0 ? 0 : null);
      setIsSaved(false);

      console.log(`%c[FORENSIC EXIT] processImagePipeline: complete`, "color: #e11d48; font-weight: bold; font-size: 13px;");
      if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
        const ft = (window as any).__forensic_trace;
        console.log(`Total Cells Processed: ${ft.totalProcessedCells}`);
        console.log(`Total Extracted Glyphs: ${ft.totalGlyphs}`);
        console.log(`Total Traced Contours: ${ft.totalContours}`);
        console.log(`Total Rejected Contours: ${ft.totalRejectedContours}`);
        
        const suspiciousInfo = Object.values(ft.savedImages).filter((c: any) => c.warnings.length > 0 || c.stats.labelInkAfter > 20);
        console.log(`Suspicious Cells found: ${suspiciousInfo.length}`);
        
        console.log(`Detailed Character Process Report:`);
        const reportTable = Object.values(ft.savedImages).map((c: any) => ({
          Character: c.char,
          Label: c.label || "N/A",
          Row: c.stats.row,
          Col: c.stats.col,
          InkBefore: c.stats.labelInkBefore,
          InkAfter: c.stats.labelInkAfter,
          WarpDispl: `${c.stats.warpDisplacement.toFixed(1)}px`,
          RawContours: c.stats.contourCount,
          FilteredCount: c.stats.filteredCount,
          Status: c.warnings.length > 0 ? `⚠️ ${c.warnings[0].substring(0, 50)}...` : "✅ OK"
        }));
        console.table(reportTable);
      }
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
    setIsSaved(true);
    
    // Celebration
    const sound = new Audio();
    // we can also throw a brief status
  };

  // Generate and download a beautified TXT diagnostic and telemetry report
  const downloadTelemetryLog = () => {
    let text = '';
    const divider = '='.repeat(80) + '\n';
    const subDivider = '-'.repeat(80) + '\n';

    text += divider;
    text += '          TYPESCRIBE COMPUTER VISION & FONT GENERATION TELEMETRY LOG\n';
    text += divider;
    text += `Дата и время генерации:  ${new Date().toISOString()}\n`;
    text += `Название шаблона:        ${activeTemplate.name}\n`;
    text += `Размер сетки (Units/Em): 16,384 em\n`;
    text += `Линия подъема (Ascender): 12,800\n`;
    text += `Линия спуска (Descender): -3,584\n`;
    text += subDivider;

    text += '\n[1] ОБЩИЕ МЕТРИКИ ШРИФТА И КОЛЛИЗИИ\n';
    text += '-'.repeat(40) + '\n';
    text += `Всего символов в базе:   ${scannedGlyphs.length} шт.\n`;
    
    const unicodeMap = new Map();
    let collisionsCount = 0;
    const collisionDetails: string[] = [];

    scannedGlyphs.forEach(glyph => {
      const code = glyph.char.charCodeAt(0);
      if (unicodeMap.has(code)) {
        collisionsCount++;
        collisionDetails.push(`Конфликт Unicode U+${code.toString(16).toUpperCase()}: символы '${glyph.char}' и '${unicodeMap.get(code)}'`);
      } else {
        unicodeMap.set(code, glyph.char);
      }
    });

    text += `Обнаруженные конфликты:  ${collisionsCount > 0 ? `${collisionsCount}!` : '0 (Чистая сборка)'}\n`;
    if (collisionDetails.length > 0) {
      text += 'Детализация коллизий:\n';
      collisionDetails.forEach(c => {
        text += `  ⚠️ ${c}\n`;
      });
    }

    text += '\n[2] ТЕЛЕМЕТРИЯ КОМПЬЮТЕРНОГО ЗРЕНИЯ И СКАНИРОВАНИЯ\n';
    text += '-'.repeat(40) + '\n';

    const ft = typeof window !== 'undefined' ? (window as any).__forensic_trace : null;
    if (ft) {
      text += `Статус трассировки:      Активен\n`;
      text += `Обработано ячеек бланка:  ${ft.totalProcessedCells || 0}\n`;
      text += `Всего найдено контуров:   ${ft.totalContours || 0}\n`;
      text += `Исключено шума/границ:    ${ft.totalRejectedContours || 0}\n`;
      text += `Успешно добавлено в шрифт: ${ft.totalGlyphs || 0}\n`;
      text += `Координатные коллизии:    ${ft.totalCollisions || 0}\n`;

      if (ft.warnings && ft.warnings.length > 0) {
        text += '\nПредупреждения сканера (Warnings):\n';
        ft.warnings.forEach((warn: string) => {
          text += `  ⚠️ ${warn}\n`;
        });
      } else {
        text += `\nПредупреждения:          Сообщений нет. Калибровка листов выполнена успешно.\n`;
      }
    } else {
      text += `Трассировка сканера недоступна или была сброшена.\n`;
    }

    text += '\n[3] ПОДРОБНЫЙ СЕНСОРНЫЙ АНАЛИЗ ГЛИФОВ\n';
    text += '-'.repeat(40) + '\n';
    
    if (ft && ft.savedImages && Object.keys(ft.savedImages).length > 0) {
      text += 'Символ | Строка | Столбец | Всего контуров | Кепт-контуры | Остаточные чернила\n';
      text += '-'.repeat(74) + '\n';
      Object.keys(ft.savedImages).forEach(ch => {
        const item = ft.savedImages[ch];
        const s = item.stats;
        const charPadded = ch.padEnd(6);
        const rowPadded = String(s.row).padEnd(6);
        const colPadded = String(s.col).padEnd(7);
        const rawPadded = String(s.contourCount).padEnd(14);
        const keptPadded = String(s.filteredCount).padEnd(12);
        const inkPadded = String(s.labelInkAfter);
        text += ` ${charPadded} |  ${rowPadded} |  ${colPadded} | ${rawPadded} | ${keptPadded} | ${inkPadded}\n`;
      });
      text += '-'.repeat(74) + '\n';
    } else {
      text += 'Детальные логи бланка недоступны.\n';
    }

    text += '\n[4] СТРУКТУРНЫЕ ВЕКТОРНЫЕ ПАРАМЕТРЫ ШРИФТА (OPENTYPE EXP.)\n';
    text += '-'.repeat(40) + '\n';

    scannedGlyphs.forEach(glyph => {
      const code = glyph.char.charCodeAt(0);
      const isSpace = glyph.char === ' ';
      text += `\nСимвол: '${glyph.char}'\n`;
      text += `  Код Unicode: U+${code.toString(16).toUpperCase().padStart(4, '0')} (${code})\n`;
      text += `  Ширина символа (Advance Width): ${glyph.width} em\n`;
      if (isSpace) {
        text += `  Тип: Пробел (Разделительный глиф без контуров)\n`;
      } else {
        text += `  Количество опорных векторных контуров: ${glyph.paths ? glyph.paths.length : 0}\n`;
        if (glyph.paths && glyph.paths.length > 0) {
          text += `  Векторная сложность: ${glyph.paths.reduce((acc, p) => acc + (p ? p.length : 0), 0)} узлов\n`;
          let pointsLog = '';
          glyph.paths.forEach((pathSegment, idx) => {
            if (!pathSegment) return;
            const pathTypeCount = pathSegment.reduce((acc: any, cmd: any) => {
              if (cmd && cmd.type) {
                acc[cmd.type] = (acc[cmd.type] || 0) + 1;
              }
              return acc;
            }, {});
            const details = Object.entries(pathTypeCount).map(([k, v]) => `${k}:${v}`).join(', ');
            pointsLog += `    Контур #${idx + 1}: ${pathSegment.length} команд (${details})\n`;
          });
          text += pointsLog;
        }
      }
    });

    text += '\n' + divider;
    text += '                      [КОНЕЦ ТЕЛЕМЕТРИЧЕСКОГО ОТЧЕТА]\n';
    text += divider;

    // Trigger download of the TXT file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Typescribe-${activeTemplate.name}-telemetry-log.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                  onClick={() => {
                    const firstChar = Object.keys((window as any).__forensic_trace?.savedImages || {})[0] || null;
                    setSelectedForensicChar(firstChar);
                    setIsForensicOpen(true);
                  }}
                  className="p-2 border border-slate-200 hover:border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Диагностика Trace
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
                <button
                  onClick={downloadTelemetryLog}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Скачать лог оцифровки (.txt)
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

      {/* FORENSIC TRACE COMPUTER VISION EXPLORER DECK MODAL */}
      {isForensicOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/15 text-indigo-400 p-2.5 rounded-2xl border border-indigo-500/20">
                  <span className="text-xl">🔍</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">Forensic Computer Vision Dynamic Trace Deck</h3>
                  <p className="text-xs text-slate-400">Forensic pixel trace telemetry dashboard from paper image crop to true-type bezier outlines.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {typeof window !== 'undefined' && (window as any).__forensic_trace && (
                  <div className="hidden md:flex items-center gap-4 text-xs">
                    <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/60 font-medium">
                      Processed: <strong className="text-emerald-400">{(window as any).__forensic_trace.totalProcessedCells || 0}</strong>
                    </span>
                    <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/60 font-medium">
                      Contours: <strong className="text-blue-400">{(window as any).__forensic_trace.totalContours || 0}</strong>
                    </span>
                    <span className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700/60 font-medium">
                      Filtered: <strong className="text-rose-400">{(window as any).__forensic_trace.totalRejectedContours || 0}</strong>
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setIsForensicOpen(false)}
                  className="text-slate-400 hover:text-slate-200 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer text-xs font-bold"
                >
                  Закрыть
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Column - Characters list */}
              <div className="w-48 border-r border-slate-800 overflow-y-auto p-4 space-y-1.5 bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">Символы бланка</span>
                {typeof window !== 'undefined' && (window as any).__forensic_trace?.savedImages ? (
                  Object.keys((window as any).__forensic_trace.savedImages).map((chChar) => {
                    const cData = (window as any).__forensic_trace.savedImages[chChar];
                    const hasWarns = cData.warnings.length > 0 || cData.stats.labelInkAfter > 20;
                    const isSelected = selectedForensicChar === chChar;
                    return (
                      <button
                        key={chChar}
                        onClick={() => setSelectedForensicChar(chChar)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 border border-transparent text-white shadow-md' 
                            : 'bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-mono text-sm">{chChar}</span>
                        <div className="flex items-center gap-1.5">
                          {hasWarns ? (
                            <span className="text-[10px] text-amber-500" title="Предупреждение">⚠️</span>
                          ) : (
                            <span className="text-[10px] text-emerald-500">✓</span>
                          )}
                          <span className="text-[9px] font-mono text-slate-500">{cData.stats.filteredCount || 0}c</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center p-4 text-xs text-slate-500">Нет данных оцифровки</div>
                )}
              </div>

              {/* Right Column - Steps details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/40">
                {selectedForensicChar && typeof window !== 'undefined' && (window as any).__forensic_trace?.savedImages?.[selectedForensicChar] ? (
                  (() => {
                    const cData = (window as any).__forensic_trace.savedImages[selectedForensicChar];
                    const hasWarn = cData.warnings.length > 0 || cData.stats.labelInkAfter > 20;
                    return (
                      <div className="space-y-6">
                        {/* Title deck */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-2xl font-bold font-mono text-white">Символ ‘{cData.char}’</h4>
                              <span className="bg-slate-800 text-slate-400 border border-slate-700/60 font-mono text-xs px-2.5 py-0.5 rounded-full">
                                Unicode: U+{cData.char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Координаты сетки бланка: Строка <span className="font-mono text-slate-300">{cData.stats.row}</span>, Столбец <span className="font-mono text-slate-300">{cData.stats.col}</span>
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Смещение варпа</span>
                              <span className="text-xs font-mono font-bold text-slate-300">{cData.stats.warpDisplacement.toFixed(1)}px</span>
                            </div>
                            <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Чернила (Label)</span>
                              <span className={`text-xs font-mono font-bold ${cData.stats.labelInkAfter > 20 ? 'text-amber-500' : 'text-slate-300'}`}>
                                {cData.stats.labelInkBefore} → {cData.stats.labelInkAfter}
                              </span>
                            </div>
                            <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Контуров (Все/Фильтр)</span>
                              <span className="text-xs font-mono font-bold text-slate-300">{cData.stats.contourCount} / {cData.stats.filteredCount}</span>
                            </div>
                            <div className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Ширина (em)</span>
                              <span className="text-xs font-mono font-bold text-slate-300">{cData.stats.advanceWidth}</span>
                            </div>
                          </div>
                        </div>

                        {/* Warnings banner */}
                        {hasWarn && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs rounded-xl space-y-1">
                            <span className="font-bold">⚠️ Зарегистрированы аномалии при оцифровке:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-amber-100/90 text-[11px]">
                              {cData.stats.labelInkAfter > 20 && (
                                <li>После удаления подсказки-символа в ячейке найдено {cData.stats.labelInkAfter} грязных пикселей. Возможна паразитная оцифровка!</li>
                              )}
                              {cData.warnings.map((w: string, i: number) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 9 Stage PNG Visualizer Slideshow */}
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">9 Диагностических Фаз Компьютерного Зрения (PNG Stages)</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                              { id: "01", name: "01_original", label: "01. Исходный скан", desc: "Фото ячейки доperspective deskew" },
                              { id: "02", name: "02_after_warp", label: "02. После варпа", desc: "Коррекция перспективы листа" },
                              { id: "03", name: "03_after_label_removal", label: "03. Без разметки", desc: "Стирание печатной буквы" },
                              { id: "04", name: "04_binary", label: "04. Бинаризация", desc: "Адаптивное Ч/Б разделение" },
                              { id: "05", name: "05_connected_components", label: "05. Компоненты CCL", desc: "Выделение островов связности" },
                              { id: "06", name: "06_contours", label: "06. Сырые контуры", desc: "Marching Squares контур-трейс" },
                              { id: "07", name: "07_filtered_contours", label: "07. Фильтры контуров", desc: "Исключение сетки таблицы" },
                              { id: "08", name: "08_final_glyph", label: "08. Глиф в EM сетке", desc: "Масштабирование в EM сетку" },
                              { id: "09", name: "09_font_path", label: "09. Опорные Безье", desc: "Векторные узлы ttf-символа" }
                            ].map((stg) => {
                              const b64 = cData.images?.[`img_${stg.id}`];
                              return (
                                <div key={stg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 space-y-2 group hover:border-indigo-500/40 hover:bg-slate-800/50 transition-all flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-indigo-400 block">{stg.label}</span>
                                    <p className="text-[9px] text-slate-500 leading-tight block h-6 overflow-hidden">{stg.desc}</p>
                                  </div>

                                  <div className="aspect-square bg-white rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center relative cursor-zoom-in">
                                    {b64 ? (
                                      <>
                                        <img src={b64} alt={stg.name} className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                          <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-100 px-2 py-1 rounded-md font-bold shadow-md">Zoom ↗</span>
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 font-mono">No image</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Contours specific trace logs list console styling */}
                        <div className="space-y-2.5">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Пошаговый консольный лог контуров символа</span>
                          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 font-mono text-[10px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                            <p className="text-emerald-400 font-bold">[TRACE START] Processing Trace for Cell ‘{cData.char}’</p>
                            <p>Loaded high-res localized bounding box (destW: 1960px, destH: 1960px, centering: Active)</p>
                            <p>Erase boundary coordinates sweep margin safe width borders: 1% edge, adaptive top/bottom</p>
                            <p>Marching Squares vectorization found total <b className="text-blue-300">{cData.stats.contourCount} contours</b> in 2D grid matrix space</p>
                            {cData.stats.contourCount === 0 ? (
                              <p className="text-rose-400 font-bold">⚠️ WARNING: Zero raw contours extracted in this grid square. Symbol looks empty.</p>
                            ) : (
                              <p className="text-indigo-400">Classifying and filtering contours with geometric line limits:</p>
                            )}
                            <p className="text-emerald-400 font-bold">[TRACE EXIT] Processed symbol character ‘{cData.char}’ with status: OK</p>
                          </div>
                        </div>

                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                    <span className="text-4xl mb-2">👁️</span>
                    <p className="text-sm font-semibold text-slate-300">Выберите символ на левой панели</p>
                    <p className="text-xs max-w-sm mt-1 text-slate-500">Оцифруйте бланк вначале на шаге настройки, чтобы исследовать полную компьютерную трассировку по контурам и Безье-кривым.</p>
                  </div>
                )}
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
