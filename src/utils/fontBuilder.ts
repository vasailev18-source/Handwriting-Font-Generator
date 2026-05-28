import * as opentype from 'opentype.js';
import { GlyphData, FontConfig } from '../types';
import { isValidCharacterUnicode, isBannedGlyphName } from './contourTracer';

export function buildTrueTypeFont(
  glyphs: GlyphData[],
  config: FontConfig
): ArrayBuffer {
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

  // 3. Process all user-created handwriting glyphs
  for (const glyph of glyphs) {
    if (!isValidCharacterUnicode(glyph.char)) continue;
    
    const glyphName = getGlyphName(glyph.char);
    if (isBannedGlyphName(glyphName)) continue;

    // Skip entirely empty glyphs (where all contours were deleted as trash/leaked grid lines)
    if (!glyph.paths || glyph.paths.length === 0) continue;

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

    const charCode = glyph.char.charCodeAt(0);

    const otGlyph = new opentype.Glyph({
      name: glyphName,
      unicode: charCode,
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

  return font.toArrayBuffer();
}

// Map characters to readable glyph names for OpenType compliance
function getGlyphName(char: string): string {
  if (char === ' ') return 'space';
  const code = char.charCodeAt(0);
  
  // Clean translation for Latin letters
  if (char >= 'a' && char <= 'z') return `uni_latin_lower_${char}`;
  if (char >= 'A' && char <= 'Z') return `uni_latin_upper_${char}`;
  if (char >= '0' && char <= '9') return `uni_digit_${char}`;

  // Cyrillic names mapping
  if (code >= 0x0400 && code <= 0x052F) {
    return `uni_cyrillic_${code.toString(16)}`;
  }

  return `glyph_uni_${code.toString(16)}`;
}
