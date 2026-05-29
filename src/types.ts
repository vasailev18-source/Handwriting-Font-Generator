export type InkColor = 'blue' | 'black' | 'red' | 'purple' | 'green' | 'pink' | 'orange' | 'yellow' | 'brown' | 'grey' | 'pencil' | 'felt-blue' | 'felt-pink' | 'marker-yellow';
export type ToolType = 'pen' | 'felt' | 'pencil' | 'colored-pencil' | 'marker' | 'liner';
export type PenStyle = 'ballpoint' | 'fountain' | 'gel';
export type PaperType = 'blank' | 'lined' | 'squared';

export interface HandwritingStyle {
  id: string;
  name: string;
  creator: string;
  description: string;
  isCustom?: boolean;
  slant: number; // base tilt
  letterSpacing: number; // multiplier
  baselineOffset: number; // base baseline placement
  glyphs: Record<string, string>; // character -> list of points/segments encoded as SVG standard paths
  useFont?: boolean;
  fontFamily?: string;
  fontUrl?: string; // custom base64 encoded TTF/OTF data URL or loaded Google Font name
  isPrinted?: boolean;
}

export interface PageConfig {
  paperType: PaperType;
  fontFamily: 'sans' | 'serif';
  inkColor: InkColor;
  toolType?: ToolType;
  penStyle: PenStyle;
  lineSpacing: number; // pixels (e.g., 28px)
  letterSpacing: number; // letter offset fine-tuning
  wordSpacing: number; // space width
  tiltVariance: number; // random tilt variation offset [-5, 5] degrees
  spacingVariance: number; // random horizontal spacing noise
  baselineVariance: number; // wavy baseline, random baseline offset
  strokeThickness: number; // base width of strokes
  noiseLevel: number; // jitters coordinate points slightly
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  showMargins: boolean;
  curvedLines: boolean; // line baselines slightly bend/wave like manual typing
  paperTexture?: 'clean' | 'fiber' | 'copy' | 'vintage'; // Realistic paper styles & scanner filters
  paperEffect?: 'none' | 'shadow' | 'scanner' | 'crumpled'; // Photoreal scanner effects & camera shadows
  textOutlineColor?: string; // Custom text outline color (e.g. for highlights/stroke)
}

export interface GenerationHistory {
  id: string;
  text: string;
  styleId: string;
  date: string;
  paperType: PaperType;
  inkColor: InkColor;
}

export interface TelegramUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramTheme {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
}
