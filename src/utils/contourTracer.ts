import { Point, DeskewCorners, PathCommand } from '../types';

// Bilinear quad warping: maps normal [0, 1] x [0, 1] back to source image space via 4 corners
export function warpImage(
  sourceCanvas: HTMLCanvasElement,
  corners: DeskewCorners,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  const targetCtx = targetCanvas.getContext('2d');
  
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!targetCtx || !sourceCtx) return targetCanvas;

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
  return targetCanvas;
}

// Binarize a localized canvas and return a 2D boolean array (true = black/ink, false = white/bg)
export function getBinaryGrid(
  canvas: HTMLCanvasElement,
  threshold: number,
  clearMargins = false
): { data: boolean[][]; width: number; height: number } {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  if (!ctx) {
    return { data: Array(height).fill(null).map(() => Array(width).fill(false)), width, height };
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Robust outer margin clearing (12.5%) to completely delete physical table grid borders
  // This leaves the interior of the cell fully intact and pristine
  const clearTop = Math.round(height * 0.125);
  const clearBottom = Math.round(height * 0.125);
  const clearLeft = Math.round(width * 0.125);
  const clearRight = Math.round(width * 0.125);

  // 2D grid
  const grid: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Greyscale calculation
      const ref = 0.299 * r + 0.587 * g + 0.114 * b;
      
      const isNearBorder = clearMargins && (
        y < clearTop ||
        y >= height - clearBottom ||
        x < clearLeft ||
        x >= width - clearRight
      );

      // White/transparent is background, dark is ink
      const isInk = !isNearBorder && a > 50 && ref < threshold;
      row.push(isInk);
    }
    grid.push(row);
  }

  return { data: grid, width, height };
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

// Moore-Neighbor Contour Tracing algorithm
export function traceContours(grid: boolean[][], width: number, height: number): Point[][] {
  const visited = Array(height).fill(null).map(() => Array(width).fill(false));
  const contours: Point[][] = [];

  // Moore 8-neighbors navigation index
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Find an unvisited black pixel that represents a boundary
      if (grid[y][x] && !visited[y][x]) {
        // Simple check to make sure it's an edge pixel of some shape
        let hasWhiteNeighbor = false;
        for (let i = 0; i < 8; i++) {
          if (!grid[y + dy[i]][x + dx[i]]) {
            hasWhiteNeighbor = true;
            break;
          }
        }

        if (hasWhiteNeighbor) {
          const contour = traceSingleContour(grid, x, y, visited, dx, dy, width, height);
          if (contour.length > 4) {
            contours.push(contour);
          }
        }
      }
    }
  }

  return contours;
}

function traceSingleContour(
  grid: boolean[][],
  startX: number,
  startY: number,
  visited: boolean[][],
  dx: number[],
  dy: number[],
  width: number,
  height: number
): Point[] {
  const contour: Point[] = [];
  let cx = startX;
  let cy = startY;

  // Let's find the initial entry direction from a white neighbor
  let dir = 0; // Starts from North (0)
  for (let i = 0; i < 8; i++) {
    const nx = cx + dx[i];
    const ny = cy + dy[i];
    if (nx >= 0 && nx < width && ny >= 0 && ny < height && !grid[ny][nx]) {
      dir = i;
      break;
    }
  }

  let backtrackCount = 0;
  const maxSteps = width * height * 2; // Safeguard

  do {
    visited[cy][cx] = true;
    contour.push({ x: cx, y: cy });

    // Look around using Moore neighborhood clockwise starting from the previous search point
    let found = false;
    // Enter search from direction of previous backtrack
    let searchIndex = (dir + 5) % 8; // standard backtrack step

    for (let i = 0; i < 8; i++) {
      const idx = (searchIndex + i) % 8;
      const nx = cx + dx[idx];
      const ny = cy + dy[idx];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (grid[ny][nx]) {
          cx = nx;
          cy = ny;
          dir = idx;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      break; // Single isolated pixel or loop finished
    }

    backtrackCount++;
    if (backtrackCount > maxSteps) {
      break; // Infinite safety loop check
    }

  } while (!(cx === startX && cy === startY));

  return contour;
}

// Letter classification for high-quality font alignment
export function getGlyphAlignment(char: string): {
  type: 'tall' | 'standard' | 'descender' | 'punctuation';
  yMin: number; // Baseline-relative bottom boundary (TTF units)
  yMax: number; // Baseline-relative top boundary (TTF units)
} {
  // Uppercase Cyrillic & Latin, digits, plus tall lowercase & brackets
  const tallChars = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789бďfghjklt()[]{}';
  // Lowercase Cyrillic with descenders: д, з, у, ф, р and Latin descenders: g, j, p, q, y
  const descenders = 'дзуфрgjpqyрp'; // Includes both Cyrillic and Latin versions
  // Small punctuation symbols
  const punctuation = '.,-+=_!?;()[]{}<>:;\'"';

  if (tallChars.includes(char)) {
    return { type: 'tall', yMin: 0, yMax: 9200 };
  } else if (descenders.includes(char)) {
    return { type: 'descender', yMin: -2800, yMax: 6200 };
  } else if (punctuation.includes(char)) {
    if (char === '.' || char === ',') {
      return { type: 'punctuation', yMin: 0, yMax: 2000 };
    }
    return { type: 'punctuation', yMin: 0, yMax: 6200 };
  } else {
    // Normal lowercase (а, в, г, е, ж, з, и, й, к, л, м, н, о, п, р, с, т, х, ц, ч, ш, щ, ъ, ы, ь, э, ю, я, etc.)
    return { type: 'standard', yMin: 0, yMax: 6200 };
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
  if (contour.length < 5) return true; // Too few points to represent a legitimate character shape

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

  // 1. Extreme Speckles / Dust / Noise filter
  if (w <= imgWidth * 0.015 && h <= imgHeight * 0.015) return true;

  // 2. Outermost boundary frames (entire grid cell layout frame leaks)
  if (w > imgWidth * 0.88 || h > imgHeight * 0.88) return true;

  const cellBoxW = destW !== undefined ? destW : imgWidth;
  const cellBoxH = destH !== undefined ? destH : imgHeight;

  if (w > cellBoxW * 0.88 || h > cellBoxH * 0.88) return true;

  const activeLeft = destX !== undefined ? destX : Math.round(imgWidth * 0.095);
  const activeTop = destY !== undefined ? destY : Math.round(imgHeight * 0.095);
  const activeRight = (destX !== undefined && destW !== undefined) ? (destX + destW) : (imgWidth - Math.round(imgWidth * 0.095));
  const activeBottom = (destY !== undefined && destH !== undefined) ? (destY + destH) : (imgHeight - Math.round(imgHeight * 0.095));

  // 3. Margin Rejections: Discard standalone contours lying completely within extreme outer margin edges (aligned with 1% border clearance)
  // Left border margin leak
  if (cMaxX < activeLeft + cellBoxW * 0.01) return true;
  // Right border margin leak
  if (cMinX > activeRight - cellBoxW * 0.01) return true;
  // Bottom border margin leak
  if (cMinY > activeBottom - cellBoxH * 0.01) return true;
  // Top border margin leak
  if (cMaxY < activeTop + cellBoxH * 0.01) {
    const isCloseToLeft = cMinX < activeLeft + cellBoxW * 0.01;
    const isCloseToRight = cMaxX > activeRight - cellBoxW * 0.01;
    const isVeryWideAndThin = w > cellBoxW * 0.01 && h < cellBoxH * 0.01;
    if (isCloseToLeft || isCloseToRight || isVeryWideAndThin) {
      return true;
    }
  }

  // 4. Printed label characters in the top-left cell corner (e.g., "А", "Б" printed hints)
  const isTopLeftLabel = cMaxX < activeLeft + cellBoxW * 0.26 && 
                         cMaxY < activeTop + cellBoxH * 0.24 && 
                         w < cellBoxW * 0.14 && 
                         h < cellBoxH * 0.14;
  if (isTopLeftLabel) return true;

  // 5. Extreme Aspect Ratio Check (typical for long horizontal/vertical line leaks)
  const aspectH = w / (h || 1);
  const aspectV = h / (w || 1);
  if (aspectH > 14.0 && w > cellBoxW * 0.25) return true; // Too flat line
  if (aspectV > 14.0 && h > cellBoxH * 0.25) return true; // Too vertical line

  // 6. Mechanical Line / Axis-Aligned Grid analysis
  // Check if segments are almost perfectly horizontal or vertical (which represents table grids, boxes, or lines)
  const simplified = simplifyContour(contour, 1.5);
  if (simplified.length < 3) return true; // Discard straight single-line contours with zero area

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

    // Perfectly horizontal (close to 0 or 180) or perfectly vertical (close to 90)
    const isHorizontal = angleDeg < 6 || Math.abs(angleDeg - 180) < 6;
    const isVertical = Math.abs(angleDeg - 90) < 6;

    if (isHorizontal || isVertical) {
      axisAlignedLength += len;
    }
  }

  if (totalLength > 0) {
    const axisRatio = axisAlignedLength / totalLength;
    
    // If segments are highly axis-aligned and a flat or corner-like shape:
    // Exclude if it has > 85% mechanical segments paired with rectilinear geometry
    const looksLikeGridOrCorner = (axisRatio >= 0.85);
    if (looksLikeGridOrCorner && totalLength > 100) {
      const nearBorderX = cMinX < activeLeft + cellBoxW * 0.26 || cMaxX > activeRight - cellBoxW * 0.26;
      const nearBorderY = cMinY < activeTop + cellBoxH * 0.26 || cMaxY > activeBottom - cellBoxH * 0.26;
      if (nearBorderX || nearBorderY) {
        return true; // Strongly indicates a leaked grid-line boundary or corner!
      }
    }
  }

  // 7. Hard-coded segment length constraints (long uninterrupted straight borders)
  const isTooLongAndStraight = (w > cellBoxW * 0.40 && h < cellBoxH * 0.08) ||
                               (h > cellBoxH * 0.40 && w < cellBoxW * 0.08);
  if (isTooLongAndStraight) return true;

  // 8. Specialized margin line filter checks
  const isThinVertical = w <= cellBoxW * 0.085 && h >= cellBoxH * 0.10;
  if (isThinVertical) {
    const isYCase = (char === 'ы' || char === 'Ы');
    const leftBoundary = activeLeft + cellBoxW * 0.28;
    const rightBoundary = activeRight - cellBoxW * (isYCase ? 0.14 : 0.28);
    const cX = (cMinX + cMaxX) / 2;
    if (cX < leftBoundary || cX > rightBoundary) {
      return true;
    }
  }

  const isThinHorizontal = h <= cellBoxH * 0.085 && w >= cellBoxW * 0.10;
  if (isThinHorizontal) {
    const topAccented = (char === 'Й' || char === 'й' || char === 'ё' || char === 'Ё');
    const topBoundary = activeTop + cellBoxH * (topAccented ? 0.15 : 0.28);
    const bottomBoundary = activeBottom - cellBoxH * 0.28;
    const cY = (cMinY + cMaxY) / 2;
    if (cY < topBoundary || cY > bottomBoundary) {
      return true;
    }
  }

  // 9. Extra Geometric Shape Filter (reject perfect empty square/rectangle contours which represent box drawing elements)
  if (simplified.length === 4 || simplified.length === 5) {
    const area = Math.abs(getSignedArea(contour));
    const bboxArea = w * h;
    const fillRatio = area / (bboxArea || 1);
    
    if (fillRatio > 0.95 && totalLength > 120) {
      return true; 
    }
  }

  // 10. Center stencil character hint leak check (e.g. printed "А", "б" backdrop in the center)
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
    
    // Stencils are thin-outline figures printed on paper. Their bounding box fill ratio is tiny,
    // or they represent thin shapes with very low ink density.
    if (polygonRatio < 0.25 || area < 400) {
      return true;
    }
  }

  return false; // Safely validated as genuine handwriting!
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
  // Prevent extraction of banned/unicode characters
  if (!isValidCharacterUnicode(char)) {
    return { paths: [], advanceWidth: 5734 };
  }

  // STRICT LAYER SEPARATION: Isolate handwriting contours only (Layer 3)
  const filteredContours = contours.filter(contour => {
    return !isLikelyTableLineOrBoxSymbol(
      contour,
      imgWidth,
      imgHeight,
      char,
      destX,
      destY,
      destW,
      destH
    );
  });

  if (filteredContours.length === 0) {
    // Return empty space with default width
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

  const boxW = (maxX - minX) > 0 ? (maxX - minX) : 1;
  const boxH = (maxY - minY) > 0 ? (maxY - minY) : 1;

  // 3. Setup uniform scaling and baseline factors
  const align = getGlyphAlignment(char);
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
    const smoothed = smoothContour(smoothContour(smoothContour(contour)));
    const simplified = simplifyContour(smoothed, 0.0001); // ultra-high polygon fidelity
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

  if (outOfTop || outOfBottom) {
    // If curves overshot slightly, scale down one final time and re-project
    const shrinkFactor = 0.92;
    const finalPaths = resultPaths.map(subpath => subpath.map(cmd => {
      const copy = { ...cmd };
      if (copy.x !== undefined) copy.x = Number((half(advanceWidth) + (copy.x - half(advanceWidth)) * shrinkFactor).toFixed(3));
      if (copy.y !== undefined) copy.y = Number((targetCenterY + (copy.y - targetCenterY) * shrinkFactor).toFixed(3));
      if (copy.x1 !== undefined) copy.x1 = Number((half(advanceWidth) + (copy.x1 - half(advanceWidth)) * shrinkFactor).toFixed(3));
      if (copy.y1 !== undefined) copy.y1 = Number((targetCenterY + (copy.y1 - targetCenterY) * shrinkFactor).toFixed(3));
      return copy;
    }));
    return { paths: finalPaths, advanceWidth };
  }

  return { paths: resultPaths, advanceWidth };
}

function half(val: number) {
  return val / 2;
}

