import * as opentype from 'opentype.js';
import { GlyphData, FontConfig } from '../types';
import { isValidCharacterUnicode, isBannedGlyphName } from './contourTracer';

export function buildTrueTypeFont(
  glyphs: GlyphData[],
  config: FontConfig
): ArrayBuffer {
  console.log(`%c[FORENSIC ENTER] buildTrueTypeFont`, "color: #16a34a; font-weight: bold;");
  console.log(`Input glyphs count: ${glyphs.length}`);
  console.log(`Font Family: "${config.familyName}", Style: "${config.styleName}"`);
  console.log(`UnitsPerEm: ${config.unitsPerEm}, Ascender: ${config.ascender}, Descender: ${config.descender}`);
  const startTime = performance.now();

  const opentypeGlyphs: opentype.Glyph[] = [];

  // 1. Every compliance font must have a .notdef glyph as the very first entry (Index 0)
  const notdefPath = new opentype.Path();
  // Draw a standard rectangular placeholder box for .notdef
  notdefPath.moveTo(100, 0);
  notdefPath.lineTo(100, 700);
  notdefPath.lineTo(500, 700);
  notdefPath.lineTo(500, 0);
  notdefPath.lineTo(100, 0);
  // inner box cut-out
  notdefPath.moveTo(150, 50);
  notdefPath.lineTo(450, 50);
  notdefPath.lineTo(450, 650);
  notdefPath.lineTo(150, 650);
  notdefPath.lineTo(150, 50);

  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 600,
    path: notdefPath
  });
  opentypeGlyphs.push(notdefGlyph);

  // 2. Ensure a standard 'space' glyph (Unicode 32) is always added (with empty path, width = 300)
  const hasSpace = glyphs.some(g => g.char === ' ');
  if (!hasSpace) {
    const spaceGlyph = new opentype.Glyph({
      name: 'space',
      unicode: 32,
      advanceWidth: 320,
      path: new opentype.Path()
    });
    opentypeGlyphs.push(spaceGlyph);
  }

  // COLLISION DICTIONARIES FOR TRACING
  const unicodeMap = new Map<number, string>();
  const nameMap = new Map<string, string>();

  // 3. Process all user-created handwriting glyphs
  for (const glyph of glyphs) {
    if (!isValidCharacterUnicode(glyph.char)) {
      console.warn(`  [FORENSIC FONT WARNING] Skipping invalid character '${glyph.char}' during font build`);
      continue;
    }
    
    const glyphName = getGlyphName(glyph.char);
    if (isBannedGlyphName(glyphName)) {
      console.warn(`  [FORENSIC FONT WARNING] Skipping banned glyph name "${glyphName}" during font build`);
      continue;
    }

    // Skip entirely empty glyphs (where all contours were deleted as trash/leaked grid lines)
    if (!glyph.paths || glyph.paths.length === 0) {
      console.warn(`  [FORENSIC FONT WARNING] Skipping empty paths glyph '${glyph.char}' because it contains zero vector shapes`);
      continue;
    }

    const path = new opentype.Path();

    // Map custom command list into opentype Path operations
    for (const subpath of glyph.paths) {
      for (const cmd of subpath) {
        switch (cmd.type) {
          case 'M':
            path.moveTo(cmd.x!, cmd.y!);
            break;
          case 'L':
            path.lineTo(cmd.x!, cmd.y!);
            break;
          case 'Q':
            path.quadraticCurveTo(cmd.x1!, cmd.y1!, cmd.x!, cmd.y!);
            break;
          case 'C':
            path.curveTo(cmd.x1!, cmd.y1!, cmd.x2!, cmd.y2!, cmd.x!, cmd.y!);
            break;
          case 'Z':
            path.close();
            break;
        }
      }
    }

    const optUnicode = glyph.char.length === 1 ? glyph.char.charCodeAt(0) : undefined;

    // Check collisions
    if (optUnicode !== undefined) {
      if (unicodeMap.has(optUnicode)) {
        const otherChar = unicodeMap.get(optUnicode);
        console.error(`%c  [FORENSIC ERROR] UNICODE COLLISION: character '${glyph.char}' and character '${otherChar}' both map to Unicode ${optUnicode} (0x${optUnicode.toString(16)})`, "color: #dc2626; font-weight: bold;");
        if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
          (window as any).__forensic_trace.totalCollisions++;
        }
      } else {
        unicodeMap.set(optUnicode, glyph.char);
      }
    }

    if (nameMap.has(glyphName)) {
      const otherChar = nameMap.get(glyphName);
      console.error(`%c  [FORENSIC ERROR] GLYPH NAME COLLISION: glyph name "${glyphName}" is assigned to character '${glyph.char}' and character '${otherChar}'`, "color: #dc2626; font-weight: bold;");
      if (typeof window !== 'undefined' && (window as any).__forensic_trace) {
        (window as any).__forensic_trace.totalCollisions++;
      }
    } else {
      nameMap.set(glyphName, glyph.char);
    }

    console.log(`  [FONT BUILD GLYPH] Added glyph name: "${glyphName}" | Char: '${glyph.char}' | Unicode: ${optUnicode} | AdvanceWidth: ${glyph.width}`);

    const otGlyph = new opentype.Glyph({
      name: glyphName,
      unicode: optUnicode,
      advanceWidth: glyph.width,
      path: path
    });
    opentypeGlyphs.push(otGlyph);
  }

  // 4. Construct the custom client font
  const font = new opentype.Font({
    familyName: config.familyName.trim() || 'MyHandwriting',
    styleName: config.styleName.trim() || 'Regular',
    unitsPerEm: config.unitsPerEm,
    ascender: config.ascender,
    descender: config.descender,
    glyphs: opentypeGlyphs
  });

  const fontBuffer = font.toArrayBuffer();
  const endTime = performance.now();
  console.log(`%c[FORENSIC EXIT] buildTrueTypeFont`, "color: #16a34a; font-weight: bold;");
  console.log(`  Built font successfully! Total glyphs exported: ${opentypeGlyphs.length}`);
  console.log(`  Created ArrayBuffer of size: ${fontBuffer.byteLength} bytes`);
  console.log(`  Font compile execution time: ${(endTime - startTime).toFixed(2)}ms`);

  return fontBuffer;
}

// Map characters to readable glyph names for OpenType compliance
export function getGlyphName(char: string): string {
  console.log(`%c  [FORENSIC ENTER] getGlyphName for '${char}'`, "color: #15803d; font-size: 11px;");
  let result = '';
  
  if (char === ' ') {
    result = 'space';
  } else if (char.length > 1) {
    // Add unique naming for multi-character ligatures to prevent names collision!
    result = `ligature_${Array.from(char).map(c => c.charCodeAt(0).toString(16)).join('_')}`;
  } else {
    const code = char.charCodeAt(0);
    // Clean translation for Latin letters
    if (char >= 'a' && char <= 'z') {
      result = `uni_latin_lower_${char}`;
    } else if (char >= 'A' && char <= 'Z') {
      result = `uni_latin_upper_${char}`;
    } else if (char >= '0' && char <= '9') {
      result = `uni_digit_${char}`;
    } else if (code >= 0x0400 && code <= 0x052F) {
      // Cyrillic names mapping
      result = `uni_cyrillic_${code.toString(16)}`;
    } else {
      result = `glyph_uni_${code.toString(16)}`;
    }
  }

  console.log(`  [FORENSIC EXIT] getGlyphName result: "${result}"`);
  return result;
}
