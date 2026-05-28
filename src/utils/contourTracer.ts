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

  // Clear outer margins of cell to wipe out grid borders and index labels (e.g., 'А', 'Б' written inside cells)
  const clearTop = Math.round(height * 0.11);
  const clearBottom = Math.round(height * 0.095);
  const clearLeft = Math.round(width * 0.095);
  const clearRight = Math.round(width * 0.095);

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
  // Uppercase Cyrillic & Latin, digits, plus tall lowercase
  const tallChars = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789бďfghjklt';
  // Lowercase Cyrillic with descenders: д, з, у, ф, and Latin descenders: g, j, p, q, y
  const descenders = 'дзуфgjpqy';
  // Small punctuation symbols
  const punctuation = '.,-+=_!?;()[]{}<>:;\'"';

  if (tallChars.includes(char)) {
    return { type: 'tall', yMin: 0, yMax: 11500 };
  } else if (descenders.includes(char)) {
    return { type: 'descender', yMin: -3300, yMax: 7400 };
  } else if (punctuation.includes(char)) {
    if (char === '.' || char === ',') {
      return { type: 'punctuation', yMin: 0, yMax: 1600 };
    }
    return { type: 'punctuation', yMin: 0, yMax: 8200 };
  } else {
    // Normal lowercase (а, в, г, е, ж, з, и, й, к, л, м, н, о, п, р, с, т, х, ц, ч, ш, щ, ъ, ы, ь, э, ю, я, etc.)
    return { type: 'standard', yMin: 0, yMax: 7400 };
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
  // Filter out leaked grid border lines and noise speckles dynamically
  const filteredContours = contours.filter(contour => {
    if (contour.length < 3) return false;

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

    // 1. Specks/noise
    if (w <= imgWidth * 0.015 && h <= imgHeight * 0.015) return false;

    // 2. Entire grid layout boxes (typically almost full width/height of cell canvas)
    if (w > imgWidth * 0.88 || h > imgHeight * 0.88) return false;

    // Real physical boundaries of where drawing occurred on the canvas
    const activeLeft = destX !== undefined ? destX : Math.round(imgWidth * 0.095);
    const activeTop = destY !== undefined ? destY : Math.round(imgHeight * 0.095);
    const activeRight = (destX !== undefined && destW !== undefined) ? (destX + destW) : (imgWidth - Math.round(imgWidth * 0.095));
    const activeBottom = (destY !== undefined && destH !== undefined) ? (destY + destH) : (imgHeight - Math.round(imgHeight * 0.095));

    // 3. Left grid borders (thin vertical strokes touching or very near the left border)
    if (w < imgWidth * 0.06 && cMinX <= activeLeft + Math.round(imgWidth * 0.06)) return false;

    // 4. Right grid borders (thin vertical strokes touching or very near the right border)
    if (w < imgWidth * 0.06 && cMaxX >= activeRight - Math.round(imgWidth * 0.06)) return false;

    // 5. Top grid lines (thin horizontal strokes near the top border)
    if (h < imgHeight * 0.06 && cMinY <= activeTop + Math.round(imgHeight * 0.07)) return false;

    // 6. Bottom grid lines (thin horizontal strokes near the bottom border)
    if (h < imgHeight * 0.06 && cMaxY >= activeBottom - Math.round(imgHeight * 0.06)) return false;

    // 7. Advanced linear noise filter: Reject isolated perfectly thin vertical/horizontal lines near the edges
    const isThinVertical = w <= Math.round(imgWidth * 0.024) && h >= Math.round(imgHeight * 0.12);
    const isThinHorizontal = h <= Math.round(imgHeight * 0.024) && w >= Math.round(imgWidth * 0.12);
    if (isThinVertical && (cMinX < activeLeft + Math.round(imgWidth * 0.1) || cMaxX > activeRight - Math.round(imgWidth * 0.1))) {
      return false;
    }
    if (isThinHorizontal && (cMinY < activeTop + Math.round(imgHeight * 0.1) || cMaxY > activeBottom - Math.round(imgHeight * 0.1))) {
      return false;
    }

    return true;
  });

  const resultPaths: PathCommand[][] = [];

  if (filteredContours.length === 0) {
    // Return empty space with default width (equivalent to 350 at 1000 EM = 5734 at 16384 EM)
    return { paths: [], advanceWidth: 5734 };
  }

  // 1. Determine cell canvas metrics dynamically or fallback to canvas resolution bounds
  const cellBoxX = destX !== undefined ? destX : 0;
  const cellBoxY = destY !== undefined ? destY : 0;
  const cellBoxW = destW !== undefined ? destW : imgWidth;
  const cellBoxH = destH !== undefined ? destH : imgHeight;

  // Baseline position at exactly 85% of cellBoxH from the top of the cell box area
  const cellBaselineY = cellBoxY + cellBoxH * 0.85;

  const FONT_HEIGHT_UNITS = 12000;
  // Scale factor: mapping cell height above baseline (cellBoxH * 0.85) to standard 12000 font height units
  const fontScale = FONT_HEIGHT_UNITS / (cellBoxH * 0.85);

  // 2. Find tight horizontal bounding box of trace points over filtered contours only
  let minX = Infinity;
  let maxX = -Infinity;

  for (const contour of filteredContours) {
    for (const p of contour) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
  }

  // Width in pixels of the actual written character
  const boxW = (maxX - minX) > 0 ? (maxX - minX) : 1;
  const scaledWidth = boxW * fontScale;

  // Standard horizontal sidebearing padding (820 font units - equivalent to 50 at EM 1000)
  const sidebearing = 820;
  const advanceWidth = Math.max(3200, Math.round(scaledWidth + sidebearing * 2));

  // 3. Transform and project all points to TTF space with uniform scale & unified baseline mapping
  const transformedContours: Point[][] = [];
  for (const contour of filteredContours) {
    const smoothed = smoothContour(smoothContour(smoothContour(contour)));
    const simplified = simplifyContour(smoothed, 0.0001); // 50x higher precision polygon resolution (epsilon=0.0001)
    if (simplified.length < 3) continue;

    const ptsInTtf: Point[] = [];
    for (let i = 0; i < simplified.length; i++) {
      const pt = simplified[i];
      // Horizontal centering inside advanceWidth with uniform scaling
      const normX = (pt.x - minX) / boxW;
      const targetTxtX = sidebearing + normX * scaledWidth;

      // Vertical position maps perfectly via the uniform baseline and scale factor!
      const targetTxtY = (cellBaselineY - pt.y) * fontScale;
      ptsInTtf.push({ x: targetTxtX, y: targetTxtY });
    }
    transformedContours.push(ptsInTtf);
  }

  // 4. Correct contour winding directions based on nesting depth to ensure inner holes render correctly (not filled black)
  const correctedContours: Point[][] = [];
  for (let i = 0; i < transformedContours.length; i++) {
    const poly = transformedContours[i];
    
    // Compute nesting depth by checking if the first vertex of this polygon is inside other polygons
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

  // 5. Convert to PathCommand structures using perfectly smooth Quadratic B-splines with 3-decimal precision
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
      // Fallback for extremely small shapes
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

  return { paths: resultPaths, advanceWidth };
}
