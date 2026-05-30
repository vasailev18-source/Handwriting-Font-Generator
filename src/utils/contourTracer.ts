import { Point, DeskewCorners, PathCommand } from '../types';

// Forensic Tracer Session State (Shared client-side diagnostics)
if (typeof window !== 'undefined') {
  (window as any).__forensic_trace = (window as any).__forensic_trace || {
    totalCells: 0,
    totalComponents: 0,
    totalContours: 0,
    totalRejectedContours: 0,
    totalGlyphs: 0,
    totalCollisions: 0,
    suspiciousCells: [] as string[],
    savedImages: {} as Record<string, Record<string, string>>
  };
}

let nextContourId = 1;
export function getNextContourId(): number {
  return nextContourId++;
}
export function resetContourIds(): void {
  nextContourId = 1;
}

// Bilinear quad warping: maps normal [0, 1] x [0, 1] back to source image space via 4 corners
export function warpImage(
  sourceCanvas: HTMLCanvasElement,
  corners: DeskewCorners,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  console.log(`%c[FORENSIC ENTER] warpImage`, "color: #0891b2; font-weight: bold;");
  console.log(`Source dimensions: ${sourceCanvas.width}x${sourceCanvas.height}`);
  console.log(`Target request size: ${targetWidth}x${targetHeight}`);
  console.log(`Quad corners specification:`, JSON.stringify(corners));
  const startTime = performance.now();

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  const targetCtx = targetCanvas.getContext('2d');
  
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!targetCtx || !sourceCtx) {
    console.warn(`%c[FORENSIC EXIT] warpImage: targetCtx or sourceCtx failed`, "color: #0891b2;");
    return targetCanvas;
  }

  const srcWidth = sourceCanvas.width;
  const srcHeight = sourceCanvas.height;
  const srcData = sourceCtx.getImageData(0, 0, srcWidth, srcHeight);
  const targetData = targetCtx.createImageData(targetWidth, targetHeight);

  const { topLeft: p00, topRight: p10, bottomRight: p11, bottomLeft: p01 } = corners;

  for (let y = 0; y < targetHeight; y++) {
    const fy = y / (targetHeight - 1);
    for (let x = 0; x < targetWidth; x++) {
      const fx = x / (targetWidth - 1);

      // Bilinear interpolation between 4 corners
      const rx =
        (1 - fx) * (1 - fy) * p00.x +
        fx * (1 - fy) * p10.x +
        fx * fy * p11.x +
        (1 - fx) * fy * p01.x;

      const ry =
        (1 - fx) * (1 - fy) * p00.y +
        fx * (1 - fy) * p10.y +
        fx * fy * p11.y +
        (1 - fx) * fy * p01.y;

      // Nearest-neighbor or simple interpolation
      const sx = Math.round(rx);
      const sy = Math.round(ry);

      if (sx >= 0 && sx < srcWidth && sy >= 0 && sy < srcHeight) {
        const srcIdx = (sy * srcWidth + sx) * 4;
        const tarIdx = (y * targetWidth + x) * 4;

        targetData.data[tarIdx] = srcData.data[srcIdx];         // R
        targetData.data[tarIdx + 1] = srcData.data[srcIdx + 1]; // G
        targetData.data[tarIdx + 2] = srcData.data[srcIdx + 2]; // B
        targetData.data[tarIdx + 3] = srcData.data[srcIdx + 3]; // A
      } else {
        const tarIdx = (y * targetWidth + x) * 4;
        targetData.data[tarIdx] = 255;
        targetData.data[tarIdx + 1] = 255;
        targetData.data[tarIdx + 2] = 255;
        targetData.data[tarIdx + 3] = 255;
      }
    }
  }

  targetCtx.putImageData(targetData, 0, 0);
  const endTime = performance.now();
  console.log(`%c[FORENSIC EXIT] warpImage: complete`, "color: #0891b2; font-weight: bold;");
  console.log(`Resulting canvas size: ${targetCanvas.width}x${targetCanvas.height}`);
  console.log(`Warp duration: ${(endTime - startTime).toFixed(2)}ms`);
  return targetCanvas;
}

// Binarize a localized canvas and return a 2D boolean array (true = black/ink, false = white/bg)
export function getBinaryGrid(
  canvas: HTMLCanvasElement,
  threshold: number,
  clearMargins = false
): { data: boolean[][]; width: number; height: number } {
  console.log(`%c[FORENSIC ENTER] getBinaryGrid`, "color: #7c3aed; font-weight: bold;");
  console.log(`Canvas size: ${canvas.width}x${canvas.height}, Threshold limit: ${threshold}, Clear margins option: ${clearMargins}`);
  const startTime = performance.now();

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  if (!ctx) {
    console.warn(`%c[FORENSIC EXIT] getBinaryGrid: Canvas context failed`, "color: #7c3aed;");
    return { data: Array(height).fill(null).map(() => Array(width).fill(false)), width, height };
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Инициализация бинарной сетки и поиск габаритов всех чернил
  const grid: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  let minXAll = Infinity, maxXAll = -Infinity;
  let minYAll = Infinity, maxYAll = -Infinity;
  let hasAnyInk = false;
  let blackPixelsCount = 0;
  let whitePixelsCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Вычисление яркости в градациях серого
      const ref = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Определение чернил (темные пиксели с достаточной прозрачностью)
      const isInk = a > 50 && ref < threshold;
      if (isInk) {
        grid[y][x] = true;
        blackPixelsCount++;
        if (x < minXAll) minXAll = x;
        if (x > maxXAll) maxXAll = x;
        if (y < minYAll) minYAll = y;
        if (y > maxYAll) maxYAll = y;
        hasAnyInk = true;
      } else {
        whitePixelsCount++;
      }
    }
  }

  const totalPixels = width * height;
  const fillRatio = blackPixelsCount / totalPixels;
  console.log(`Binary Grid stats: Total Pixels: ${totalPixels}, Black/Ink count: ${blackPixelsCount}, White count: ${whitePixelsCount}, Ink Fill ratio: ${(fillRatio * 100).toFixed(2)}%`);

  if (!hasAnyInk) {
    console.log(`%c[FORENSIC EXIT] getBinaryGrid: No ink found on canvas`, "color: #7c3aed; font-weight: bold;");
    return { data: grid, width, height };
  }

  // Расчет физических размеров ячейки по контурным границам чернил
  const cellW = width;
  const cellH = height;

  // Динамическая Безопасная Зона разметки (Dynamic Central Safe Zone)
  // Upper margin of 22% covers printed guidelines/text hints
  const safeMinX = cellW * 0.10;
  const safeMaxX = cellW * 0.90;
  const safeMinY = cellH * 0.22;
  const safeMaxY = cellH * 0.90;

  // 2. Алгоритм разметки связных областей (Connected Component Labeling - CCL) через BFS
  const visited = Array(height).fill(null).map(() => Array(width).fill(false));
  const ccLabels: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));
  const components: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    pixels: { x: number; y: number }[];
  }[] = [];

  // 8-connected offsets
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] && !visited[y][x]) {
        // Найдена новая компонента
        const compId = components.length + 1;
        const compPixels: { x: number; y: number }[] = [];
        let compMinX = x, compMaxX = x;
        let compMinY = y, compMaxY = y;

        const queue: number[] = [x, y];
        visited[y][x] = true;
        ccLabels[y][x] = compId;
        let head = 0;

        while (head < queue.length) {
          const qx = queue[head++];
          const qy = queue[head++];
          compPixels.push({ x: qx, y: qy });
          ccLabels[qy][qx] = compId;

          if (qx < compMinX) compMinX = qx;
          if (qx > compMaxX) compMaxX = qx;
          if (qy < compMinY) compMinY = qy;
          if (qy > compMaxY) compMaxY = qy;

          for (let i = 0; i < 8; i++) {
            const nx = qx + dx[i];
            const ny = qy + dy[i];

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (grid[ny][nx] && !visited[ny][nx]) {
                visited[ny][nx] = true;
                ccLabels[ny][nx] = compId;
                queue.push(nx, ny);
              }
            }
          }
        }

        components.push({
          minX: compMinX,
          maxX: compMaxX,
          minY: compMinY,
          maxY: compMaxY,
          pixels: compPixels
        });
      }
    }
  }

  if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
    (window as any).__forensic_trace.lastCcLabels = ccLabels;
  }

  // Update global trace metrics
  if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
    (window as any).__forensic_trace.totalComponents += components.length;
  }

  console.log(`Connected components labeling found: ${components.length} islands`);

  // Find maximum component size to filter noise intelligently
  let maxCompArea = 0;
  for (const comp of components) {
    if (comp.pixels.length > maxCompArea) {
      maxCompArea = comp.pixels.length;
    }
  }

  components.forEach((comp, idx) => {
    const compW = comp.maxX - comp.minX;
    const compH = comp.maxY - comp.minY;
    const area = comp.pixels.length;
    console.log(`  Connected Component Label #${idx} | Area: ${area} pixels | Bounds: x:[${comp.minX}, ${comp.maxX}], y:[${comp.minY}, ${comp.maxY}] (w: ${compW}, h: ${compH})`);
    
    // Warn if a small component is detected which might be noise
    if (area < 25) {
      console.warn(`    %c[FORENSIC WARNING] POSSIBLE NOISE COMPONENT: Component #${idx} (Area: ${area} pixels is smaller than absolute 25px noise thresh)`, "color: #b45309;");
    } else if (maxCompArea > 0 && area < maxCompArea * 0.08) {
      console.warn(`    %c[FORENSIC WARNING] POSSIBLE NOISE COMPONENT: Component #${idx} (Area: ${area} pixels is < 8% of dominant component size ${maxCompArea}px)`, "color: #b45309;");
    }
  });

  // 3. Классификация компонент и умная чистка (Умный Padding + Защита от обрезания хвостиков)
  const finalGrid = Array(height).fill(null).map(() => Array(width).fill(false));
  let removedComponents = 0;
  let remainingComponents = 0;

  for (const comp of components) {
    const compW = comp.maxX - comp.minX;
    const compH = comp.maxY - comp.minY;
    const compSize = comp.pixels.length;

    // Распознавание линий сетки таблицы (очень длинные и тонкие компоненты)
    const isHorizontalBorder = compW > cellW * 0.94 && compH < cellH * 0.10;
    const isVerticalBorder = compH > cellH * 0.94 && compW < cellW * 0.10;
    const isBorderLine = isHorizontalBorder || isVerticalBorder;

    // Исключение аномально гигантских перекрытий
    const isTooBig = compW > cellW * 0.97 || compH > cellH * 0.97;

    // Проверка пересечения с Центральной Безопасной Зоной черчения
    const overlapX = comp.minX <= safeMaxX && comp.maxX >= safeMinX;
    const overlapY = comp.minY <= safeMaxY && comp.maxY >= safeMinY;
    const overlapsSafeZone = overlapX && overlapY;

    // Исключение печатного текста: игнорируем печатные буквы-подсказки в верхней части трафарета
    const isPrintedHint = comp.maxY < cellH * 0.35 && comp.maxX < cellW * 0.40 && compW < cellW * 0.20 && compH < cellH * 0.20;

    // Отсечение одиночного фонового шума
    const isNoise = compSize < 25;

    // Символ сохраняется целиком, если хотя бы частично пересекает безопасную зону
    // Это автоматически сохраняет длинные штрихи ("хвостики") букв вне безопасной зоны!
    const shouldKeep = overlapsSafeZone && !isBorderLine && !isTooBig && !isNoise && !isPrintedHint;

    if (shouldKeep) {
      remainingComponents++;
      for (const p of comp.pixels) {
        finalGrid[p.y][p.x] = true;
      }
    } else {
      removedComponents++;
      const reasons: string[] = [];
      if (!overlapsSafeZone) reasons.push("No safe zone intersection");
      if (isBorderLine) reasons.push("Grid line/Border geometry matched");
      if (isTooBig) reasons.push("Gigantic frame overlap");
      if (isNoise) reasons.push("Extreme noise speckle");
      if (isPrintedHint) reasons.push("Top-left template hint text match");
      console.log(`  Rejected component: Area: ${compSize}px | Reasons: ${reasons.join(", ")}`);
    }
  }

  // 4. Локализация точного бокса вырезания с отступом в -1/+1 пиксель
  let minY = -1, maxY = -1, minX = -1, maxX = -1;
  let hasInk = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (finalGrid[y][x]) {
        if (!hasInk) {
          minY = y;
          maxY = y;
          minX = x;
          maxX = x;
          hasInk = true;
        } else {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
  }

  const resultGrid = Array(height).fill(null).map(() => Array(width).fill(false));

  if (hasInk) {
    // Точный отступ с защитой от выхода за границы массива
    const yMinBound = Math.max(0, minY - 1);
    const yMaxBound = Math.min(height - 1, maxY + 1);
    const xMinBound = Math.max(0, minX - 1);
    const xMaxBound = Math.min(width - 1, maxX + 1);

    for (let y = yMinBound; y <= yMaxBound; y++) {
      for (let x = xMinBound; x <= xMaxBound; x++) {
        resultGrid[y][x] = finalGrid[y][x];
      }
    }
  }

  const endTime = performance.now();
  console.log(`%c[FORENSIC EXIT] getBinaryGrid`, "color: #7c3aed; font-weight: bold;");
  console.log(`Components kept: ${remainingComponents}, Components rejected: ${removedComponents}`);
  console.log(`Delineated ink bbox limits: X: [${minX}, ${maxX}] | Y: [${minY}, ${maxY}] (w: ${maxX - minX}, h: ${maxY - minY})`);
  console.log(`Binarize run-time: ${(endTime - startTime).toFixed(2)}ms`);

  return { data: resultGrid, width, height };
}

// Simple Ramer-Douglas-Peucker (RDP) path simplification algorithm
export function simplifyContour(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = simplifyContour(points.slice(0, index + 1), epsilon);
    const recResults2 = simplifyContour(points.slice(index), epsilon);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(p: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  if (dx === 0 && dy === 0) {
    return Math.sqrt((p.x - lineStart.x) ** 2 + (p.y - lineStart.y) ** 2);
  }

  const num = Math.abs(dy * p.x - dx * p.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  const den = Math.sqrt(dx * dx + dy * dy);
  return num / den;
}

// Trace a single contour from matching edge segments
export function traceSingleContour(
  startPt: Point,
  firstKey: string,
  adj: Map<string, Point[]>
): Point[] {
  console.log(`%c[FORENSIC ENTER] traceSingleContour`, "color: #0369a1");
  console.log(`Starting point: (${startPt.x}, ${startPt.y})`);
  
  const currentContour: Point[] = [startPt];
  let currKey = firstKey;
  let steps = 0;
  let visitedPixelsCount = 0;
  let terminationReason = "unknown";
  
  while (true) {
    const list = adj.get(currKey);
    if (!list || list.length === 0) {
      adj.delete(currKey);
      terminationReason = "dead end (no adjacent segments)";
      break;
    }
    
    const nextPt = list.pop()!;
    if (list.length === 0) {
      adj.delete(currKey);
    }
    
    currentContour.push(nextPt);
    currKey = `${nextPt.x},${nextPt.y}`;
    steps++;
    visitedPixelsCount++;
    
    if (nextPt.x === startPt.x && nextPt.y === startPt.y) {
      terminationReason = "loop closed back to starting point";
      break;
    }
    
    if (steps > 50000) {
      terminationReason = "excessive steps safety break (possible infinite loop)";
      break;
    }
  }

  const id = getNextContourId();
  const c = currentContour as any;
  c.id = id;
  c.globalId = `Contour #${id}`;
  c.origin = "traceContours()";
  c.steps = steps;
  c.visited = visitedPixelsCount;
  c.terminationReason = terminationReason;

  // Bounding box calculation for warning checks
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of currentContour) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;

  console.log(`Contour ID: ${c.globalId}`);
  console.log(`Steps: ${steps}, Visited points: ${visitedPixelsCount}`);
  console.log(`Bounding Box: {x: ${minX}, y: ${minY}, w: ${w}, h: ${h}}`);
  console.log(`Termination reason: ${terminationReason}`);

  if (w < 5 || h < 5) {
    console.warn(`%cWARNING: SMALL CONTOUR (w: ${w}, h: ${h})`, "color: #b45309");
  } else if (w > 1638 || h > 1638) {
    console.warn(`%cWARNING: OVERSIZED CONTOUR (w: ${w}, h: ${h})`, "color: #b45309");
  }

  console.log(`%c[FORENSIC EXIT] traceSingleContour: returned ${currentContour.length} points`, "color: #0369a1");
  return currentContour;
}

// Marching Squares Contour Tracing algorithm
export function traceContours(grid: boolean[][], width: number, height: number): Point[][] {
  console.log(`%c[FORENSIC ENTER] traceContours`, "color: #0284c7; font-weight: bold;");
  console.log(`Input grid dimensions: ${width}x${height}`);
  const startTime = performance.now();

  const segments: { p1: Point; p2: Point }[] = [];

  // Iterate over all 2x2 blocks (corners)
  for (let y = 0; y <= height; y++) {
    for (let x = 0; x <= width; x++) {
      const tl = (x > 0 && y > 0 && grid[y - 1][x - 1]) ? 1 : 0;
      const tr = (x < width && y > 0 && grid[y - 1][x]) ? 1 : 0;
      const br = (x < width && y < height && grid[y][x]) ? 1 : 0;
      const bl = (x > 0 && y < height && grid[y][x - 1]) ? 1 : 0;

      const state = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (state === 0 || state === 15) continue;
      
      const top = { x: x, y: y - 0.5 };
      const right = { x: x + 0.5, y: y };
      const bottom = { x: x, y: y + 0.5 };
      const left = { x: x - 0.5, y: y };

      switch (state) {
        case 1: segments.push({ p1: left, p2: bottom }); break;
        case 2: segments.push({ p1: bottom, p2: right }); break;
        case 3: segments.push({ p1: left, p2: right }); break;
        case 4: segments.push({ p1: right, p2: top }); break;
        case 5: segments.push({ p1: left, p2: bottom }, { p1: right, p2: top }); break;
        case 6: segments.push({ p1: bottom, p2: top }); break;
        case 7: segments.push({ p1: left, p2: top }); break;
        case 8: segments.push({ p1: top, p2: left }); break;
        case 9: segments.push({ p1: top, p2: bottom }); break;
        case 10: segments.push({ p1: top, p2: left }, { p1: bottom, p2: right }); break;
        case 11: segments.push({ p1: top, p2: right }); break;
        case 12: segments.push({ p1: right, p2: left }); break;
        case 13: segments.push({ p1: right, p2: bottom }); break;
        case 14: segments.push({ p1: bottom, p2: left }); break;
      }
    }
  }

  const contours: Point[][] = [];
  const adj = new Map<string, Point[]>();
  
  for (const seg of segments) {
    const k = `${seg.p1.x},${seg.p1.y}`;
    if (!adj.has(k)) adj.set(k, []);
    adj.get(k)!.push(seg.p2);
  }

  while (adj.size > 0) {
    const iterator = adj.keys().next();
    if (iterator.done) break;
    const firstKey = iterator.value;
    
    const parts = firstKey.split(',');
    const startPt = { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
    
    const currentContour = traceSingleContour(startPt, firstKey, adj);
    
    if (currentContour.length > 4) {
      contours.push(currentContour);
    }
  }

  // Update global trace metrics
  if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
    (window as any).__forensic_trace.totalContours += contours.length;
  }

  const endTime = performance.now();
  console.log(`%c[FORENSIC EXIT] traceContours`, "color: #0284c7; font-weight: bold;");
  console.log(`Total contours found & stored: ${contours.length}`);
  console.log(`Time elapsed: ${(endTime - startTime).toFixed(2)}ms`);

  return contours;
}

// Letter classification for high-quality font alignment
export function getGlyphAlignment(char: string): {
  type: string;
  yMin: number; // Baseline-relative bottom boundary (TTF units)
  yMax: number; // Baseline-relative top boundary (TTF units)
} {
  // 1. Прописные (Большие) с верхними выносными элементами (диакритика)
  const capAscenders = 'ЙЁ';
  // 2. Прописные (Большие) с нижними выносными элементами (хвостики)
  const capDescenders = 'ДЦЩ';
  // 3. Прописные (Большие) стандартные
  const caps = 'АБВГЕЖЗИКЛМНОПРСТУФХЧШЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  // 4. Строчные (Маленькие) с верхними выносными элементами (хвостик б, диакритика ё, й)
  const lowerAscenders = 'бёйbdfhklit';
  // 5. Строчные (Маленькие) с нижними выносными элементами
  const lowerDescenders = 'дцущрфgjpqy';
  // 6. Строчные стандартные
  const lowers = 'авгежзиклмнопстхчшъыьэюяacemnorsuvwxz';
  // Знаки препинания
  const punctuation = '.,-+=_!?;()[]{}<>:;\\\'"';

  if (capAscenders.includes(char)) {
    return { type: 'cap_ascender', yMin: 0, yMax: 9200 };
  } else if (capDescenders.includes(char)) {
    return { type: 'cap_descender', yMin: -2800, yMax: 8200 };
  } else if (caps.includes(char)) {
    return { type: 'cap', yMin: 0, yMax: 8200 };
  } else if (lowerAscenders.includes(char)) {
    return { type: 'lower_ascender', yMin: 0, yMax: 8200 };
  } else if (lowerDescenders.includes(char)) {
    return { type: 'lower_descender', yMin: -2800, yMax: 5500 };
  } else if (lowers.includes(char)) {
    return { type: 'lower', yMin: 0, yMax: 5500 };
  } else if (punctuation.includes(char)) {
    if (char === '.' || char === ',') {
      return { type: 'punctuation', yMin: 0, yMax: 2000 };
    }
    return { type: 'punctuation', yMin: 0, yMax: 8200 };
  } else {
    // Default fallback
    return { type: 'standard', yMin: 0, yMax: 5500 };
  }
}

function getSignedArea(polygon: Point[]): number {
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}

function isPointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  const x = p.x, y = p.y;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function smoothContour(points: Point[]): Point[] {
  if (points.length < 5) return points;
  const smoothed: Point[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev2 = points[(i - 2 + n) % n];
    const prev1 = points[(i - 1 + n) % n];
    const curr = points[i];
    const next1 = points[(i + 1) % n];
    const next2 = points[(i + 2) % n];

    // Premium calligraphic binomial 5-tap filter: weight kernel [1, 4, 6, 4, 1] / 16
    smoothed.push({
      x: (prev2.x + prev1.x * 4 + curr.x * 6 + next1.x * 4 + next2.x) / 16,
      y: (prev2.y + prev1.y * 4 + curr.y * 6 + next1.y * 4 + next2.y) / 16
    });
  }
  return smoothed;
}

// Rigid Unicode Range Validation for target characters
export function isValidCharacterUnicode(char: string): boolean {
  if (!char) return false;
  const firstCode = char.codePointAt(0);
  if (firstCode === undefined) return false;

  // 1. Primary Allowed Unicode Ranges
  const isBasicLatin = firstCode >= 0x0020 && firstCode <= 0x007F;
  const isLatin1Supp = firstCode >= 0x00A0 && firstCode <= 0x00FF;
  const isLatinExtA = firstCode >= 0x0100 && firstCode <= 0x017F;
  const isLatinExtB = firstCode >= 0x0180 && firstCode <= 0x024F;
  const isCyrillic = firstCode >= 0x0400 && firstCode <= 0x04FF;
  const isCyrillicSupp = firstCode >= 0x0500 && firstCode <= 0x052F;

  // 2. Safe Punctuation (General Punctuation range: 0x2000 - 0x206F)
  // Only allow safe standard printable punctuation marks
  const isSafePunctuation = firstCode >= 0x2000 && firstCode <= 0x206F && (
    firstCode === 0x2013 || // en dash
    firstCode === 0x2014 || // em dash
    firstCode === 0x2018 || // left single quote
    firstCode === 0x2019 || // right single quote
    firstCode === 0x201C || // left double quote
    firstCode === 0x201D || // right double quote
    firstCode === 0x2026    // ellipsis
  );

  // 3. Complete exclusion of banned Unicode sections
  // Box Drawing (0x2500 - 0x257F)
  // Block Elements (0x2580 - 0x259F)
  // Geometric Shapes (0x25A0 - 0x25FF)
  // Dingbats (0x2700 - 0x27BF)
  // Arrows (0x2190 - 0x21FF)
  // Miscellaneous Symbols (0x2600 - 0x26FF)
  // Mathematical Operators (0x2200 - 0x22FF)
  // Miscellaneous Technical (0x2300 - 0x23FF)
  // Braille Patterns (0x2800 - 0x28FF)
  // Enclosed Alphanumerics (0x2460 - 0x24FF)
  // Control Characters (0x0000 - 0x001F, 0x007F - 0x009F)
  // Combining Diacritical Marks (0x0300 - 0x036F)
  // Variation Selectors (0xFE00 - 0xFE0F)
  // Standard PUA (0xE000 - 0xF8FF)
  // Replacement Character (0xFFFD)
  
  if (firstCode < 0x0020) return false; // Control code
  if (firstCode >= 0x007F && firstCode <= 0x009F) return false; // Control code
  if (firstCode >= 0x0300 && firstCode <= 0x036F) return false; // Combining
  if (firstCode >= 0x2190 && firstCode <= 0x21FF) return false; // Arrows
  if (firstCode >= 0x2200 && firstCode <= 0x22FF) return false; // Math Operators
  if (firstCode >= 0x2300 && firstCode <= 0x23FF) return false; // Technical
  if (firstCode >= 0x2460 && firstCode <= 0x24FF) return false; // Enclosed
  if (firstCode >= 0x2500 && firstCode <= 0x257F) return false; // Box Drawing
  if (firstCode >= 0x2580 && firstCode <= 0x259F) return false; // Block Elements
  if (firstCode >= 0x25A0 && firstCode <= 0x25FF) return false; // Geometric Shapes
  if (firstCode >= 0x2600 && firstCode <= 0x26FF) return false; // Misc Symbols
  if (firstCode >= 0x2700 && firstCode <= 0x27BF) return false; // Dingbats
  if (firstCode >= 0x2800 && firstCode <= 0x28FF) return false; // Braille
  if (firstCode >= 0xE000 && firstCode <= 0xF8FF) return false; // PUA
  if (firstCode >= 0xFE00 && firstCode <= 0xFE0F) return false; // Var Selectors
  if (firstCode === 0xFFFD) return false; // Replacement Character

  return isBasicLatin || isLatin1Supp || isLatinExtA || isLatinExtB || isCyrillic || isCyrillicSupp || isSafePunctuation;
}

// Banned Glyph Name detection
export function isBannedGlyphName(name: string): boolean {
  const lowercase = name.toLowerCase();
  const bannedKeywords = [
    'box', 'block', 'line', 'border', 'shade', 'frame', 'geometric',
    'drawing', 'technical', 'separator', 'rule', 'bar', 'pipe',
    'pseudographic', '.notdef', 'null', 'replacement', 'fallback', 'tofu'
  ];
  return bannedKeywords.some(keyword => lowercase.includes(keyword));
}

// Advanced handwriting shape vs mechanical line / box-drawing / boundary leak verification
export function isLikelyTableLineOrBoxSymbol(
  contour: Point[],
  imgWidth: number,
  imgHeight: number,
  char: string,
  destX?: number,
  destY?: number,
  destW?: number,
  destH?: number
): boolean {
  const globalId = (contour as any).globalId || "Contour #Unassigned";
  console.log(`%c[FORENSIC ENTER] isLikelyTableLineOrBoxSymbol: checking ${globalId} for glyph '${char}'`, "color: #0d9488");
  console.log(`Contour point count: ${contour.length}, canvas dimensions: ${imgWidth}x${imgHeight}`);

  const finishLogAndReturn = (isTableLine: boolean, reason: string) => {
    console.log(`Result for ${globalId}: ${isTableLine ? "REJECTED (TableLine/Box)" : "APPROVED (Handwriting)"}`);
    console.log(`Reason: ${reason}`);
    console.log(`%c[FORENSIC EXIT] isLikelyTableLineOrBoxSymbol: finished checking ${globalId}`, "color: #0d9488");
    if (isTableLine) {
      (contour as any).filterReason = reason;
      (contour as any).isFiltered = true;
      if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
        (window as any).__forensic_trace.totalRejectedContours++;
      }
    }
    return isTableLine;
  };

  if (contour.length < 5) {
    return finishLogAndReturn(true, "point count < 5 (Too short to be a valid brushstroke)");
  }

  let cMinX = Infinity, cMinY = Infinity;
  let cMaxX = -Infinity, cMaxY = -Infinity;
  for (const p of contour) {
    if (p.x < cMinX) cMinX = p.x;
    if (p.y < cMinY) cMinY = p.y;
    if (p.x > cMaxX) cMaxX = p.x;
    if (p.y > cMaxY) cMaxY = p.y;
  }

  const w = cMaxX - cMinX;
  const h = cMaxY - cMinY;
  console.log(`Contour bounds: x: [${cMinX}, ${cMaxX}] | y: [${cMinY}, ${cMaxY}] (w: ${w}, h: ${h})`);

  // 1. Extreme Speckles / Dust / Noise filter
  const speckleLimitW = imgWidth * 0.015;
  const speckleLimitH = imgHeight * 0.015;
  if (w <= speckleLimitW && h <= speckleLimitH) {
    return finishLogAndReturn(true, `Extreme speckle/noise (w: ${w} <= ${speckleLimitW.toFixed(1)}, h: ${h} <= ${speckleLimitH.toFixed(1)})`);
  }

  // 2. Outermost boundary frames (entire grid cell layout frame leaks)
  const cellLimitW = imgWidth * 0.88;
  const cellLimitH = imgHeight * 0.88;
  if (w > cellLimitW || h > cellLimitH) {
    return finishLogAndReturn(true, `Outermost cell border leak (w: ${w} > ${cellLimitW.toFixed(1)} or h: ${h} > ${cellLimitH.toFixed(1)})`);
  }

  const cellBoxW = destW !== undefined ? destW : imgWidth;
  const cellBoxH = destH !== undefined ? destH : imgHeight;

  if (w > cellBoxW * 0.88 || h > cellBoxH * 0.88) {
    return finishLogAndReturn(true, `Outermost sub-cell border leak (w: ${w} > ${(cellBoxW * 0.88).toFixed(1)} or h: ${h} > ${(cellBoxH * 0.88).toFixed(1)})`);
  }

  const activeLeft = destX !== undefined ? destX : Math.round(imgWidth * 0.095);
  const activeTop = destY !== undefined ? destY : Math.round(imgHeight * 0.095);
  const activeRight = (destX !== undefined && destW !== undefined) ? (destX + destW) : (imgWidth - Math.round(imgWidth * 0.095));
  const activeBottom = (destY !== undefined && destH !== undefined) ? (destY + destH) : (imgHeight - Math.round(imgHeight * 0.095));

  // 3. Margin Rejections: Discard standalone contours lying completely within extreme outer margin edges
  if (cMaxX < activeLeft + cellBoxW * 0.01) {
    return finishLogAndReturn(true, `Left margin boundary leak (cMaxX: ${cMaxX} < ${activeLeft + cellBoxW * 0.01})`);
  }
  if (cMinX > activeRight - cellBoxW * 0.01) {
    return finishLogAndReturn(true, `Right margin boundary leak (cMinX: ${cMinX} > ${activeRight - cellBoxW * 0.01})`);
  }
  if (cMinY > activeBottom - cellBoxH * 0.01) {
    return finishLogAndReturn(true, `Bottom margin boundary leak (cMinY: ${cMinY} > ${activeBottom - cellBoxH * 0.01})`);
  }
  if (cMaxY < activeTop + cellBoxH * 0.01) {
    const isCloseToLeft = cMinX < activeLeft + cellBoxW * 0.01;
    const isCloseToRight = cMaxX > activeRight - cellBoxW * 0.01;
    const isVeryWideAndThin = w > cellBoxW * 0.01 && h < cellBoxH * 0.01;
    if (isCloseToLeft || isCloseToRight || isVeryWideAndThin) {
      return finishLogAndReturn(true, `Top margin boundary leak combo (isCloseToLeft: ${isCloseToLeft}, isCloseToRight: ${isCloseToRight}, isVeryWideAndThin: ${isVeryWideAndThin})`);
    }
  }

  // 4. Printed label characters in the top-left cell corner (e.g., "А", "Б" printed hints)
  const isTopLeftLabel = cMaxX < activeLeft + cellBoxW * 0.29 && 
                         cMaxY < activeTop + cellBoxH * 0.27 && 
                         w < cellBoxW * 0.16 && 
                         h < cellBoxH * 0.16;
  if (isTopLeftLabel) {
    return finishLogAndReturn(true, `isTopLeftLabel: hits top-left reference digit/hint zone`);
  }

  // 5. Extreme Aspect Ratio Check
  const aspectH = w / (h || 1);
  const aspectV = h / (w || 1);
  if (aspectH > 14.0 && w > cellBoxW * 0.25) {
    return finishLogAndReturn(true, `Extreme horizontal aspect ratio (aspectH: ${aspectH.toFixed(2)} > 14.0)`);
  }
  if (aspectV > 14.0 && h > cellBoxH * 0.25) {
    return finishLogAndReturn(true, `Extreme vertical aspect ratio (aspectV: ${aspectV.toFixed(2)} > 14.0)`);
  }

  // 6. Mechanical Line / Axis-Aligned Grid analysis
  const simplified = simplifyContour(contour, 1.5);
  if (simplified.length < 3) {
    return finishLogAndReturn(true, `Straight line contour with zero area (simplified length: ${simplified.length} < 3)`);
  }

  let totalLength = 0;
  let axisAlignedLength = 0;

  for (let i = 0; i < simplified.length; i++) {
    const p1 = simplified[i];
    const p2 = simplified[(i + 1) % simplified.length];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;

    totalLength += len;

    const angleRad = Math.abs(Math.atan2(dy, dx));
    const angleDeg = (angleRad * 180) / Math.PI;

    const isHorizontal = angleDeg < 6 || Math.abs(angleDeg - 180) < 6;
    const isVertical = Math.abs(angleDeg - 90) < 6;

    if (isHorizontal || isVertical) {
      axisAlignedLength += len;
    }
  }

  if (totalLength > 0) {
    const axisRatio = axisAlignedLength / totalLength;
    console.log(`Axis aligned mechanical segments ratio for ${globalId}: ${axisRatio.toFixed(2)} (totalLen: ${totalLength.toFixed(1)}px, axisLen: ${axisAlignedLength.toFixed(1)}px)`);
    const looksLikeGridOrCorner = (axisRatio >= 0.85);
    
    if (looksLikeGridOrCorner && totalLength > 100) {
      const nearBorderX = cMinX < activeLeft + cellBoxW * 0.26 || cMaxX > activeRight - cellBoxW * 0.26;
      const nearBorderY = cMinY < activeTop + cellBoxH * 0.26 || cMaxY > activeBottom - cellBoxH * 0.26;
      if (nearBorderX || nearBorderY) {
        return finishLogAndReturn(true, `Highly axis-aligned near boundary, looks like grid corner/rule (axis-aligned ratio: ${axisRatio.toFixed(2)})`);
      }
    }
  }

  // 7. Hard-coded segment length constraints
  const isTooLongAndStraight = (w > cellBoxW * 0.40 && h < cellBoxH * 0.08) ||
                               (h > cellBoxH * 0.40 && w < cellBoxW * 0.08);
  if (isTooLongAndStraight) {
    return finishLogAndReturn(true, `Long straight border-like shape (isTooLongAndStraight check matched)`);
  }

  // 8. Specialized margin line filter checks
  const isThinVertical = w <= cellBoxW * 0.085 && h >= cellBoxH * 0.10;
  if (isThinVertical) {
    const isYCase = (char === 'ы' || char === 'Ы');
    const leftBoundary = activeLeft + cellBoxW * 0.28;
    const rightBoundary = activeRight - cellBoxW * (isYCase ? 0.14 : 0.28);
    const cX = (cMinX + cMaxX) / 2;
    if (cX < leftBoundary || cX > rightBoundary) {
      return finishLogAndReturn(true, `Thin vertical margin line leak (cX: ${cX.toFixed(1)} lies outside of safe boundaries)`);
    }
  }

  const isThinHorizontal = h <= cellBoxH * 0.085 && w >= cellBoxW * 0.10;
  if (isThinHorizontal) {
    const topAccented = (char === 'Й' || char === 'й' || char === 'ё' || char === 'Ё');
    const topBoundary = activeTop + cellBoxH * (topAccented ? 0.15 : 0.28);
    const bottomBoundary = activeBottom - cellBoxH * 0.28;
    const cY = (cMinY + cMaxY) / 2;
    if (cY < topBoundary || cY > bottomBoundary) {
      return finishLogAndReturn(true, `Thin horizontal margin line leak (cY: ${cY.toFixed(1)} lies outside of safe boundaries)`);
    }
  }

  // 9. Extra Geometric Shape Filter (reject perfect empty square/rectangle contours which represent box drawing elements)
  if (simplified.length === 4 || simplified.length === 5) {
    const area = Math.abs(getSignedArea(contour));
    const bboxArea = w * h;
    const fillRatio = area / (bboxArea || 1);
    
    if (fillRatio > 0.95 && totalLength > 120) {
      return finishLogAndReturn(true, `Perfect rectangle box drawing leak (fillRatio: ${fillRatio.toFixed(2)} > 0.95)`);
    }
  }

  // 10. Center stencil character hint leak check
  const cCenterX = (cMinX + cMaxX) / 2;
  const cCenterY = (cMinY + cMaxY) / 2;
  const cellCenterX = activeLeft + cellBoxW / 2;
  const cellCenterY = activeTop + cellBoxH / 2;

  const isCentered = Math.abs(cCenterX - cellCenterX) < cellBoxW * 0.15 &&
                     Math.abs(cCenterY - cellCenterY) < cellBoxH * 0.15;
  
  const isStencilSize = w > cellBoxW * 0.05 && w < cellBoxW * 0.28 &&
                        h > cellBoxH * 0.05 && h < cellBoxH * 0.28;

  if (isCentered && isStencilSize) {
    const area = Math.abs(getSignedArea(contour));
    const bboxArea = w * h;
    const polygonRatio = area / (bboxArea || 1);
    
    if (polygonRatio < 0.25 || area < 400) {
      return finishLogAndReturn(true, `Center stencil backdrop text hint leak (centered, stencil-sized and low density ratio: ${polygonRatio.toFixed(2)})`);
    }
  }

  return finishLogAndReturn(false, "Validated as genuine handwriting brushstroke!");
}

export function buildGlyphContours(
  contours: Point[][],
  imgWidth: number,
  imgHeight: number,
  char: string,
  destX?: number,
  destY?: number,
  destW?: number,
  destH?: number
): Point[][] {
  console.log(`%c[FORENSIC ENTER] buildGlyphContours for character '${char}'`, "color: #4f46e5; font-weight: bold;");
  const unicodeVal = char.codePointAt(0);
  console.log(`Unicode: ${unicodeVal} (0x${unicodeVal?.toString(16)})`);

  // Log all contour IDs that we are processing in this glyph
  const contourIds = contours.map(c => (c as any).globalId || "Unassigned");
  console.log(`Source contour IDs inside cell: ${JSON.stringify(contourIds)}`);

  // Pre-calculate filter results for each contour
  const isLikelyBox = contours.map(contour => isLikelyTableLineOrBoxSymbol(
    contour,
    imgWidth,
    imgHeight,
    char,
    destX,
    destY,
    destW,
    destH
  ));

  // STRICT LAYER SEPARATION: Isolate handwriting contours only (Layer 3)
  const filteredContours = contours.filter((contour, i) => {
    const cid = (contour as any).globalId || `Contour #${i}`;
    let keepResult = false;
    let keepReason = "";

    if (!isLikelyBox[i]) {
      keepResult = true;
      keepReason = "Not classified as table/border line or noise";
    } else {
      // If it WAS detected as a box/line, but it's an inner hole of a VALID contour, we keep it!
      for (let j = 0; j < contours.length; j++) {
        if (i !== j && !isLikelyBox[j]) {
          if (isPointInPolygon(contour[0], contours[j])) {
            keepResult = true;
            keepReason = `Classified as box/line but saved because it represents an inner hole within valid contour ${(contours[j] as any).globalId}`;
            break;
          }
        }
      }
    }

    if (keepResult) {
      console.log(`  Keeping contour ${cid}: ${keepReason}`);
      (contour as any).assignedGlyph = char;
      (contour as any).unicodeCode = unicodeVal;
    } else {
      console.log(`  Filtering out contour ${cid}: Classified as trash/leak`);
      (contour as any).isFiltered = true;
    }
    return keepResult;
  });

  console.log(`Survived contours count: ${filteredContours.length} of ${contours.length}`);
  console.log(`%c[FORENSIC EXIT] buildGlyphContours for character '${char}'`, "color: #4f46e5; font-weight: bold;");
  return filteredContours;
}

// Bezier-aware bounding box calculations for exact path extreme limits
export function computeBezierAwareBounds(
  paths: PathCommand[][],
  strokeWeightPadding = 120
): { xMin: number; yMin: number; xMax: number; yMax: number } {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  const updateBounds = (x: number, y: number) => {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  };

  for (const subpath of paths) {
    let currX = 0;
    let currY = 0;

    for (const cmd of subpath) {
      if (cmd.type === 'M' || cmd.type === 'L') {
        currX = cmd.x!;
        currY = cmd.y!;
        updateBounds(currX, currY);
      } else if (cmd.type === 'Q') {
        const p0x = currX;
        const p0y = currY;
        const p1x = cmd.x1!;
        const p1y = cmd.y1!;
        const p2x = cmd.x!;
        const p2y = cmd.y!;

        updateBounds(p0x, p0y);
        updateBounds(p2x, p2y);

        // Extrema of quadratic Bezier curve
        const denomX = p0x - 2 * p1x + p2x;
        if (Math.abs(denomX) > 1e-6) {
          const t = (p0x - p1x) / denomX;
          if (t > 0 && t < 1) {
            const val = (1 - t) * (1 - t) * p0x + 2 * t * (1 - t) * p1x + t * t * p2x;
            if (val < xMin) xMin = val;
            if (val > xMax) xMax = val;
          }
        }

        const denomY = p0y - 2 * p1y + p2y;
        if (Math.abs(denomY) > 1e-6) {
          const t = (p0y - p1y) / denomY;
          if (t > 0 && t < 1) {
            const val = (1 - t) * (1 - t) * p0y + 2 * t * (1 - t) * p1y + t * t * p2y;
            if (val < yMin) yMin = val;
            if (val > yMax) yMax = val;
          }
        }

        currX = p2x;
        currY = p2y;
      }
    }
  }

  if (xMin === Infinity) {
    return { xMin: 0, yMin: 0, xMax: 1000, yMax: 1000 };
  }

  return {
    xMin: xMin - strokeWeightPadding,
    yMin: yMin - strokeWeightPadding,
    xMax: xMax + strokeWeightPadding,
    yMax: yMax + strokeWeightPadding
  };
}

// Converts pixel contour points to stylized opentype.js Path operations
export function createFontPaths(
  contours: Point[][],
  imgWidth: number,
  imgHeight: number,
  char: string,
  destX?: number,
  destY?: number,
  destW?: number,
  destH?: number
): { paths: PathCommand[][]; advanceWidth: number } {
  console.log(`%c[FORENSIC ENTER] createFontPaths for character '${char}'`, "color: #4f46e5; font-weight: bold;");
  console.log(`Input contour count: ${contours.length}`);

  // Prevent extraction of banned/unicode characters
  if (!isValidCharacterUnicode(char)) {
    console.warn(`%c[FORENSIC EXIT] createFontPaths: character '${char}' is outside of valid/allowed unicode ranges`, "color: #b45309;");
    return { paths: [], advanceWidth: 5734 };
  }

  // STRICT LAYER SEPARATION: Isolate handwriting contours only (Layer 3)
  const filteredContours = buildGlyphContours(
    contours,
    imgWidth,
    imgHeight,
    char,
    destX,
    destY,
    destW,
    destH
  );

  if (filteredContours.length === 0) {
    // Return empty space with default width
    console.log(`%c[FORENSIC EXIT] createFontPaths: zero filtered contours survive for '${char}'. Space glyph produced.`, "color: #4f46e5;");
    return { paths: [], advanceWidth: 5734 };
  }

  // 1. Determine cell canvas metrics dynamically
  const cellBoxX = destX !== undefined ? destX : 0;
  const cellBoxY = destY !== undefined ? destY : 0;
  const cellBoxW = destW !== undefined ? destW : imgWidth;
  const cellBoxH = destH !== undefined ? destH : imgHeight;

  // Baseline position at exactly 85% of cellBoxH
  const cellBaselineY = cellBoxY + cellBoxH * 0.85;

  // 2. Compute tight pixel-level boundaries & Centroid (Center of Mass)
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  let sumX = 0;
  let sumY = 0;
  let totalPts = 0;

  for (const contour of filteredContours) {
    for (const p of contour) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
      totalPts++;
    }
  }

  const centroidX = totalPts > 0 ? (sumX / totalPts) : (minX + maxX) / 2;
  const centroidY = totalPts > 0 ? (sumY / totalPts) : (minY + maxY) / 2;

  let boxW = (maxX - minX) > 0 ? (maxX - minX) : 1;
  let boxH = (maxY - minY) > 0 ? (maxY - minY) : 1;

  // 3. Setup uniform scaling and baseline factors
  const align = getGlyphAlignment(char);

  // Безопасные отступы: +15% к координатам границ для букв с выносными элементами (хвостами сверху/снизу)
  if (align.type.includes('ascender') || align.type.includes('descender')) {
    const padY = boxH * 0.15;
    const padX = boxW * 0.15;
    minY -= padY;
    maxY += padY;
    minX -= padX;
    maxX += padX;
    boxH = (maxY - minY) > 0 ? (maxY - minY) : 1;
    boxW = (maxX - minX) > 0 ? (maxX - minX) : 1;
  }

  const targetHeight = align.yMax - align.yMin;

  // Uniform aspect-ratio Auto-Fit
  const renderRatio = 0.85; // exactly 85% height to preserve safety margins
  let scale = (targetHeight * renderRatio) / boxH;

  const maxAllowedWidth = 14000;
  if (boxW * scale > maxAllowedWidth) {
    scale = maxAllowedWidth / boxW;
  }

  // 4. Optical horizontal and vertical centering
  const sidebearing = 820;
  let advanceWidth = Math.max(3200, Math.round(boxW * scale + sidebearing * 2));

  const opticalCenterX_px = (minX + maxX) / 2;
  const opticalCenterY_px = 0.75 * centroidY + 0.25 * ((minY + maxY) / 2);

  const targetCenterY = align.yMin + targetHeight / 2;

  let finalScale = scale;
  let finalShiftX = (advanceWidth / 2) - opticalCenterX_px * finalScale;
  let finalShiftY = targetCenterY + opticalCenterY_px * finalScale;

  // 5. Automated Validation Pass (Checks for clipping and border collisions)
  let isFitValidated = false;
  let fitPass = 0;
  const maxFitPasses = 5;

  while (!isFitValidated && fitPass < maxFitPasses) {
    fitPass++;

    // Calculate extreme projection coordinates in font space
    const yTopTtf = finalShiftY - minY * finalScale;
    const yBottomTtf = finalShiftY - maxY * finalScale;
    const xLeftTtf = finalShiftX + minX * finalScale;
    const xRightTtf = finalShiftX + maxX * finalScale;

    // Validation boundary check with integrated safe buffer (400 font units)
    const topCollision = yTopTtf > (align.yMax - 400);
    const bottomCollision = yBottomTtf < (align.yMin + 400);
    const leftCollision = xLeftTtf < 200;
    const rightCollision = xRightTtf > (advanceWidth - 200);

    if (topCollision || bottomCollision || leftCollision || rightCollision) {
      // Scale down uniformly to fit inside the safe region, and adjust projection
      finalScale *= 0.90;
      advanceWidth = Math.max(3200, Math.round(boxW * finalScale + sidebearing * 2));
      finalShiftX = (advanceWidth / 2) - opticalCenterX_px * finalScale;
      finalShiftY = targetCenterY + opticalCenterY_px * finalScale;
    } else {
      isFitValidated = true;
    }
  }

  // 6. Project and smooth all points using our validated fit parameters
  const transformedContours: Point[][] = [];
  for (const contour of filteredContours) {
    let smoothed = contour;
    // Применяем 12 проходов сглаживания (фильтр Безье/Гаусса), чтобы полностью устранить пиксельную лесенку
    // и создать идеально плавный шлейф эффекта настоящей чернильной ручки.
    for (let k = 0; k < 12; k++) {
      smoothed = smoothContour(smoothed);
    }
    // Увеличиваем epsilon до 2.0. Это устраняет зернистость алгоритма Рамера-Дугласа-Пекера (RDP), 
    // убирая сверхмалые изломы и вписывая длинные участки в идеальные полиномиальные кривые Безье.
    const simplified = simplifyContour(smoothed, 2.0); 
    if (simplified.length < 3) continue;

    const ptsInTtf: Point[] = [];
    for (let i = 0; i < simplified.length; i++) {
      const pt = simplified[i];
      const targetTxtX = finalShiftX + pt.x * finalScale;
      const targetTxtY = finalShiftY - pt.y * finalScale;
      ptsInTtf.push({ x: targetTxtX, y: targetTxtY });
    }
    transformedContours.push(ptsInTtf);
  }

  // 7. Correct contour winding directions to guarantee correct rendering of holes (even-odd rule)
  const correctedContours: Point[][] = [];
  for (let i = 0; i < transformedContours.length; i++) {
    const poly = transformedContours[i];
    
    let depth = 0;
    for (let j = 0; j < transformedContours.length; j++) {
      if (i !== j) {
        if (isPointInPolygon(poly[0], transformedContours[j])) {
          depth++;
        }
      }
    }

    const area = getSignedArea(poly);
    const shouldBeClockwise = (depth % 2 === 0);
    const currentlyClockwise = (area < 0);

    if (shouldBeClockwise !== currentlyClockwise) {
      poly.reverse();
    }
    correctedContours.push(poly);
  }

  // 8. Convert to PathCommand structures with 3-decimal precision
  const resultPaths: PathCommand[][] = [];
  for (const poly of correctedContours) {
    const cmdList: PathCommand[] = [];
    if (poly.length >= 3) {
      const first = poly[0];
      const second = poly[1];
      const startX = Number(((first.x + second.x) / 2).toFixed(3));
      const startY = Number(((first.y + second.y) / 2).toFixed(3));
      
      cmdList.push({ type: 'M', x: startX, y: startY });
      
      for (let i = 1; i < poly.length; i++) {
        const pCurrent = poly[i];
        const pNext = poly[(i + 1) % poly.length];
        
        const midX = Number(((pCurrent.x + pNext.x) / 2).toFixed(3));
        const midY = Number(((pCurrent.y + pNext.y) / 2).toFixed(3));
        
        cmdList.push({
          type: 'Q',
          x1: Number(pCurrent.x.toFixed(3)),
          y1: Number(pCurrent.y.toFixed(3)),
          x: midX,
          y: midY
        });
      }
    } else {
      for (let i = 0; i < poly.length; i++) {
        const pt = poly[i];
        if (i === 0) {
          cmdList.push({ type: 'M', x: Number(pt.x.toFixed(3)), y: Number(pt.y.toFixed(3)) });
        } else {
          cmdList.push({ type: 'L', x: Number(pt.x.toFixed(3)), y: Number(pt.y.toFixed(3)) });
        }
      }
    }
    cmdList.push({ type: 'Z' });
    resultPaths.push(cmdList);
  }

  // Run a final secondary Bezier validation to guarantee no overshoot clippings
  const bezierBounds = computeBezierAwareBounds(resultPaths, 0);
  const outOfTop = bezierBounds.yMax > align.yMax;
  const outOfBottom = bezierBounds.yMin < align.yMin;

  let finalPathsToReturn = resultPaths;
  if (outOfTop || outOfBottom) {
    // If curves overshot slightly, scale down one final time and re-project
    const shrinkFactor = 0.92;
    finalPathsToReturn = resultPaths.map(subpath => subpath.map(cmd => {
      const copy = { ...cmd };
      if (copy.x !== undefined) copy.x = Number((half(advanceWidth) + (copy.x - half(advanceWidth)) * shrinkFactor).toFixed(3));
      if (copy.y !== undefined) copy.y = Number((targetCenterY + (copy.y - targetCenterY) * shrinkFactor).toFixed(3));
      if (copy.x1 !== undefined) copy.x1 = Number((half(advanceWidth) + (copy.x1 - half(advanceWidth)) * shrinkFactor).toFixed(3));
      if (copy.y1 !== undefined) copy.y1 = Number((targetCenterY + (copy.y1 - targetCenterY) * shrinkFactor).toFixed(3));
      return copy;
    }));
  }

  const finalBbox = computeBezierAwareBounds(finalPathsToReturn, 0);
  console.log(`%c[FORENSIC EXIT] createFontPaths for character '${char}'`, "color: #4f46e5; font-weight: bold;");
  console.log(`  Glyph Character: '${char}'`);
  console.log(`  Unicode: ${char.codePointAt(0)} (0x${char.codePointAt(0)?.toString(16)})`);
  console.log(`  Traced contour IDs: ${JSON.stringify(contours.map(c => (c as any).globalId || "Unassigned"))}`);
  console.log(`  Filtered (surviving) contour IDs: ${JSON.stringify(filteredContours.map(c => (c as any).globalId))}`);
  console.log(`  Advance Width: ${advanceWidth}`);
  console.log(`  Final font coords bounding box:`, JSON.stringify(finalBbox));

  if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
    (window as any).__forensic_trace.totalGlyphs++;
  }

  return { paths: finalPathsToReturn, advanceWidth };
}

function half(val: number) {
  return val / 2;
}
