import React, { useState, useEffect } from 'react';
import { PageConfig, HandwritingStyle } from '../types';
import { PAGE_HEIGHT, PAGE_WIDTH, parseLaTeXFormula, RenderedPage, renderGlyphToSVGPath } from '../utils/handwritingEngine';
import { Download, FileDown, Eye, FileText, ChevronLeft, ChevronRight, Sparkles, Printer } from 'lucide-react';


interface A4PaperProps {
  pages: RenderedPage[];
  config: PageConfig;
  fontSize: number;
  style?: HandwritingStyle;
}

interface HandwritingPageSVGProps {
  key?: any;
  id: string;
  page?: RenderedPage;
  config: PageConfig;
  fontSize: number;
  style?: HandwritingStyle;
  inkColorHex: string;
  isAnimating: boolean;
  animationSpeed: number;
  getPaperBgFill: () => string;
}

function HandwritingPageSVG({
  id,
  page,
  config,
  fontSize,
  style,
  inkColorHex,
  isAnimating,
  animationSpeed,
  getPaperBgFill
}: HandwritingPageSVGProps) {
  // Dynamic stroke properties based on writing tool emulation
  const getStrokeProps = (baseThickness: number, penStyle: string, inkColor: string, toolType?: string) => {
    let thickness = baseThickness;
    let opacity = 1.0;
    let strokeLinecap: 'round' | 'square' = 'round';

    const activeTool = toolType || (inkColor === 'pencil' ? 'pencil' : inkColor === 'marker-yellow' ? 'marker' : inkColor.startsWith('felt') ? 'felt' : 'pen');

    // Apply specific physical properties depending on the writing instrument
    if (activeTool === 'pencil') {
      opacity = 0.72; // Matte graphite feel
    } else if (activeTool === 'colored-pencil') {
      opacity = 0.82; // Hand-painted crayon wax feel
    } else if (activeTool === 'felt') {
      opacity = 0.92; // Solid ink felt distribution
    } else if (activeTool === 'marker') {
      opacity = 0.44; // Transparent fluo highlight ink
      strokeLinecap = 'square'; // Highlighter has a chisel/square tip!
    } else if (activeTool === 'liner') {
      opacity = 0.98; // Rich capillary pigment
      thickness *= 0.85; // slightly finer default line representation
    } else {
      // Standard pens only: apply pen style adjustments
      if (penStyle === 'fountain') {
        thickness *= 1.35;
      } else if (penStyle === 'gel') {
        thickness *= 1.15;
      } else if (penStyle === 'ballpoint') {
        opacity = 0.90;
      }
    }

    return { strokeWidth: thickness, opacity, strokeLinecap };
  };

  // Generate slightly wavy lines representing hand-drawn lines with tremors
  const getHanddrawnPath = (x1: number, y1: number, x2: number, y2: number) => {
    // Human lines are never perfectly aligned, so let's introduce a tiny jitter to starting/ending coordinates
    // derived deterministically from the nominal coordinates so it's stable and we don't blink on updates.
    const startJitterX = Math.sin(x1 * 1.5 + y1 * 0.7) * 1.1;
    const startJitterY = Math.cos(x1 * 0.8 + y1 * 1.9) * 1.1;
    const endJitterX = Math.cos(x2 * 1.4 + y2 * 1.1) * 1.1;
    const endJitterY = Math.sin(x2 * 0.9 + y2 * 1.6) * 1.1;

    const jx1 = x1 + startJitterX;
    const jy1 = y1 + startJitterY;
    const jx2 = x2 + endJitterX;
    const jy2 = y2 + endJitterY;

    const dx = jx2 - jx1;
    const dy = jy2 - jy1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return `M ${x1} ${y1} L ${x2} ${y2}`;

    // Calculate angle of line to enable overshoot and perpendicular/parallel offsets
    const angle = Math.atan2(dy, dx);
    
    // Overshoot: humans drawing quick lines often overshoot slightly at the start and end (a fast start and a quick flick finish)
    const overshootStart = 1.8 + Math.sin(x1 * 2.3 + y1 * 3.7) * 1.5;
    const overshootEnd = 2.2 + Math.cos(x2 * 3.1 + y2 * 1.9) * 1.8;

    const ox1 = jx1 - Math.cos(angle) * overshootStart;
    const oy1 = jy1 - Math.sin(angle) * overshootStart;
    const ox2 = jx2 + Math.cos(angle) * overshootEnd;
    const oy2 = jy2 + Math.sin(angle) * overshootEnd;

    // Recalculate dx, dy, and length of actual extended drawn stroke
    const ndx = ox2 - ox1;
    const ndy = oy2 - oy1;
    const nlen = Math.sqrt(ndx * ndx + ndy * ndy);

    const steps = Math.max(4, Math.floor(nlen / 10));
    let path = `M ${ox1} ${oy1}`;

    // Wrist pivot bowing effect (a long, gentle arc as the arm/hand draws)
    // Positive or negative arc direction depending on coordinate hashes
    const arcDirectSeed = Math.sin(x1 * 0.02 + y1 * 0.03 + x2 * 0.05) > 0 ? 1 : -1;
    const maxBowing = (1.1 + Math.sin(x1 * 0.17 + y2 * 0.23) * 0.5) * arcDirectSeed;

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const px = ox1 + ndx * t;
      const py = oy1 + ndy * t;

      // Normal units perpendicular to the line
      const perpX = -ndy / nlen;
      const perpY = ndx / nlen;

      // Deterministic pseudo-random seed for intermediate wobbles
      const hashSeed = Math.sin(x1 * 0.13 + y1 * 0.09 + s * 1.1) * 2000;
      
      // 1. Slow wrist/hand arc: peaks in the middle (t = 0.5)
      const arcVal = Math.sin(t * Math.PI) * maxBowing;

      // 2. Medium speed wiggle (drawing instability/texture)
      const waveVal = Math.sin(t * Math.PI * 2.8 + hashSeed) * 0.55;

      // 3. High-frequency friction tremor (fine micro-vibrations)
      const tremorVal = Math.cos(t * Math.PI * 7.5 + hashSeed * 1.5) * 0.15;

      const totalWobble = arcVal + waveVal + tremorVal;

      if (s === steps) {
        path += ` L ${ox2} ${oy2}`;
      } else {
        path += ` L ${px + perpX * totalWobble} ${py + perpY * totalWobble}`;
      }
    }
    return path;
  };

  return (
    <svg
      id={id}
      className="w-full h-full"
      viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* DEFINITIONS FOR SHEET DESIGN GRIDS & FILTERS */}
      <defs>
        {/* Margins */}
        {config.showMargins && (
          <pattern id={`margins-${id}`} width={PAGE_WIDTH} height={PAGE_HEIGHT} patternUnits="userSpaceOnUse">
            <line x1={config.margins.left} y1="0" x2={config.margins.left} y2={PAGE_HEIGHT} stroke="#ec7c7c" strokeWidth="1.2" strokeDasharray="4 2" />
            <line x1={PAGE_WIDTH - config.margins.right} y1="0" x2={PAGE_WIDTH - config.margins.right} y2={PAGE_HEIGHT} stroke="#ec7c7c" strokeWidth="1" strokeDasharray="4 2" />
          </pattern>
        )}

        {/* Lined notebook grid paper layout */}
        {config.paperType === 'lined' && (
          <pattern 
            id={`lined-grid-${id}`} 
            width={PAGE_WIDTH} 
            height={config.lineSpacing} 
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0, ${config.margins.top})`}
          >
            <line x1="0" y1="0" x2={PAGE_WIDTH} y2="0" stroke="#cce6ff" strokeWidth="0.8" />
          </pattern>
        )}

        {/* Squared paper grid pattern */}
        {config.paperType === 'squared' && (
          <pattern 
            id={`squared-grid-${id}`} 
            width={config.lineSpacing} 
            height={config.lineSpacing} 
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${config.margins.left}, ${config.margins.top})`}
          >
            <rect width={config.lineSpacing} height={config.lineSpacing} fill="none" stroke="#e1f0fe" strokeWidth="0.7" />
          </pattern>
        )}

        {/* Vintage tea dye layout gradient */}
        <linearGradient id={`vintage-tea-dye-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ebdb" />
          <stop offset="40%" stopColor="#edd4af" />
          <stop offset="80%" stopColor="#dfbe8c" />
          <stop offset="100%" stopColor="#d5aa70" />
        </linearGradient>

        {/* Organic fiber texture pattern */}
        <pattern id={`fiber-texture-${id}`} width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M10,25 Q13,27 18,24 M45,65 Q48,60 52,63 M75,15 Q78,13 83,16 M90,85 Q85,88 81,83" stroke="#e1d7bb" strokeWidth="0.5" fill="none" opacity="0.4" />
          <path d="M30,90 Q33,93 37,89 M65,115 Q68,110 72,113 M110,40 Q105,43 101,38 M5,50 Q10,48 7,54" stroke="#d5c8a4" strokeWidth="0.4" fill="none" opacity="0.3" />
        </pattern>

        {/* Scanner Vignette Effect */}
        <linearGradient id={`scanner-vignette-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#222222" stopOpacity="0.12" />
          <stop offset="5%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="95%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#222222" stopOpacity="0.12" />
        </linearGradient>

        <linearGradient id={`scanner-vignette-vertical-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#222222" stopOpacity="0.14" />
          <stop offset="5%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="95%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#222222" stopOpacity="0.14" />
        </linearGradient>

        {/* SVGs Realism Warping Displacement filters */}
        <filter id={`vintage-warp-filter-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.0" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <filter id={`copy-scan-filter-${id}`}>
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feColorMatrix type="matrix" values="
            1.3 0 0 0 -0.15
            0 1.3 0 0 -0.15
            0 0 1.3 0 -0.15
            0 0 0 1.1 0" />
        </filter>

        {/* Dynamic Crumpled relief filter using fractal noise & diffuse lighting */}
        <filter id={`crumpled-diffuse-filter-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#ffffff" surfaceScale="2.2" result="light">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feBlend mode="multiply" in="SourceGraphic" in2="light" result="blend" />
        </filter>

        {/* High-Contrast Document Scanner Filter */}
        <filter id={`scanner-contrast-multiplier-${id}`}>
          <feGaussianBlur stdDeviation="0.3" result="blur" />
          <feColorMatrix type="matrix" values="
            1.4 0 0 0 -0.08
            0 1.4 0 0 -0.08
            0 0 1.4 0 -0.08
            0 0 0 1.15 0" />
        </filter>

        {/* Soft shadow gradients for hand/smartphone photography overlay */}
        <linearGradient id={`phone-body-shadow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e2230" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1e2230" stopOpacity="0.0" />
        </linearGradient>
        
        <radialGradient id={`person-shoulder-shadow-${id}`} cx="65%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#10131e" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#10131e" stopOpacity="0.0" />
        </radialGradient>
      </defs>

      {/* BACKGROUND FILLS & TEXTURE LAYERS */}
      <rect width="100%" height="100%" fill={getPaperBgFill() === 'url(#vintage-tea-dye)' ? `url(#vintage-tea-dye-${id})` : getPaperBgFill()} />
      
      {config.paperTexture === 'fiber' && (
        <rect width="100%" height="100%" fill={`url(#fiber-texture-${id})`} />
      )}

      {config.paperTexture === 'copy' && (
        <>
          <rect width="100%" height="100%" fill={`url(#scanner-vignette-${id})`} />
          <rect width="100%" height="100%" fill={`url(#scanner-vignette-vertical-${id})`} />
          <rect width="100%" height="100%" fill={`url(#fiber-texture-${id})`} opacity="0.3" />
        </>
      )}

      {/* FILTER WRAPPER GROUP FOR REALISTIC ORGANIC TEXT AND LINES DISTORTION */}
      <g filter={
        config.paperEffect === 'crumpled'
          ? `url(#crumpled-diffuse-filter-${id})`
          : config.paperEffect === 'scanner'
          ? `url(#scanner-contrast-multiplier-${id})`
          : config.paperTexture === 'vintage'
          ? `url(#vintage-warp-filter-${id})`
          : config.paperTexture === 'copy'
          ? `url(#copy-scan-filter-${id})`
          : undefined
      }>
        {config.paperType === 'squared' && (
          <rect width="100%" height="100%" fill={`url(#squared-grid-${id})`} />
        )}

        {config.paperType === 'lined' && (
          <rect width="100%" height="100%" fill={`url(#lined-grid-${id})`} />
        )}

        {config.showMargins && (
          <rect width="100%" height="100%" fill={`url(#margins-${id})`} />
        )}

        {/* COOPERATIVE STROKE RENDERING WORKLOAD */}
        {page?.lines.map((line, lineIdx) => {
          return (
            <g key={lineIdx}>
              {line.elements.map((el, elIdx) => {
                if (el.type === 'latex' && el.latexExpression) {
                  const isLaTeX = el.type === 'latex';
                  const parsed = parseLaTeXFormula(el.latexExpression, el.x, el.y, fontSize, config, style);
                  const parsedTextElements = (parsed as any).textElements || [];
                  return (
                    <g key={elIdx} stroke={inkColorHex} strokeLinecap="round" strokeLinejoin="round" fill="none">
                      {parsed.paths.map((p: any, pIdx) => {
                        const isRootOrIntegral = isLaTeX && p.type && ['root', 'integral'].includes(p.type);
                        const calculatedStrokeWidth = isRootOrIntegral 
                          ? config.strokeThickness * 1.65 
                          : config.strokeThickness;

                        return (
                          <path
                            key={`p-${pIdx}`}
                            d={p.d}
                            strokeWidth={calculatedStrokeWidth}
                            className={isAnimating ? 'animate-drawn-stroke' : ''}
                            style={isAnimating ? {
                              strokeDasharray: '150',
                              strokeDashoffset: '150',
                              animationName: 'handwritingDraw',
                              animationDuration: `${animationSpeed}s`,
                              animationTimingFunction: 'ease-in-out',
                              animationFillMode: 'forwards',
                              animationDelay: `${(lineIdx * 0.1) + (pIdx * 0.05)}s`
                            } : {}}
                          />
                        );
                      })}
                      {parsed.horizontalLines.map((lineDef: any, lIdx) => {
                        const isRootRoof = isLaTeX && lineDef.type === 'root';
                        const isFractionBar = isLaTeX && lineDef.type === 'fraction';
                        const calculatedStrokeWidth = isRootRoof 
                          ? config.strokeThickness * 1.65
                          : isFractionBar
                          ? config.strokeThickness * 1.35
                          : config.strokeThickness * 1.2;

                        return (
                          <line
                            key={`h-${lIdx}`}
                            x1={lineDef.x1}
                            y1={lineDef.y1}
                            x2={lineDef.x2}
                            y2={lineDef.y2}
                            stroke={inkColorHex}
                            strokeWidth={calculatedStrokeWidth}
                          />
                        );
                      })}
                      {parsedTextElements.map((t: any, tIdx: number) => (
                        <g key={`t-g-${tIdx}`}>
                          {config.textOutlineColor && (
                            <text
                              x={t.x}
                              y={t.y}
                              fontSize={t.fontSize}
                              fontFamily={t.fontFamily || style?.fontFamily || 'sans-serif'}
                              fill={config.textOutlineColor}
                              stroke={config.textOutlineColor}
                              strokeWidth={(t.fontSize * 0.14) + 2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              transform={`rotate(${t.rotation || 0}, ${t.x}, ${t.y})`}
                              style={isAnimating ? {
                                opacity: 0.85,
                                animationName: 'handwritingFade',
                                animationDuration: `${animationSpeed * 0.4}s`,
                                animationTimingFunction: 'ease-out',
                                animationFillMode: 'both',
                                animationDelay: `${(lineIdx * 0.08) + (tIdx * 0.005)}s`
                              } : {
                                opacity: 0.85
                              }}
                            >
                              {t.char}
                            </text>
                          )}
                          <text
                            x={t.x}
                            y={t.y}
                            fontSize={t.fontSize}
                            fontFamily={t.fontFamily || style?.fontFamily || 'sans-serif'}
                            fill={inkColorHex}
                            stroke={config.toolType === 'felt' ? inkColorHex : 'none'}
                            strokeWidth={config.toolType === 'felt' ? t.fontSize * 0.055 : undefined}
                            strokeLinecap={config.toolType === 'felt' ? 'round' : undefined}
                            strokeLinejoin={config.toolType === 'felt' ? 'round' : undefined}
                            transform={`rotate(${t.rotation || 0}, ${t.x}, ${t.y})`}
                            style={isAnimating ? {
                              opacity: config.penStyle === 'ballpoint' ? 0.88 : 1,
                              animationName: 'handwritingFade',
                              animationDuration: `${animationSpeed * 0.4}s`,
                              animationTimingFunction: 'ease-out',
                              animationFillMode: 'both',
                              animationDelay: `${(lineIdx * 0.08) + (tIdx * 0.005)}s`
                            } : {
                              opacity: config.penStyle === 'ballpoint' ? 0.88 : 1
                            }}
                          >
                            {t.char}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                }

                if (el.type === 'form_line') {
                  const labelFontSize = Math.max(9, fontSize * 0.45);
                  return (
                    <g key={elIdx}>
                      <line
                        x1={el.x}
                        y1={el.y}
                        x2={el.x + el.width}
                        y2={el.y}
                        stroke="#6b7280"
                        strokeWidth={1.5}
                        opacity={0.85}
                      />
                      {el.label && (
                        <text
                          x={el.x + 4}
                          y={el.y + labelFontSize + 3}
                          fontSize={labelFontSize}
                          fontFamily="sans-serif"
                          fill="#4b5563"
                          fontWeight="bold"
                          opacity={0.75}
                        >
                          {el.label}
                        </text>
                      )}
                    </g>
                  );
                }

                if (el.type === 'table' && el.tableRows) {
                  const rows = el.tableRows;
                  const rowsCount = rows.length;
                  const colsCount = rowsCount > 0 ? rows[0].length : 0;
                  const rowHeight = config.lineSpacing * 1.6;
                  const colWidth = el.width / (colsCount || 1);
                  const tableHeight = rowsCount * rowHeight;
                  
                  const strokeProps = getStrokeProps(config.strokeThickness, config.penStyle, config.inkColor, config.toolType);

                  // Accumulate grid line items (horizontal & vertical)
                  const gridLines: React.ReactNode[] = [];

                  // Horizontal grid lines
                  for (let r = 0; r <= rowsCount; r++) {
                    const ry = el.y + r * rowHeight;
                    const computedThickness = strokeProps.strokeWidth;
                    
                    if (el.tableStyle === 'ruler' || el.tableStyle === 'printed') {
                      gridLines.push(
                        <line
                          key={`row-line-${r}`}
                          x1={el.x}
                          y1={ry}
                          x2={el.x + el.width}
                          y2={ry}
                          stroke={inkColorHex}
                          strokeWidth={computedThickness}
                          opacity={strokeProps.opacity * 0.82}
                        />
                      );
                    } else {
                      gridLines.push(
                        <path
                          key={`row-line-${r}`}
                          d={getHanddrawnPath(el.x, ry, el.x + el.width, ry)}
                          stroke={inkColorHex}
                          strokeWidth={computedThickness * 1.1}
                          fill="none"
                          opacity={strokeProps.opacity * 0.88}
                        />
                      );
                    }
                  }

                  // Vertical grid lines
                  for (let c = 0; c <= colsCount; c++) {
                    const cx = el.x + c * colWidth;
                    
                    if (el.tableStyle === 'ruler' || el.tableStyle === 'printed') {
                      gridLines.push(
                        <line
                          key={`col-line-${c}`}
                          x1={cx}
                          y1={el.y}
                          x2={cx}
                          y2={el.y + tableHeight}
                          stroke={inkColorHex}
                          strokeWidth={strokeProps.strokeWidth}
                          opacity={strokeProps.opacity * 0.82}
                        />
                      );
                    } else {
                      gridLines.push(
                        <path
                          key={`col-line-${c}`}
                          d={getHanddrawnPath(cx, el.y, cx, el.y + tableHeight)}
                          stroke={inkColorHex}
                          strokeWidth={strokeProps.strokeWidth * 1.1}
                          fill="none"
                          opacity={strokeProps.opacity * 0.88}
                        />
                      );
                    }
                  }

                  // Render text elements inside each grid cell
                  const cellTexts: React.ReactNode[] = [];
                  rows.forEach((row, rIdx) => {
                    row.forEach((cellText, cIdx) => {
                      const colLeft = el.x + cIdx * colWidth;
                      const rowTop = el.y + rIdx * rowHeight;
                      const baselineY = rowTop + rowHeight * 0.72; // baseline positioning for handwritten letter rendering
                      
                      let curCharX = colLeft + 12;
                      const cellFontSize = fontSize * 0.84; // write cell texts slightly smaller

                      const isPrintedTable = el.tableStyle === 'printed';
                      const cellStyle = isPrintedTable
                        ? {
                            id: 'print-sans',
                            name: '🖨️ Печатный Sans',
                            creator: 'Типография',
                            description: 'Arial style',
                            slant: 0,
                            letterSpacing: 2.0,
                            baselineOffset: 0,
                            glyphs: {},
                            useFont: true,
                            fontFamily: '"Inter", "Arial", sans-serif',
                            isPrinted: true
                          }
                        : style;

                      cellText.split('').forEach((char, charIdx) => {
                        if (char === ' ') {
                          curCharX += config.wordSpacing * 0.85;
                          return;
                        }

                        // Call procedural path compiler
                        const rendering = renderGlyphToSVGPath(
                          char,
                          curCharX,
                          baselineY,
                          cellFontSize,
                          config,
                          charIdx + rIdx * 10,
                          lineIdx,
                          cellStyle
                        );

                        const textY = isPrintedTable ? baselineY : rendering.lastPoint[1];
                        const textRotation = isPrintedTable ? 0 : (rendering.rotation || 0);

                        if (rendering.useFont) {
                          const isFelt = config.toolType === 'felt';
                          cellTexts.push(
                            <g key={`cell-font-g-${rIdx}-${cIdx}-${charIdx}`}>
                              {config.textOutlineColor && (
                                <text
                                  x={curCharX}
                                  y={textY}
                                  fontSize={cellFontSize}
                                  fontFamily={cellStyle?.fontFamily || 'sans-serif'}
                                  fill={config.textOutlineColor}
                                  stroke={config.textOutlineColor}
                                  strokeWidth={(cellFontSize * 0.14) + 2.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  opacity={0.85}
                                  transform={`rotate(${textRotation}, ${curCharX}, ${textY})`}
                                >
                                  {char}
                                </text>
                              )}
                              <text
                                x={curCharX}
                                y={textY}
                                fontSize={cellFontSize}
                                fontFamily={cellStyle?.fontFamily || 'sans-serif'}
                                fill={inkColorHex}
                                stroke={isFelt ? inkColorHex : 'none'}
                                strokeWidth={isFelt ? cellFontSize * 0.055 : undefined}
                                strokeLinecap={isFelt ? 'round' : undefined}
                                strokeLinejoin={isFelt ? 'round' : undefined}
                                opacity={strokeProps.opacity}
                                transform={`rotate(${textRotation}, ${curCharX}, ${textY})`}
                              >
                                {char}
                              </text>
                            </g>
                          );
                        } else if (rendering.pathData) {
                          const isMultiply = (config.toolType && config.toolType !== 'pen') || config.inkColor === 'pencil' || config.inkColor === 'marker-yellow' || config.inkColor.startsWith('felt');
                          cellTexts.push(
                            <g key={`cell-path-g-${rIdx}-${cIdx}-${charIdx}`}>
                              {config.textOutlineColor && (
                                <path
                                  d={rendering.pathData}
                                  stroke={config.textOutlineColor}
                                  strokeWidth={strokeProps.strokeWidth + 4.5}
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  opacity={0.88}
                                />
                              )}
                              <path
                                d={rendering.pathData}
                                stroke={inkColorHex}
                                strokeWidth={strokeProps.strokeWidth}
                                strokeLinecap={strokeProps.strokeLinecap as any || 'round'}
                                strokeLinejoin="round"
                                fill="none"
                                opacity={strokeProps.opacity}
                                style={{
                                  mixBlendMode: isMultiply ? 'multiply' : 'normal'
                                }}
                              />
                            </g>
                          );
                        }
                        curCharX += rendering.width;
                      });
                    });
                  });

                  return (
                    <g key={elIdx}>
                      {gridLines}
                      {cellTexts}
                    </g>
                  );
                }

                if (el.useFont) {
                  const strokeProps = getStrokeProps(config.strokeThickness, config.penStyle, config.inkColor, config.toolType);
                  const isMultiply = (config.toolType && config.toolType !== 'pen') || config.inkColor === 'pencil' || config.inkColor === 'marker-yellow' || config.inkColor.startsWith('felt');
                  const isFelt = config.toolType === 'felt';
                  const textThickenStroke = isFelt ? (fontSize * 0.055) : 0;
                  
                  const lineY = el.y + (el.isLine ? 1 : 4.5);
                  const lineStroke = config.toolType === 'pencil' || config.inkColor === 'pencil' ? '#6b7280' : inkColorHex;
                  const underlineThickness = el.isLine ? 1.5 : 1.0;
                  
                  return (
                    <g key={elIdx}>
                      {el.isUnderlined && (
                        el.isPrinted ? (
                          <line
                            x1={el.x}
                            y1={lineY}
                            x2={el.x + el.width}
                            y2={lineY}
                            stroke={lineStroke}
                            strokeWidth={underlineThickness}
                            opacity={0.8}
                            style={{ mixBlendMode: isMultiply ? 'multiply' : 'normal' }}
                          />
                        ) : (
                          <path
                            d={getHanddrawnPath(el.x, lineY, el.x + el.width, lineY)}
                            fill="none"
                            stroke={lineStroke}
                            strokeWidth={underlineThickness + 0.3}
                            opacity={0.8}
                            style={{ mixBlendMode: isMultiply ? 'multiply' : 'normal' }}
                          />
                        )
                      )}
                      
                      {!el.isLine && (
                        <>
                          {config.textOutlineColor && (
                            <text
                              x={el.x}
                              y={el.y}
                              fill={config.textOutlineColor}
                              stroke={config.textOutlineColor}
                              strokeWidth={(fontSize * 0.14) + 2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fontSize={fontSize}
                              fontFamily={el.fontFamily || 'sans-serif'}
                              transform={`rotate(${el.rotation || 0}, ${el.x}, ${el.y})`}
                              style={isAnimating ? {
                                opacity: 0.85,
                                animationName: 'handwritingFade',
                                animationDuration: `${animationSpeed * 0.4}s`,
                                animationTimingFunction: 'ease-out',
                                animationFillMode: 'both',
                                animationDelay: `${(lineIdx * 0.08) + (elIdx * 0.005)}s`,
                                mixBlendMode: isMultiply ? 'multiply' : 'normal'
                              } : {
                                opacity: 0.85,
                                mixBlendMode: isMultiply ? 'multiply' : 'normal'
                              }}
                            >
                              {el.char}
                            </text>
                          )}
                          <text
                            x={el.x}
                            y={el.y}
                            fill={inkColorHex}
                            stroke={isFelt ? inkColorHex : 'none'}
                            strokeWidth={isFelt ? textThickenStroke : undefined}
                            strokeLinecap={isFelt ? 'round' : undefined}
                            strokeLinejoin={isFelt ? 'round' : undefined}
                            fontSize={fontSize}
                            fontFamily={el.fontFamily || 'sans-serif'}
                            transform={`rotate(${el.rotation || 0}, ${el.x}, ${el.y})`}
                            style={isAnimating ? {
                              opacity: strokeProps.opacity,
                              animationName: 'handwritingFade',
                              animationDuration: `${animationSpeed * 0.4}s`,
                              animationTimingFunction: 'ease-out',
                              animationFillMode: 'both',
                              animationDelay: `${(lineIdx * 0.08) + (elIdx * 0.005)}s`,
                              mixBlendMode: isMultiply ? 'multiply' : 'normal'
                            } : {
                              opacity: strokeProps.opacity,
                              mixBlendMode: isMultiply ? 'multiply' : 'normal'
                            }}
                          >
                            {el.char}
                          </text>
                        </>
                      )}
                    </g>
                  );
                }

                const strokeProps = getStrokeProps(config.strokeThickness, config.penStyle, config.inkColor, config.toolType);
                const isMultiply = (config.toolType && config.toolType !== 'pen') || config.inkColor === 'pencil' || config.inkColor === 'marker-yellow' || config.inkColor.startsWith('felt');
                
                const lineY = el.y + (el.isLine ? 1 : 4.5);
                const lineStroke = config.toolType === 'pencil' || config.inkColor === 'pencil' ? '#6b7280' : inkColorHex;
                const underlineThickness = el.isLine ? 1.5 : 1.0;

                return (
                  <g key={elIdx}>
                    {el.isUnderlined && (
                      el.isPrinted ? (
                        <line
                          x1={el.x}
                          y1={lineY}
                          x2={el.x + el.width}
                          y2={lineY}
                          stroke={lineStroke}
                          strokeWidth={underlineThickness}
                          opacity={0.8}
                          style={{ mixBlendMode: isMultiply ? 'multiply' : 'normal' }}
                        />
                      ) : (
                        <path
                          d={getHanddrawnPath(el.x, lineY, el.x + el.width, lineY)}
                          fill="none"
                          stroke={lineStroke}
                          strokeWidth={underlineThickness + 0.3}
                          opacity={0.8}
                          style={{ mixBlendMode: isMultiply ? 'multiply' : 'normal' }}
                        />
                      )
                    )}

                    {!el.isLine && (
                      <>
                        {config.textOutlineColor && (
                          <path
                            d={el.pathData}
                            fill="none"
                            stroke={config.textOutlineColor}
                            strokeWidth={strokeProps.strokeWidth + 4.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={isAnimating ? 'animate-drawn-stroke' : ''}
                            style={isAnimating ? {
                              opacity: 0.88,
                              strokeDasharray: '200',
                              strokeDashoffset: '200',
                              animationName: 'handwritingDraw',
                              animationDuration: `${animationSpeed}s`,
                              animationTimingFunction: 'ease-in-out',
                              animationFillMode: 'forwards',
                              animationDelay: `${(lineIdx * 0.08) + (elIdx * 0.005)}s`,
                              mixBlendMode: isMultiply ? 'multiply' : 'normal'
                            } : {
                              opacity: 0.88,
                              mixBlendMode: isMultiply ? 'multiply' : 'normal'
                            }}
                          />
                        )}
                        <path
                          d={el.pathData}
                          fill="none"
                          stroke={inkColorHex}
                          strokeWidth={strokeProps.strokeWidth}
                          strokeLinecap={strokeProps.strokeLinecap as any || 'round'}
                          strokeLinejoin="round"
                          className={isAnimating ? 'animate-drawn-stroke' : ''}
                          style={isAnimating ? {
                            opacity: strokeProps.opacity,
                            strokeDasharray: '200',
                            strokeDashoffset: '200',
                            animationName: 'handwritingDraw',
                            animationDuration: `${animationSpeed}s`,
                            animationTimingFunction: 'ease-in-out',
                            animationFillMode: 'forwards',
                            animationDelay: `${(lineIdx * 0.08) + (elIdx * 0.005)}s`,
                            mixBlendMode: isMultiply ? 'multiply' : 'normal'
                          } : {
                            opacity: strokeProps.opacity,
                            mixBlendMode: isMultiply ? 'multiply' : 'normal'
                          }}
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>

      {/* REALISTIC SCANNER COVERS & CAMERA SHADOWS DEPENDING ON EFFECT */}
      {config.paperEffect === 'shadow' && (
        <g style={{ mixBlendMode: 'multiply', pointerEvents: 'none' }}>
          <rect x="-150" y="-120" width="370" height="520" rx="35" fill={`url(#phone-body-shadow-${id})`} transform="rotate(18) translate(50, -60)" filter="blur(20px)" />
          <path d="M-180,-100 Q 180,180 -20,1050 L-180,1050 Z" fill="#141829" opacity="0.22" filter="blur(35px)" />
          <circle cx={PAGE_WIDTH} cy="20" r="480" fill={`url(#person-shoulder-shadow-${id})`} filter="blur(45px)" />
        </g>
      )}

      {config.paperEffect === 'crumpled' && (
        <g style={{ mixBlendMode: 'multiply', opacity: 0.18, strokeWidth: '0.9', pointerEvents: 'none' }}>
          <g stroke="#ffffff" strokeWidth="1.3" opacity="0.7">
            <path d="M 0,220 L 280,310 L 480,240 L 800,520" fill="none" />
            <path d="M 310,0 L 260,350 L 510,510 L 640,1120" fill="none" />
            <path d="M 0,780 L 420,680 L 800,940" fill="none" />
          </g>
          <g stroke="#1a1c22" strokeWidth="0.8" opacity="0.45">
            <path d="M 3,221 L 283,311 L 483,241 L 803,521" fill="none" />
            <path d="M 313,1 L 263,351 L 513,511 L 643,1121" fill="none" />
            <path d="M 3,781 L 423,681 L 803,941" fill="none" />
          </g>
        </g>
      )}

      {config.paperEffect === 'scanner' && (
        <g style={{ mixBlendMode: 'overlay', opacity: 0.45, pointerEvents: 'none' }}>
          <rect width="100%" height="100%" fill={`url(#scanner-vignette-${id})`} />
          <rect width="100%" height="100%" fill={`url(#scanner-vignette-vertical-${id})`} />
        </g>
      )}
    </svg>
  );
}

export default function A4Paper({ pages, config, fontSize, style }: A4PaperProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.5); // seconds to draw
  const [renderTrigger, setRenderTrigger] = useState<number>(0);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [printErrorModal, setPrintErrorModal] = useState<boolean>(false);

  useEffect(() => {
    // Triggers render reset for animations
    setRenderTrigger(prev => prev + 1);
  }, [pages, currentPage, config.inkColor, config.penStyle, config.toolType, config.textOutlineColor]);

  const inkColorHex = {
    blue: '#1d3f94',
    black: '#17171a',
    red: '#c91818',
    purple: '#5c2090',
    green: '#14612d',
    pink: '#e3305d',
    orange: '#ea580c',
    yellow: '#f4af00',
    brown: '#7a431d',
    grey: '#4d4f52',
    pencil: '#4d4f52',
    'felt-blue': '#1e5dfc',
    'felt-pink': '#f43f5e',
    'marker-yellow': '#eab308'
  }[config.inkColor] || config.inkColor || '#1d3f94';

  const handlePrint = () => {
    const printContent = document.querySelector('.print-only-container')?.innerHTML;
    if (!printContent) return;

    // Create a temporary container on document.body for direct printing
    const printContainer = document.createElement('div');
    printContainer.id = 'typescribe-print-inject-container';
    printContainer.innerHTML = printContent;
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
          background-color: #FCFCFA !important;
          display: block !important;
          box-sizing: border-box !important;
        }
        .print-page:last-child {
          page-break-after: avoid !important;
        }
        svg {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Trigger print
    try {
      window.focus();
      
      // Proactively check if the application is nested inside an iframe
      if (window.self !== window.top) {
        throw new Error("Embedded sandbox mode restricts direct window.print()");
      }

      window.print();

      // Clean up container and styles after safari / chrome handles print
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
        }
        if (document.head.contains(styleElement)) {
          document.head.removeChild(styleElement);
        }
      }, 1000);
    } catch (err) {
      console.warn("Direct text page print blocked or restricted in iframe:", err);
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

  const downloadSVG = () => {
    const svgElement = document.getElementById(`a4-svg-page-${currentPage}`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `handwritten-page-${currentPage + 1}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const downloadPNG = () => {
    const svgElement = document.getElementById(`a4-svg-page-${currentPage}`);
    if (!svgElement) return;

    // Serialize SVG with XMLSerializer
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Render with 2x scale for higher resolution print quality!
      const scale = 2.0; 
      canvas.width = PAGE_WIDTH * scale;
      canvas.height = PAGE_HEIGHT * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Soft creamy background fill matching SVG's #FCFCFA
        ctx.fillStyle = '#FCFCFA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        try {
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `handwritten-page-${currentPage + 1}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (err) {
          console.error("PNG conversion failed", err);
        }
      }
      URL.revokeObjectURL(svgUrl);
    };
    img.crossOrigin = 'anonymous';
    img.src = svgUrl;
  };

  const downloadPDF = async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    setPdfProgress(5);
    const originalPage = currentPage;
    
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [PAGE_WIDTH, PAGE_HEIGHT]
      });
      
      for (let i = 0; i < pages.length; i++) {
        setCurrentPage(i);
        setPdfProgress(Math.round(((i + 0.1) / pages.length) * 100));
        
        // Wait briefly for state & DOM transition
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 150 : 80));
        
        const svgElement = document.getElementById(`a4-svg-page-${i}`);
        if (!svgElement) continue;
        
        // Parse and inject Google Fonts inside the serialized SVG definitions
        const parsedDoc = new DOMParser().parseFromString(
          new XMLSerializer().serializeToString(svgElement),
          'image/svg+xml'
        );
        const svgDocElement = parsedDoc.documentElement;
        
        // Find or create defs
        const defsElement = svgDocElement.getElementsByTagName('defs')[0] || svgDocElement.insertBefore(parsedDoc.createElementNS('http://www.w3.org/2000/svg', 'defs'), svgDocElement.firstChild);
        const styleElement = parsedDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleElement.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Bad+Script&family=Caveat:wght@400;700&family=Indie+Flower&family=Kalam:wght@400;700&family=Marck+Script&family=Neucha&family=Playpen+Sans:wght@400;600&display=swap');
        `;
        defsElement.appendChild(styleElement);
        
        const svgString = new XMLSerializer().serializeToString(svgDocElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = svgUrl;
        });
        
        const canvas = document.createElement('canvas');
        const scale = 1.35;
        canvas.width = PAGE_WIDTH * scale;
        canvas.height = PAGE_HEIGHT * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = getPaperBgFill();
          // Support solid vintage tea-dye fallback
          if (config.paperTexture === 'vintage') {
            ctx.fillStyle = '#edd4af';
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          
          const pngData = canvas.toDataURL('image/png');
          if (i > 0) {
            pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
          }
          pdf.addImage(pngData, 'PNG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        }
        
        URL.revokeObjectURL(svgUrl);
        setPdfProgress(Math.round(((i + 1) / pages.length) * 100));
      }
      
      pdf.save(`handwritten-document-${Date.now()}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setCurrentPage(originalPage);
      setIsExportingPDF(false);
      setPdfProgress(0);
    }
  };
   
  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const getPaperBgFill = () => {
    switch (config.paperTexture) {
      case 'fiber': return '#faf7f0';
      case 'copy': return '#e6e6e4';
      case 'vintage': return 'url(#vintage-tea-dye)';
      default: return '#FCFCFA';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Settings Action Row */}
      <div className="w-full flex flex-wrap gap-2 justify-between items-center bg-gray-50 border border-gray-100 p-3 rounded-xl mb-4 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Страница {currentPage + 1} из {pages.length}</span>
          <div className="flex gap-1">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="p-1.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === pages.length - 1}
              className="p-1.5 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Анимация письма:</span>
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`px-3 py-1 rounded-md text-[11px] transition-colors ${
                isAnimating 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isAnimating ? 'Выключить' : 'Начать письмо'}
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300"></div>

          <button
            onClick={downloadSVG}
            className="flex items-center gap-1 bg-white border border-gray-300 hover:border-blue-500 px-3 py-1.5 rounded-lg text-gray-700 hover:text-blue-600 transition-all cursor-pointer"
          >
            <FileDown size={14} />
            <span>Скачать SVG</span>
          </button>

          <button
            onClick={downloadPNG}
            className="flex items-center gap-1 bg-white border border-gray-300 hover:border-blue-500 px-3 py-1.5 rounded-lg text-gray-700 hover:text-blue-600 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Скачать PNG</span>
          </button>
          
          <button
            onClick={downloadPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1 bg-white border border-gray-300 hover:border-blue-500 px-3 py-1.5 rounded-lg text-gray-700 hover:text-blue-600 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <FileText size={14} />
            <span>{isExportingPDF ? `Экспорт PDF (${pdfProgress}%)` : 'Скачать PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            <Printer size={14} />
            <span>Печать</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container (Screen only) */}
      <div 
        id="a4-sheet-container"
        className="screen-only-container relative bg-white shadow-2xl rounded-sm border border-gray-200/50 overflow-hidden select-none print:shadow-none print:border-0 print:m-0 print:p-0"
        style={{
          width: '100%',
          maxWidth: `${PAGE_WIDTH}px`,
          aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}`,
        }}
      >
        <HandwritingPageSVG
          key={renderTrigger}
          id={`a4-svg-page-${currentPage}`}
          page={pages[currentPage]}
          config={config}
          fontSize={fontSize}
          style={style}
          inkColorHex={inkColorHex}
          isAnimating={isAnimating}
          animationSpeed={animationSpeed}
          getPaperBgFill={getPaperBgFill}
        />
      </div>

      {/* Print-only Multi-page Grid Container */}
      <div className="print-only-container">
        {pages.map((page, idx) => (
          <div
            key={idx}
            className="print-page bg-white overflow-hidden"
          >
            <HandwritingPageSVG
              id={`a4-svg-page-print-${idx}`}
              page={page}
              config={config}
              fontSize={fontSize}
              style={style}
              inkColorHex={inkColorHex}
              isAnimating={false}
              animationSpeed={animationSpeed}
              getPaperBgFill={getPaperBgFill}
            />
          </div>
        ))}
      </div>

      {/* Dedicated Visual Quick-Jump Pagination Component */}
      {pages.length > 1 && (
        <div className="w-full mt-5 bg-slate-50 border border-gray-150 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={13} className="text-blue-500" />
              Быстрый навигатор по страницам
            </span>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded-full uppercase">
              Синтезировано страниц: {pages.length}
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {pages.map((page, idx) => {
              const isActive = idx === currentPage;
              const totalGlyphs = page.lines.reduce((acc, l) => acc + l.elements.length, 0);
              const isLined = config.paperType === 'lined';
              const isSquared = config.paperType === 'squared';
              
              // Custom background coloring matching chosen texture
              const miniBgColor = {
                fiber: 'bg-[#faf7f0]',
                copy: 'bg-[#e6e6e4]',
                vintage: 'bg-[#f4ebdb]',
                plain: 'bg-[#fbfcfa]'
              }[config.paperTexture] || 'bg-[#fbfcfa]';

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`flex-shrink-0 flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left cursor-pointer ${
                    isActive
                      ? 'bg-white border-blue-500 shadow-md shadow-blue-500/5 ring-1 ring-blue-500 scale-98'
                      : 'bg-white border-gray-150 hover:border-gray-200 hover:shadow-xs active:scale-95'
                  }`}
                  style={{ width: '135px' }}
                >
                  {/* Miniature Sheet Visualizer */}
                  <div 
                    className={`w-9 h-12 rounded border flex flex-col justify-between p-1 shadow-2xs relative overflow-hidden transition-all flex-shrink-0 ${miniBgColor} ${
                      isActive ? 'border-blue-400' : 'border-gray-250'
                    }`}
                  >
                    {/* Simulated Lines or Squares in Thumbnail */}
                    <div className="flex flex-col gap-1 w-full h-full relative">
                      {isLined && (
                        <div className="flex flex-col gap-[3px] w-full mt-1.5 opacity-60">
                          {Array.from({ length: 5 }).map((_, l) => (
                            <div key={l} className="h-[0.5px] w-full bg-blue-200/90" />
                          ))}
                        </div>
                      )}
                      
                      {isSquared && (
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e1f0fe_1px,transparent_1px),linear-gradient(to_bottom,#e1f0fe_1px,transparent_1px)] bg-[size:3px_3px] opacity-70" />
                      )}
                      
                      {/* Fake tiny handwritten scribbles */}
                      <div className="absolute inset-0 flex flex-col gap-[2px] mt-2 px-0.5 z-10 opacity-75">
                        {Array.from({ length: Math.min(page.lines.length, 3) }).map((_, lIdx) => (
                          <div 
                            key={lIdx} 
                            className="h-[1.2px] bg-slate-700/65 rounded-full" 
                            style={{ width: `${35 + Math.random() * 45}%` }} 
                          />
                        ))}
                      </div>

                      {/* Absolute watermark page number */}
                      <span className={`absolute bottom-0 right-0 text-[8px] font-extrabold px-0.5 rounded select-none ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
                        #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Page specifications */}
                  <div className="flex flex-col justify-center min-w-0">
                    <span className={`text-xs font-bold leading-tight ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                      Страница {idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold truncate leading-none mt-1">
                      Строк: {page.lines.length}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap leading-none mt-0.5">
                      Символов: {totalGlyphs}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes handwritingDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes handwritingFade {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @page {
          size: A4 portrait;
          margin: 0px !important;
        }
        @media screen {
          .print-only-container {
            display: none !important;
          }
          .screen-only-container {
            display: block !important;
          }
        }
        @media print {
          html, body {
            margin: 0px !important;
            padding: 0px !important;
            width: 210mm !important;
            height: 297mm !important;
            overflow: visible !important;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-only-container, .print-only-container * {
            visibility: visible !important;
          }
          .print-only-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 9999999 !important;
            background-color: #ffffff !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            page-break-inside: avoid !important;
            page-break-before: auto !important;
            page-break-after: always !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            box-sizing: border-box !important;
            background-color: #FCFCFA !important;
            position: relative !important;
          }
          .print-page:last-child {
            page-break-after: avoid !important;
          }
          .screen-only-container {
            display: none !important;
          }
        }
      `}</style>

      {printErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] px-4 animate-fade-in" id="print-error-modal">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-150 transform scale-100 transition-transform">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-black text-slate-800 leading-tight">Печать заблокирована браузером</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 leading-relaxed font-semibold">
              Так как приложение запущено во встроенном фрейме (внутри Google AI Studio), ваш веб-браузер блокирует запуск диалогового окна печати в целях безопасности.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Как запустить печать:</h4>
              <ol className="text-xs text-slate-600 font-bold space-y-2 list-decimal list-inside">
                <li>Нажмите кнопку ниже, чтобы открыть приложение в новой вкладке.</li>
                <li>Нажмите там кнопку <strong className="text-blue-600">«Печать»</strong> еще раз. Она сработает мгновенно!</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setPrintErrorModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer"
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
