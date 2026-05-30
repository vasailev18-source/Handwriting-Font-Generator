export interface Point {
  x: number;
  y: number;
}

export type PathCommandType = 'M' | 'L' | 'Q' | 'C' | 'Z';

export interface PathCommand {
  type: PathCommandType;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface GlyphData {
  char: string;
  paths: PathCommand[][]; // Array of subpaths, each containing list of drawing commands
  width: number; // Advance width
}

export interface TemplateCell {
  label: string;
  char: string;
  row: number;
  col: number;
  isLogo?: boolean;
}

export interface TemplatePage {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  cells: TemplateCell[];
}

export interface DeskewCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface FontConfig {
  familyName: string;
  styleName: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
}

// Layer architecture to separate UI guides, editing markers, and clean vector shapes
export type RenderLayerType = 'UI' | 'EDITING' | 'FINAL_RENDER';

export interface RenderLayer {
  type: RenderLayerType;
  visible: boolean;
  opacity: number;
}

export interface RenderPipelineData {
  layers: Record<RenderLayerType, RenderLayer>;
  activeLayer: RenderLayerType;
}

export interface PageConfig {
  paperType: 'lined' | 'grid' | 'craft' | 'blank';
  fontFamily: string;
  inkColor: string;
  penStyle: string;
  lineSpacing: number;
  letterSpacing: number;
  wordSpacing: number;
  tiltVariance: number;
  spacingVariance: number;
  baselineVariance: number;
  strokeThickness: number;
  noiseLevel: number;
  margins: { top: number; bottom: number; left: number; right: number };
  showMargins: boolean;
  curvedLines: boolean;
}

export interface HandwritingStyle {
  id: string;
  name: string;
  creator?: string;
  description?: string;
  slant?: number;
  letterSpacing?: number;
  baselineOffset?: number;
  glyphs?: Record<string, string>;
  useFont?: boolean;
  fontFamily?: string;
  isPrinted?: boolean;
}


