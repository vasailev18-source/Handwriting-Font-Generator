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
