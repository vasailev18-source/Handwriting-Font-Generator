import { PageConfig, HandwritingStyle } from '../types';

// Let's create a procedural representation of strokes for characters.
// Each character is defined as a series of strokes (array of coordinate points [x, y] on a 0-100 grid).
// We use a normalized grid of [0, 100] for clean relative scaling.
export type HandStroke = Array<[number, number]>;
export type GlyphStrokes = HandStroke[];

// English & Russian vector glyphs
export const BASE_GLYPHS: Record<string, GlyphStrokes> = {
  // English Lowercase
  'a': [
    [[20, 50], [10, 30], [25, 15], [40, 30], [35, 60], [20, 75], [10, 60], [20, 50], [40, 50], [50, 75], [55, 80]],
  ],
  'b': [
    [[15, 80], [15, 10], [12, 10], [18, 10], [35, 45], [45, 60], [35, 80], [15, 80]],
  ],
  'c': [
    [[45, 30], [40, 15], [20, 15], [10, 45], [15, 75], [35, 80], [45, 65]],
  ],
  'd': [
    [[45, 80], [45, 10], [45, 50], [30, 40], [15, 55], [20, 75], [35, 80], [45, 80], [52, 80]],
  ],
  'e': [
    [[10, 60], [45, 50], [40, 25], [25, 20], [10, 40], [12, 70], [35, 80], [48, 70]],
  ],
  'f': [
    [[20, 80], [30, 15], [35, 5], [40, 15], [22, 95], [18, 95], [25, 50], [45, 50]],
  ],
  'g': [
    [[40, 50], [25, 40], [12, 55], [20, 75], [40, 75], [40, 50], [40, 90], [30, 100], [12, 95], [10, 85], [45, 75]],
  ],
  'h': [
    [[15, 80], [15, 10], [15, 45], [25, 35], [40, 45], [40, 80], [45, 80]],
  ],
  'i': [
    [[20, 45], [20, 80], [28, 80]],
    [[20, 15], [22, 15]], // Dot
  ],
  'j': [
    [[35, 45], [35, 90], [20, 100], [10, 92], [8, 80], [42, 65]],
    [[35, 15], [37, 15]], // Dot
  ],
  'k': [
    [[15, 80], [15, 10], [15, 50], [35, 30], [40, 30], [25, 52], [42, 80], [48, 80]],
  ],
  'l': [
    [[15, 10], [15, 75], [25, 80], [30, 80]],
  ],
  'm': [
    [[10, 80], [10, 40], [10, 45], [20, 35], [28, 55], [28, 80]],
    [[28, 45], [38, 35], [45, 55], [45, 80], [50, 80]],
  ],
  'n': [
    [[10, 80], [10, 40], [12, 45], [22, 35], [35, 55], [35, 80], [42, 80]],
  ],
  'o': [
    [[25, 45], [12, 60], [20, 80], [35, 75], [40, 55], [28, 45], [25, 45], [45, 40]],
  ],
  'p': [
    [[10, 95], [10, 40], [12, 45], [30, 35], [40, 50], [35, 75], [12, 75]],
  ],
  'q': [
    [[35, 50], [25, 40], [12, 55], [20, 75], [35, 75], [35, 50], [35, 95], [45, 100], [45, 80]],
  ],
  'r': [
    [[10, 80], [10, 40], [10, 45], [25, 35], [35, 40], [40, 45]],
  ],
  's': [
    [[10, 75], [25, 80], [40, 70], [25, 60], [15, 50], [30, 35], [40, 45]],
  ],
  't': [
    [[20, 15], [20, 75], [32, 80]],
    [[5, 35], [35, 35]],
  ],
  'u': [
    [[10, 45], [10, 70], [20, 80], [35, 70], [35, 45], [35, 80], [42, 80]],
  ],
  'v': [
    [[10, 45], [18, 75], [30, 80], [40, 45], [46, 42]],
  ],
  'w': [
    [[10, 45], [12, 72], [22, 80], [30, 55], [35, 72], [45, 80], [52, 45], [58, 45]],
  ],
  'x': [
    [[10, 45], [40, 80]],
    [[40, 45], [10, 80]],
  ],
  'y': [
    [[10, 45], [10, 70], [22, 80], [35, 70], [35, 45], [35, 90], [22, 100], [10, 95]],
  ],
  'z': [
    [[10, 45], [40, 45], [15, 75], [40, 75], [42, 75]],
  ],

  // English Uppercase (Basic representations mapped directly)
  'A': [
    [[20, 80], [40, 10], [60, 80]],
    [[30, 50], [50, 50]],
  ],
  'B': [
    [[15, 80], [15, 10]],
    [[15, 10], [45, 15], [40, 45], [15, 45]],
    [[15, 45], [48, 50], [40, 80], [15, 80]],
  ],
  'C': [
    [[50, 20], [25, 15], [15, 45], [22, 75], [45, 80]],
  ],
  'D': [
    [[15, 80], [15, 10]],
    [[15, 10], [45, 20], [45, 70], [15, 80]],
  ],
  'E': [
    [[40, 15], [15, 15], [15, 80], [45, 80]],
    [[15, 48], [35, 48]],
  ],
  'F': [
    [[40, 15], [15, 15], [15, 80]],
    [[15, 45], [35, 45]],
  ],
  'G': [
    [[50, 25], [25, 15], [15, 45], [20, 75], [45, 80], [45, 55], [32, 55]],
  ],
  'H': [
    [[15, 10], [15, 80]],
    [[45, 10], [45, 80]],
    [[15, 45], [45, 45]],
  ],
  'I': [
    [[15, 15], [45, 15]],
    [[30, 15], [30, 75]],
    [[15, 75], [45, 75]],
  ],
  'J': [
    [[15, 15], [45, 15]],
    [[30, 15], [30, 70], [20, 80], [10, 70]],
  ],
  'K': [
    [[15, 10], [15, 80]],
    [[45, 15], [15, 48], [45, 80]],
  ],
  'L': [
    [[15, 10], [15, 80], [45, 80]],
  ],
  'M': [
    [[10, 80], [10, 10], [30, 55], [50, 10], [50, 80]],
  ],
  'N': [
    [[15, 80], [15, 10], [45, 80], [45, 10]],
  ],
  'O': [
    [[30, 10], [12, 35], [15, 65], [30, 80], [48, 65], [45, 35], [30, 10]],
  ],
  'P': [
    [[15, 80], [15, 10], [40, 15], [40, 45], [15, 45]],
  ],
  'Q': [
    [[30, 10], [12, 35], [15, 65], [30, 80], [48, 65], [45, 35], [30, 10]],
    [[35, 60], [50, 82]],
  ],
  'R': [
    [[15, 80], [15, 10], [40, 15], [40, 45], [15, 45]],
    [[15, 45], [35, 55], [45, 80]],
  ],
  'S': [
    [[45, 20], [25, 10], [15, 28], [25, 45], [45, 60], [35, 80], [15, 75]],
  ],
  'T': [
    [[10, 15], [50, 15]],
    [[30, 15], [30, 80]],
  ],
  'U': [
    [[15, 15], [15, 65], [28, 80], [45, 65], [45, 15]],
  ],
  'V': [
    [[15, 15], [30, 80], [45, 15]],
  ],
  'W': [
    [[10, 15], [18, 80], [30, 40], [42, 80], [50, 15]],
  ],
  'X': [
    [[15, 15], [45, 80]],
    [[45, 15], [15, 80]],
  ],
  'Y': [
    [[15, 15], [30, 45], [45, 15]],
    [[30, 45], [30, 80]],
  ],
  'Z': [
    [[15, 15], [45, 15], [15, 80], [45, 80]],
  ],

  // Cyrillic (Russian) Uppercase (Support beautiful cursive Russian shapes)
  'А': [
    [[15, 80], [30, 10], [45, 80]],
    [[20, 50], [40, 50]],
  ],
  'Б': [
    [[15, 80], [15, 10], [45, 10]],
    [[15, 45], [35, 45], [42, 60], [32, 80], [15, 80]],
  ],
  'В': [
    [[15, 80], [15, 10]],
    [[15, 10], [40, 12], [35, 42], [15, 42]],
    [[15, 42], [42, 45], [38, 80], [15, 80]],
  ],
  'Г': [
    [[15, 80], [15, 10], [40, 10]],
  ],
  'Д': [
    [[10, 70], [10, 80], [45, 80], [45, 70]],
    [[15, 70], [25, 10], [35, 70]],
  ],
  'Е': [
    [[40, 15], [15, 15], [15, 80], [40, 80]],
    [[15, 45], [35, 45]],
  ],
  'Ё': [
    [[40, 15], [15, 15], [15, 80], [40, 80]],
    [[15, 45], [35, 45]],
    [[20, 3], [22, 3]], [[30, 3], [32, 3]], // dots
  ],
  'Ж': [
    [[10, 15], [25, 45], [10, 80]],
    [[40, 15], [25, 45], [40, 80]],
    [[25, 10], [25, 80]],
  ],
  'З': [
    [[20, 15], [40, 15], [35, 45], [15, 45]],
    [[15, 45], [42, 48], [35, 80], [15, 80]],
  ],
  'И': [
    [[15, 10], [15, 80], [45, 10], [45, 80]],
  ],
  'Й': [
    [[15, 10], [15, 80], [45, 10], [45, 80]],
    [[20, 3], [32, 5], [40, 3]], // curl
  ],
  'К': [
    [[15, 10], [15, 80]],
    [[40, 15], [15, 45], [42, 80]],
  ],
  'Л': [
    [[10, 80], [25, 10], [40, 80]],
  ],
  'М': [
    [[10, 80], [15, 10], [30, 50], [45, 10], [50, 80]],
  ],
  'Н': [
    [[15, 10], [15, 80]],
    [[45, 10], [45, 80]],
    [[15, 45], [45, 45]],
  ],
  'О': [
    [[30, 10], [15, 35], [15, 65], [30, 80], [45, 65], [45, 35], [30, 10]],
  ],
  'П': [
    [[15, 10], [15, 80]],
    [[40, 10], [40, 80]],
    [[12, 10], [43, 10]],
  ],
  'Р': [
    [[15, 80], [15, 10], [40, 12], [40, 45], [15, 45]],
  ],
  'С': [
    [[45, 20], [20, 15], [15, 45], [20, 75], [45, 80]],
  ],
  'Т': [
    [[10, 10], [45, 10]],
    [[27, 10], [27, 80]],
  ],
  'У': [
    [[15, 10], [25, 45], [40, 10]],
    [[25, 45], [10, 80]],
  ],
  'Ф': [
    [[25, 10], [25, 80]],
    [[25, 20], [10, 25], [10, 50], [25, 55]],
    [[25, 20], [40, 25], [40, 50], [25, 55]],
  ],
  'Х': [
    [[15, 15], [40, 80]],
    [[40, 15], [15, 80]],
  ],
  'Ц': [
    [[15, 10], [15, 75], [40, 75], [40, 10]],
    [[38, 75], [42, 90], [35, 90]],
  ],
  'Ч': [
    [[15, 10], [15, 45], [40, 45], [40, 10]],
    [[40, 45], [40, 80]],
  ],
  'Ш': [
    [[15, 10], [15, 75], [45, 75]],
    [[30, 10], [30, 75]],
    [[45, 10], [45, 75]],
  ],
  'Щ': [
    [[15, 10], [15, 75], [45, 75]],
    [[30, 10], [30, 75]],
    [[45, 10], [45, 75]],
    [[43, 75], [47, 90], [40, 90]],
  ],
  'Ъ': [
    [[10, 15], [22, 15]],
    [[20, 15], [20, 75], [35, 75], [40, 60], [35, 45], [20, 45]],
  ],
  'Ы': [
    [[15, 10], [15, 80]],
    [[15, 45], [30, 45], [35, 60], [30, 75], [15, 75]],
    [[42, 10], [42, 80]],
  ],
  'Ь': [
    [[15, 10], [15, 80]],
    [[15, 45], [30, 45], [35, 60], [30, 75], [15, 75]],
  ],
  'Э': [
    [[15, 20], [38, 15], [40, 45], [15, 45], [40, 45], [38, 75], [15, 80]],
  ],
  'Ю': [
    [[15, 10], [15, 80]],
    [[15, 45], [30, 45]],
    [[40, 15], [30, 35], [32, 65], [40, 80], [52, 65], [50, 35], [40, 15]],
  ],
  'Я': [
    [[40, 80], [40, 10]],
    [[40, 10], [25, 12], [22, 38], [40, 40]],
    [[23, 38], [15, 80]],
  ],

  // Cyrillic Lowercase (Mapped procedurally or key strokes)
  'а': [
    [[20, 50], [10, 30], [25, 15], [40, 30], [35, 60], [20, 75], [10, 60], [20, 50], [40, 50], [50, 80]],
  ],
  'б': [
    [[35, 15], [20, 15], [15, 45], [20, 75], [38, 75], [38, 45], [15, 45]],
  ],
  'в': [
    [[15, 80], [15, 20], [35, 20], [35, 50], [15, 50], [38, 52], [32, 80], [15, 80]],
  ],
  'г': [
    [[15, 45], [35, 45], [35, 80]],
  ],
  'д': [
    [[35, 50], [22, 42], [12, 55], [20, 75], [35, 75], [35, 50], [35, 95], [20, 100]],
  ],
  'е': [
    [[10, 60], [35, 50], [35, 30], [20, 25], [10, 42], [12, 70], [32, 80]],
  ],
  'ё': [
    [[10, 60], [35, 50], [35, 30], [20, 25], [10, 42], [12, 70], [32, 80]],
    [[18, 5], [20, 5]], [[28, 5], [30, 5]],
  ],
  'ж': [
    [[10, 30], [22, 55], [10, 80]],
    [[35, 30], [22, 55], [35, 80]],
    [[22, 25], [22, 80]],
  ],
  'з': [
    [[12, 35], [32, 35], [28, 55], [15, 58], [15, 60], [32, 62], [25, 95], [10, 95]],
  ],
  'и': [
    [[12, 35], [12, 75], [32, 35], [32, 75]],
  ],
  'й': [
    [[12, 35], [12, 75], [32, 35], [32, 75]],
    [[15, 15], [22, 22], [30, 15]],
  ],
  'к': [
    [[12, 30], [12, 80]],
    [[28, 32], [12, 55], [30, 80]],
  ],
  'л': [
    [[10, 75], [20, 35], [32, 80]],
  ],
  'м': [
    [[10, 75], [15, 35], [25, 60], [35, 35], [40, 75]],
  ],
  'н': [
    [[12, 30], [12, 80]],
    [[12, 55], [28, 55]],
    [[28, 30], [28, 80]],
  ],
  'о': [
    [[25, 35], [12, 55], [20, 78], [35, 72], [32, 40], [25, 35]],
  ],
  'п': [
    [[12, 35], [12, 80]],
    [[12, 35], [28, 35]],
    [[28, 35], [28, 80]],
  ],
  'р': [
    [[12, 35], [12, 100]],
    [[12, 35], [28, 35], [28, 70], [12, 70]],
  ],
  'с': [
    [[32, 42], [18, 35], [12, 55], [18, 75], [32, 80]],
  ],
  'т': [
    [[12, 35], [12, 80]],
    [[22, 35], [22, 80]],
    [[32, 35], [32, 80]],
    [[10, 35], [35, 35]],
  ],
  'у': [
    [[12, 35], [20, 65], [32, 35]],
    [[20, 65], [8, 100]],
  ],
  'ф': [
    [[20, 30], [20, 90]],
    [[20, 40], [10, 45], [10, 65], [20, 70]],
    [[20, 40], [30, 45], [30, 65], [20, 70]],
  ],
  'х': [
    [[12, 35], [28, 80]],
    [[28, 35], [12, 80]],
  ],
  'ц': [
    [[12, 35], [12, 75], [28, 75], [28, 35]],
    [[26, 75], [30, 92], [22, 92]],
  ],
  'ч': [
    [[12, 35], [12, 55], [28, 55]],
    [[28, 55], [28, 80]],
  ],
  'ш': [
    [[12, 35], [12, 75], [32, 75]],
    [[22, 35], [22, 75]],
    [[32, 35], [32, 75]],
  ],
  'щ': [
    [[12, 35], [12, 75], [32, 75]],
    [[22, 35], [22, 75]],
    [[32, 35], [32, 75]],
    [[30, 75], [34, 92], [26, 92]],
  ],
  'ъ': [
    [[10, 40], [20, 40]],
    [[18, 40], [18, 75], [30, 75], [35, 62], [30, 52], [18, 52]],
  ],
  'ы': [
    [[12, 35], [12, 80]],
    [[12, 55], [25, 55], [28, 65], [25, 75], [12, 75]],
    [[35, 35], [35, 80]],
  ],
  'ь': [
    [[12, 35], [12, 80]],
    [[12, 50], [25, 50], [28, 65], [25, 75], [12, 75]],
  ],
  'э': [
    [[12, 42], [28, 35], [30, 55], [15, 55], [30, 55], [28, 75], [12, 80]],
  ],
  'ю': [
    [[12, 35], [12, 80]],
    [[12, 55], [22, 55]],
    [[28, 35], [22, 55], [22, 65], [28, 78], [35, 65], [35, 55], [28, 35]],
  ],
  'я': [
    [[28, 80], [28, 35]],
    [[28, 35], [15, 38], [15, 55], [28, 58]],
    [[18, 55], [10, 80]],
  ],

  // Digit characters [0-9]
  '0': [
    [[25, 15], [12, 45], [25, 80], [38, 45], [25, 15]],
  ],
  '1': [
    [[12, 28], [25, 15], [25, 80]],
    [[12, 80], [38, 80]],
  ],
  '2': [
    [[12, 25], [25, 15], [38, 25], [12, 80], [40, 80]],
  ],
  '3': [
    [[12, 20], [35, 20], [20, 45], [38, 52], [32, 80], [12, 75]],
  ],
  '4': [
    [[30, 15], [12, 55], [40, 55]],
    [[30, 15], [30, 80]],
  ],
  '5': [
    [[35, 15], [15, 15], [15, 45], [35, 50], [32, 80], [12, 75]],
  ],
  '6': [
    [[35, 15], [18, 35], [15, 60], [25, 80], [38, 70], [32, 50], [15, 60]],
  ],
  '7': [
    [[12, 18], [38, 18], [18, 80]],
    [[20, 48], [32, 48]],
  ],
  '8': [
    [[25, 45], [12, 30], [25, 15], [38, 30], [25, 45], [12, 65], [25, 80], [38, 65], [25, 45]],
  ],
  '9': [
    [[25, 50], [12, 40], [22, 15], [35, 28], [35, 50], [25, 50], [35, 50], [25, 80]],
  ],

  // Ukrainian uppercase
  'І': [
    [[15, 15], [45, 15]],
    [[30, 15], [30, 75]],
    [[15, 75], [45, 75]],
  ],
  'Ї': [
    [[15, 15], [45, 15]],
    [[30, 15], [30, 75]],
    [[15, 75], [45, 75]],
    [[20, 3], [22, 3]], [[40, 3], [42, 3]],
  ],
  'Є': [
    [[40, 20], [25, 23], [18, 50], [25, 77], [40, 80]],
    [[18, 50], [35, 50]],
  ],
  'Ґ': [
    [[15, 80], [15, 10], [40, 10], [45, 2]],
  ],

  // Ukrainian lowercase
  'і': [
    [[20, 45], [20, 80], [28, 80]],
    [[20, 15], [22, 15]],
  ],
  'ї': [
    [[20, 45], [20, 80], [28, 80]],
    [[14, 15], [16, 15]], [[26, 15], [28, 15]],
  ],
  'є': [
    [[30, 30], [20, 35], [14, 50], [20, 65], [30, 70]],
    [[14, 50], [26, 50]],
  ],
  'ґ': [
    [[15, 30], [22, 18], [24, 30], [35, 30], [35, 80]],
  ],

  // Greek Lowercase & Uppercase & Math/Physics Symbols
  '\\alpha': [
    [[40, 25], [15, 75], [12, 50], [30, 25], [45, 80]],
  ],
  '\\beta': [
    [[15, 95], [15, 15], [35, 25], [25, 50], [15, 50], [38, 60], [28, 85], [15, 85]],
  ],
  '\\gamma': [
    [[15, 15], [25, 85], [35, 98], [40, 85], [15, 45]],
  ],
  '\\delta': [
    [[35, 15], [25, 15], [15, 45], [15, 75], [35, 75], [35, 45], [20, 35]],
  ],
  '\\Delta': [
    [[25, 15], [10, 75], [40, 75], [25, 15]],
  ],
  '\\theta': [
    [[25, 15], [12, 45], [25, 75], [38, 45], [25, 15]],
    [[15, 45], [35, 45]],
  ],
  '\\lambda': [
    [[35, 15], [15, 80]],
    [[25, 45], [40, 80]],
  ],
  '\\mu': [
    [[10, 95], [10, 40], [10, 65], [18, 75], [30, 65], [30, 40], [30, 75]],
  ],
  '\\rho': [
    [[12, 95], [12, 45], [28, 40], [35, 58], [25, 75], [12, 70]],
  ],
  '\\sigma': [
    [[40, 25], [25, 25], [15, 50], [25, 75], [38, 55], [25, 45]],
  ],
  '\\phi': [
    [[25, 15], [12, 45], [25, 75], [38, 45], [25, 15]],
    [[32, 10], [18, 85]],
  ],
  '\\psi': [
    [[12, 25], [14, 65], [25, 80], [36, 65], [38, 25]],
    [[25, 15], [25, 85]],
  ],
  '\\omega': [
    [[10, 45], [12, 72], [20, 80], [26, 55], [32, 80], [40, 72], [42, 45]],
  ],
  '\\Omega': [
    [[10, 75], [20, 75], [20, 45], [25, 20], [35, 20], [40, 45], [40, 75], [50, 75]],
  ],
  '\\degree': [
    [[20, 20], [15, 25], [20, 30], [25, 25], [20, 20]],
  ],
  '\\pm': [
    [[15, 35], [35, 35]],
    [[25, 15], [25, 55]],
    [[15, 75], [35, 75]],
  ],
  '\\times': [
    [[15, 25], [35, 75]],
    [[35, 25], [15, 75]],
  ],
  '\\div': [
    [[15, 50], [35, 50]],
    [[25, 30], [25, 33]],
    [[25, 70], [25, 73]],
  ],
  '\\approx': [
    [[10, 35], [25, 45], [40, 35]],
    [[10, 55], [25, 65], [40, 55]],
  ],
  '\\ne': [
    [[10, 38], [40, 38]],
    [[10, 62], [40, 62]],
    [[35, 15], [15, 85]],
  ],
  '\\neq': [
    [[10, 38], [40, 38]],
    [[10, 62], [40, 62]],
    [[35, 15], [15, 85]],
  ],
  '\\le': [
    [[35, 25], [12, 45], [35, 65]],
    [[12, 78], [35, 78]],
  ],
  '\\ge': [
    [[12, 25], [35, 45], [12, 65]],
    [[12, 78], [35, 78]],
  ],
  '\\partial': [
    [[35, 25], [25, 20], [15, 45], [25, 70], [38, 50], [35, 25], [22, 22]],
  ],
  '\\nabla': [
    [[10, 20], [40, 20], [25, 80], [10, 20]],
  ],
  '\\infty': [
    [[25, 50], [15, 35], [12, 50], [25, 65], [38, 35], [40, 50], [25, 50]],
  ],
  '\\hbar': [
    [[15, 80], [15, 10], [15, 45], [25, 35], [40, 45], [40, 80], [45, 80]],
    [[8, 25], [22, 25]],
  ],
  '[': [
    [[30, 10], [15, 10], [15, 90], [30, 90]],
  ],
  ']': [
    [[15, 10], [30, 10], [30, 90], [15, 90]],
  ],
  '{': [
    [[35, 10], [25, 10], [25, 35], [15, 45], [25, 55], [25, 80], [35, 80]],
  ],
  '}': [
    [[15, 10], [25, 10], [25, 35], [35, 45], [25, 55], [25, 80], [15, 80]],
  ],
  '<': [
    [[35, 20], [15, 50], [35, 80]],
  ],
  '>': [
    [[15, 20], [35, 50], [15, 80]],
  ],

  // Common math symbols
  '+': [
    [[10, 50], [40, 50]],
    [[25, 20], [25, 80]],
  ],
  '-': [
    [[10, 50], [40, 50]],
  ],
  '=': [
    [[10, 38], [40, 38]],
    [[10, 62], [40, 62]],
  ],
  '/': [
    [[10, 85], [40, 15]],
  ],
  '*': [
    [[12, 30], [38, 70]],
    [[38, 30], [12, 70]],
    [[10, 50], [40, 50]],
  ],
  '(': [
    [[35, 10], [20, 25], [15, 50], [20, 75], [35, 90]],
  ],
  ')': [
    [[15, 10], [30, 25], [35, 50], [30, 75], [15, 90]],
  ],
  ',': [
    [[22, 70], [25, 70], [20, 85]],
  ],
  '.': [
    [[22, 73], [24, 73]],
  ],
  '?': [
    [[15, 25], [25, 15], [35, 25], [25, 45], [25, 62]],
    [[25, 80], [27, 80]],
  ],
  '!': [
    [[25, 15], [25, 62]],
    [[25, 80], [27, 80]],
  ],
  ':': [
    [[25, 30], [27, 30]],
    [[25, 70], [27, 70]],
  ],
  ';': [
    [[25, 30], [27, 30]],
    [[25, 65], [27, 65], [22, 80]],
  ],
  '\'': [
    [[28, 15], [30, 15], [26, 30]],
  ],
  '"': [
    [[18, 15], [20, 15], [17, 30]],
    [[28, 15], [30, 15], [27, 30]],
  ],
  '%': [
    [[35, 20], [15, 80]],
    [[18, 25], [19, 25]],
    [[32, 70], [33, 70]],
  ],
  '&': [
    [[38, 30], [28, 15], [18, 30], [28, 50], [14, 75], [30, 80], [42, 65]],
  ],
  '_': [
    [[5, 85], [45, 85]],
  ],
  '#': [
    [[18, 20], [18, 80]],
    [[32, 20], [32, 80]],
    [[10, 35], [40, 35]],
    [[10, 60], [40, 60]],
  ],
  '@': [
    [[35, 50], [25, 40], [15, 55], [25, 70], [35, 60], [35, 50], [35, 80], [20, 85], [10, 65], [15, 45], [30, 30], [42, 55], [38, 75]],
  ],
  '$': [
    [[25, 10], [25, 90]],
    [[35, 25], [20, 20], [15, 35], [25, 48], [35, 60], [30, 75], [15, 70]],
  ],

  // LaTeX integral, summation, root signs
  '\\int': [
    [[35, 10], [28, 12], [24, 25], [24, 75], [20, 88], [12, 90]],
  ],
  '\\sum': [
    [[40, 15], [15, 15], [28, 48], [15, 80], [40, 80]],
  ],
  '\\sqrt': [
    [[10, 55], [14, 55], [18, 90], [24, 15], [50, 15]],
  ],
  '\\pi': [
    [[10, 25], [40, 25]],
    [[18, 25], [16, 80]],
    [[32, 25], [34, 75], [38, 80]],
  ],
  '\\cdot': [
    [[23, 50], [26, 50]],
  ],
  '\\to': [
    [[10, 52], [42, 52]],
    [[42, 52], [32, 42]],
    [[42, 52], [32, 62]],
  ],
  '\\rightarrow': [
    [[10, 52], [42, 52]],
    [[42, 52], [32, 42]],
    [[42, 52], [32, 62]],
  ],
  '→': [
    [[10, 52], [42, 52]],
    [[42, 52], [32, 42]],
    [[42, 52], [32, 62]],
  ],
  'Ә': [
    [[25, 45], [35, 45], [38, 20], [25, 18], [15, 30], [12, 55], [20, 75], [38, 70]]
  ],
  'ә': [
    [[25, 45], [35, 45], [38, 20], [25, 18], [15, 30], [12, 55], [20, 75], [38, 70]]
  ],
  'ү': [
    [[15, 35], [25, 60], [35, 35]],
    [[25, 60], [25, 90], [18, 95]]
  ],
  'Ү': [
    [[15, 20], [25, 50], [35, 20]],
    [[25, 50], [25, 85]]
  ],
  'һ': [
    [[15, 80], [15, 40], [15, 45], [25, 35], [38, 45], [38, 65], [38, 80], [45, 80]]
  ],
  'Һ': [
    [[15, 80], [15, 10], [15, 45], [35, 45], [35, 10], [35, 80]]
  ],
};

export function parseSVGPathToStrokes(pathData: string): Array<Array<[number, number]>> {
  const strokes: Array<Array<[number, number]>> = [];
  const segments = pathData.trim().split('M').filter(Boolean);
  
  segments.forEach(segment => {
    const stroke: Array<[number, number]> = [];
    const points = segment.trim().split('L').filter(Boolean);
    
    points.forEach(point => {
      const coords = point.trim().split(/\s+/).map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        stroke.push([coords[0], coords[1]]);
      }
    });
    
    if (stroke.length > 0) {
      strokes.push(stroke);
    }
  });
  
  return strokes;
}

export function splitWordIntoUnits(word: string): string[] {
  const units: string[] = [];
  let i = 0;
  const ligatures = [
    // Ukrainian apostrophe ligatures (contextual connections)
    '’я', '’ю', '’є', '’ї', '’Я', '’Ю', '’Є', '’Ї',
    '\'я', '\'ю', '\'є', '\'ї', '\'Я', '\'Ю', '\'Є', '\'Ї',
    '‘я', '‘ю', '‘є', '‘ї', '‘Я', '‘Ю', '‘Є', '‘Ї',
    'ʻя', 'ʻю', 'ʻє', 'ʻї', 'ʻЯ', 'ʻЮ', 'ʻЄ', 'ʻЇ',
    'ment',
    'sch', 'and', 'ing', 'ion',
    'ff', 'fi', 'fl', 'ft', 'th', 'te', 'st', 'ch', 'ck', 'sh', 'er', 'en', 'on', 'an', 'of', 'to', 'in', 'is', 'it', 'yo', 're', 'ee', 'oo', 'll', 'tt',
    // Cyrillic ligatures and connections
    'ст', 'по', 'он', 'ен', 'то', 'на', 'ли', 'ко', 'ра', 'ла', 'но', 'ре', 'ть', 'ом', 'пр', 'ве', 'ни', 'го', 'те', 'ки',
    // 1. «Заборный» тип
    'ши', 'иш', 'ии', 'шш', 'ші', 'іш', 'іі', 'ли', 'ил', 'ль', 'ми', 'им', 'мм', 'шл', 'лш', 'мл', 'лм', 'ци', 'иц', 'щи', 'ищ',
    // 2. Верхнее соединение
    'ов', 'ош', 'во', 'вн', 'ви', 'вл', 'бо', 'bi', 'бл',
    // 3. «Ложная латиница»
    'ти', 'ит', 'тт', 'пи', 'ип', 'пп', 'тп', 'пт', 'ди', 'ид',
    // 4. Украинские связки
    'їй', 'її', 'ії', 'вм', 'ьє', 'іє',
    // 1. «Круглые» буквы
    'оо', 'оа', 'ао', 'сс', 'ее', 'ос', 'ас', 'ес', 'ох', 'ах', 'дв', 'дб',
    // 2. Буквы с «Хвостиками»
    'зу', 'уз', 'дз', 'дж', 'цу', 'щу',
    // 3. Сложная анатомия
    'ка', 'ке', 'жж', 'фл', 'фи',
    // 4. Связки с ь, ъ, ы
    'ья', 'ью', 'ье', 'ьо', 'ые', 'ыи'
  ];
  
  while (i < word.length) {
    let matched = false;
    for (const lig of ligatures) {
      if (word.slice(i, i + lig.length).toLowerCase() === lig) {
        units.push(word.slice(i, i + lig.length));
        i += lig.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      units.push(word[i]);
      i++;
    }
  }
  return units;
}

export function getUnitBaseWidth(unit: string, useFont?: boolean, fontFamily?: string): number {
  const getSingleCharWidth = (char: string): number => {
    const isApo = char === '\'' || char === '’' || char === '‘' || char === 'ʻ';
    if (isApo) return useFont ? 6 : 8;

    const isNarrow = char === 'i' || char === 'l' || char === 'j' || char === 't' || char === 'f' ||
                      char === '!' || char === ';' || char === ':' || char === '.' || char === ',' || 
                      char === '1' || char === 'r' || char === 'г' || char === 'ь' || char === 'і' || char === 'ї' ||
                      char === ' ' || char === '(' || char === ')' || char === '/' || char === '\\' || char === '-';

    // Letters that are extra wide (need much more space to prevent overlap)
    const isExtraWide = char === 'm' || char === 'w' || char === 'M' || char === 'W' || 
                        char === 'Ж' || char === 'Ш' || char === 'Щ' || char === 'Ю' || char === 'Ф' || char === 'Ы' || char === 'М' || char === 'Д' ||
                        char === 'ж' || char === 'ш' || char === 'щ' || char === 'ю' || char === 'ф' || char === 'ы' || char === 'м' || char === 'д';

    const isUpper = char !== char.toLowerCase() && !!char.match(/[a-zA-Zа-яА-ЯЁё]/);

    if (useFont) {
      const fontLower = (fontFamily || '').toLowerCase();
      if (fontLower.includes('caveat')) {
        if (isExtraWide) return isUpper ? 42 : 36;
        if (isNarrow) return 13;
        if (isUpper) return 32;
        return 24;
      } else if (fontLower.includes('marck')) {
        if (isExtraWide) return isUpper ? 50 : 44;
        if (isNarrow) return 17;
        if (isUpper) return 38;
        return 31;
      } else if (fontLower.includes('neucha')) {
        if (isExtraWide) return isUpper ? 45 : 39;
        if (isNarrow) return 14;
        if (isUpper) return 33;
        return 27;
      } else if (fontLower.includes('bad')) {
        if (isExtraWide) return isUpper ? 46 : 40;
        if (isNarrow) return 15;
        if (isUpper) return 34;
        return 28;
      }

      if (isExtraWide) return isUpper ? 46 : 40;
      if (isNarrow) return 14;
      if (isUpper) return 34;
      return 28;
    } else {
      // Procedural SVG handdrawn layout
      if (isExtraWide) return isUpper ? 58 : 50;
      if (isNarrow) return 24;
      if (isUpper) return 46;
      return 38;
    }
  };

  if (unit.length <= 1) {
    return getSingleCharWidth(unit);
  }

  let totalWidth = 0;
  for (let i = 0; i < unit.length; i++) {
    totalWidth += getSingleCharWidth(unit[i]);
  }
  // Apply connection packing factor for procedural layout
  return useFont ? totalWidth : totalWidth * 0.94;
}

interface CompositeInfo {
  base: string;
  diacritic: 'umlaut' | 'acute' | 'grave' | 'tilde' | 'cedilla' | 'middle-bar' | 'bottom-hook' | 'breve';
  isCapital: boolean;
}

function getCompositeCharacterInfo(char: string): CompositeInfo | null {
  const map: Record<string, { base: string; diacritic: CompositeInfo['diacritic'] }> = {
    // Umlauts
    'ä': { base: 'a', diacritic: 'umlaut' },
    'ö': { base: 'o', diacritic: 'umlaut' },
    'ü': { base: 'u', diacritic: 'umlaut' },
    'ë': { base: 'e', diacritic: 'umlaut' },
    'ÿ': { base: 'y', diacritic: 'umlaut' },
    'Ä': { base: 'A', diacritic: 'umlaut' },
    'Ö': { base: 'O', diacritic: 'umlaut' },
    'Ü': { base: 'U', diacritic: 'umlaut' },
    
    // Acute accents
    'é': { base: 'e', diacritic: 'acute' },
    'á': { base: 'a', diacritic: 'acute' },
    'í': { base: 'i', diacritic: 'acute' },
    'ó': { base: 'o', diacritic: 'acute' },
    'ú': { base: 'u', diacritic: 'acute' },
    'ý': { base: 'y', diacritic: 'acute' },
    'É': { base: 'E', diacritic: 'acute' },
    'Á': { base: 'A', diacritic: 'acute' },
    'Í': { base: 'I', diacritic: 'acute' },
    'Ó': { base: 'O', diacritic: 'acute' },
    'Ú': { base: 'U', diacritic: 'acute' },
    
    // Grave accents
    'è': { base: 'e', diacritic: 'grave' },
    'à': { base: 'a', diacritic: 'grave' },
    'ù': { base: 'u', diacritic: 'grave' },
    'È': { base: 'E', diacritic: 'grave' },
    'À': { base: 'A', diacritic: 'grave' },
    
    // Tilde
    'ñ': { base: 'n', diacritic: 'tilde' },
    'ã': { base: 'a', diacritic: 'tilde' },
    'Ñ': { base: 'N', diacritic: 'tilde' },
    'Ã': { base: 'A', diacritic: 'tilde' },
    
    // Cedilla / hook
    'ç': { base: 'c', diacritic: 'cedilla' },
    'Ç': { base: 'C', diacritic: 'cedilla' },
    
    // Belarusian
    'ў': { base: 'у', diacritic: 'breve' },
    'Ў': { base: 'У', diacritic: 'breve' },
    
    // Kazakh composites
    'ө': { base: 'о', diacritic: 'middle-bar' },
    'Ө': { base: 'О', diacritic: 'middle-bar' },
    'ұ': { base: 'у', diacritic: 'middle-bar' },
    'Ұ': { base: 'У', diacritic: 'middle-bar' },
    'ғ': { base: 'г', diacritic: 'middle-bar' },
    'Ғ': { base: 'Г', diacritic: 'middle-bar' },
    
    'ң': { base: 'н', diacritic: 'bottom-hook' },
    'Ң': { base: 'Н', diacritic: 'bottom-hook' },
    'қ': { base: 'к', diacritic: 'bottom-hook' },
    'Қ': { base: 'К', diacritic: 'bottom-hook' },
  };

  const res = map[char];
  if (!res) return null;
  // If base letter is uppercase, treat isCapital as true
  const isCapital = char === char.toUpperCase();
  return { base: res.base, diacritic: res.diacritic, isCapital };
}

function getDiacriticStrokes(diacritic: CompositeInfo['diacritic'], isCapital: boolean): Array<Array<[number, number]>> {
  switch (diacritic) {
    case 'umlaut':
      return isCapital
        ? [ [[20, 0], [22, 0]], [[32, 0], [34, 0]] ]
        : [ [[20, 25], [22, 25]], [[32, 25], [34, 25]] ];
    case 'acute':
      return isCapital
        ? [ [[20, 0], [32, -15]] ]
        : [ [[20, 25], [32, 10]] ];
    case 'grave':
      return isCapital
        ? [ [[30, -15], [18, 0]] ]
        : [ [[30, 10], [18, 25]] ];
    case 'tilde':
      return isCapital
        ? [ [[16, -5], [22, -10], [28, 0], [34, -5]] ]
        : [ [[16, 20], [22, 15], [28, 25], [34, 20]] ];
    case 'breve':
      return isCapital
        ? [ [[16, -5], [23, 2], [30, -5]] ]
        : [ [[16, 20], [23, 27], [30, 20]] ];
    case 'cedilla':
      return [ [[25, 80], [28, 92], [20, 96]] ];
    case 'middle-bar':
      return isCapital
        ? [ [[12, 48], [38, 48]] ]
        : [ [[12, 55], [38, 55]] ];
    case 'bottom-hook':
      return isCapital
        ? [ [[38, 80], [45, 96], [32, 99]] ]
        : [ [[33, 80], [40, 96], [28, 99]] ];
    default:
      return [];
  }
}

// Helper to adjust diacritical dots (on і, ї, ё, i, j, й) based on context (previous/next characters)
// to prevent collisions with high tail letters (e.g., б, в, ъ) or double dots (consecutive її, їй, ії)
function applyContextualDotAdjustments(
  char: string,
  strokes: GlyphStrokes,
  prevC?: string,
  nextC?: string
): GlyphStrokes {
  if (!strokes || strokes.length === 0) return strokes;

  const result: GlyphStrokes = strokes.map(st => st.map(p => [...p]));

  const c = char;
  const p = prevC || '';
  const n = nextC || '';

  // Check if previous character ends with a high tail
  const hasHighTail = (str: string): boolean => {
    if (!str) return false;
    const last = str[str.length - 1].toLowerCase();
    return ['б', 'в', 'ъ', 'о', 'o', 'b', 'v', 'w'].includes(last);
  };

  const isDotChar = (str: string): boolean => {
    if (!str) return false;
    const first = str[0].toLowerCase();
    return ['і', 'ї', 'ё', 'i', 'j', 'й'].includes(first);
  };

  // Determine dot/diacritic indices for this specific char
  let dotIndices: number[] = [];
  if (c === 'ё' || c === 'ї') {
    dotIndices = [1, 2];
  } else if (c === 'і' || c === 'i' || c === 'j' || c === 'й') {
    dotIndices = [1];
  } else if (c === 'Ё') {
    dotIndices = [2, 3];
  } else if (c === 'Ї') {
    dotIndices = [3, 4];
  }

  if (dotIndices.length === 0) return result;

  // Let's check offsets:
  let shiftX = 0;
  let shiftY = 0;

  // Scenario 1: Adjacent to another letter with diacritic dots (avoid "dots forest" / collision)
  if (isDotChar(c)) {
    if (isDotChar(n)) {
      // First of a dot/diacritic pair: push slightly left and down
      shiftX += -3;
      shiftY += 4;
    } else if (isDotChar(p)) {
      // Second of a dot/diacritic pair: push slightly right and up
      shiftX += 3;
      shiftY += -4;
    }
  }

  // Scenario 2: Preceded by a letter with a high tail (e.g. 'б', 'ъ', 'в', 'ъё', 'бё' etc.)
  // Raise points higher and shift right to clear the collision path of the tail.
  if (hasHighTail(p)) {
    shiftY += -13; // Move it high up to clear the tail
    shiftX += 5;   // Shift right, so it's placed safely
  }

  // Apply shifts to the specified dot stroke coordinates
  dotIndices.forEach(idx => {
    if (result[idx]) {
      result[idx] = result[idx].map(([x, y]) => [x + shiftX, y + shiftY]);
    }
  });

  return result;
}

// Generates an SVG path data string from glyph strokes
// Applies random slant, spacing variance, baseline wave, and jitter noise
export function renderGlyphToSVGPath(
  char: string,
  startX: number,
  startY: number,
  size: number,
  config: PageConfig,
  charIndex: number,
  lineIndex: number,
  style?: HandwritingStyle,
  prevLastPoint?: [number, number] | null,
  prevUnit?: string,
  nextUnit?: string
): { pathData: string; width: number; firstPoint: [number, number]; lastPoint: [number, number]; useFont?: boolean; rotation?: number } {
  // If style uses a real font-family instead of procedural SVG strokes
  if (style?.useFont) {
    const baseWidth = getUnitBaseWidth(char, true, style?.fontFamily);
    const baseLetterSpacing = style ? style.letterSpacing : 0;
    const localSpacingOffset = config.spacingVariance * Math.cos(charIndex * 2.1 + lineIndex * 0.7);
    const targetCharWidth = (baseWidth * (size / 100)) + localSpacingOffset + config.letterSpacing + baseLetterSpacing;
    
    const baseBaselineOffset = style ? style.baselineOffset : 0;
    const localBaselineOffset = (baseBaselineOffset * (size / 100)) + config.baselineVariance * Math.sin(charIndex * 0.9 + lineIndex * 1.4);
    
    const baseSlant = style ? style.slant : 0;
    const slantAngleDeg = (baseSlant + config.tiltVariance * (Math.sin(charIndex * 1.5 + lineIndex * 2.3)));

    const defaultCoords: [number, number] = [startX, startY + localBaselineOffset];
    return {
      pathData: '',
      width: targetCharWidth,
      firstPoint: defaultCoords,
      lastPoint: [startX + targetCharWidth, startY + localBaselineOffset],
      useFont: true,
      rotation: slantAngleDeg
    };
  }

  // Check if character is in style's custom glyph library
  const aliasMap: Record<string, string> = {
    '’': '\'', '‘': '\'', 'ʻ': '\'',
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'Δ': '\\Delta',
    'ε': 'e',
    'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu', 'ρ': '\\rho', 'σ': '\\sigma',
    'φ': '\\phi', 'ψ': '\\psi', 'ω': '\\omega', 'Ω': '\\Omega',
    '°': '\\degree', '±': '\\pm', '×': '\\times', '÷': '\\div',
    '≈': '\\approx', '≠': '\\ne', '≤': '\\le', '≥': '\\ge',
    '∂': '\\partial', '∇': '\\nabla', '∞': '\\infty', 'ħ': '\\hbar',
    'π': '\\pi', '·': '\\cdot'
  };
  const lookupChar = aliasMap[char] || char;

  let strokes: GlyphStrokes | null = null;
  
  if (style?.glyphs?.[lookupChar]) {
    const customPath = style.glyphs[lookupChar];
    if (typeof customPath === 'string' && customPath.trim().length > 0) {
      strokes = parseSVGPathToStrokes(customPath);
    }
  }
  
  // Fallback to BASE_GLYPHS
  if (!strokes || strokes.length === 0) {
    strokes = BASE_GLYPHS[lookupChar];
  }
  
  // Try case insensitivity if full glyph is missing
  if (!strokes) {
    let fallbackChar = '';
    if (lookupChar.toLowerCase() !== lookupChar && BASE_GLYPHS[lookupChar.toLowerCase()]) {
      fallbackChar = lookupChar.toLowerCase();
    } else if (lookupChar.toUpperCase() !== lookupChar && BASE_GLYPHS[lookupChar.toUpperCase()]) {
      fallbackChar = lookupChar.toUpperCase();
    }
    
    if (fallbackChar && style?.glyphs?.[fallbackChar]) {
      const customPath = style.glyphs[fallbackChar];
      if (typeof customPath === 'string' && customPath.trim().length > 0) {
        strokes = parseSVGPathToStrokes(customPath);
      }
    }
    
    if (!strokes && fallbackChar) {
      strokes = BASE_GLYPHS[fallbackChar];
    }
  }

  // If still no strokes, let's build using composite rules for international diacritics
  if (!strokes || strokes.length === 0) {
    const compositeInfo = getCompositeCharacterInfo(lookupChar);
    if (compositeInfo) {
      let baseStrokes: GlyphStrokes | null = null;
      const baseChar = compositeInfo.base;
      if (style?.glyphs?.[baseChar]) {
        const customPath = style.glyphs[baseChar];
        if (typeof customPath === 'string' && customPath.trim().length > 0) {
          baseStrokes = parseSVGPathToStrokes(customPath);
        }
      }
      if (!baseStrokes || baseStrokes.length === 0) {
        baseStrokes = BASE_GLYPHS[baseChar];
      }
      if (baseStrokes && baseStrokes.length > 0) {
        const cloned: GlyphStrokes = baseStrokes.map(st => st.map(p => [...p]));
        const diacritics = getDiacriticStrokes(compositeInfo.diacritic, compositeInfo.isCapital);
        strokes = [...cloned, ...diacritics];
      }
    }
  }

  // If still no strokes and the character is a multi-character ligature, synthesize it!
  if ((!strokes || strokes.length === 0) && lookupChar.length > 1) {
    let combinedStrokes: GlyphStrokes = [];
    let shiftX = 0;
    for (let c = 0; c < lookupChar.length; c++) {
      const singleChar = lookupChar[c];
      let singleStrokes: GlyphStrokes | null = null;
      if (style?.glyphs?.[singleChar]) {
        const customPath = style.glyphs[singleChar];
        if (typeof customPath === 'string' && customPath.trim().length > 0) {
          singleStrokes = parseSVGPathToStrokes(customPath);
        }
      }
      if (!singleStrokes || singleStrokes.length === 0) {
        singleStrokes = BASE_GLYPHS[singleChar];
      }
      if (!singleStrokes || singleStrokes.length === 0) {
        const fallbackC = singleChar.toLowerCase();
        if (BASE_GLYPHS[fallbackC]) {
          singleStrokes = BASE_GLYPHS[fallbackC];
        } else {
          const fallbackU = singleChar.toUpperCase();
          if (BASE_GLYPHS[fallbackU]) {
            singleStrokes = BASE_GLYPHS[fallbackU];
          }
        }
      }
      if (singleStrokes && singleStrokes.length > 0) {
        const adjustedStrokes = applyContextualDotAdjustments(
          singleChar,
          singleStrokes,
          c > 0 ? lookupChar[c - 1] : prevUnit,
          c < lookupChar.length - 1 ? lookupChar[c + 1] : nextUnit
        );
        const clonedShifted = adjustedStrokes.map(st => st.map(([px, py]) => [px + shiftX, py] as [number, number]));
        
        // Add a beautiful handwriting cursive connecting transition stroke from previous letter to the next
        if (combinedStrokes.length > 0) {
          const prevStroke = combinedStrokes[combinedStrokes.length - 1];
          const nextStroke = clonedShifted[0];
          if (prevStroke && prevStroke.length > 0 && nextStroke && nextStroke.length > 0) {
            const lastPt = prevStroke[prevStroke.length - 1];
            const firstPt = nextStroke[0];
            
            const isPrevApo = ['\'', '’', '‘', 'ʻ'].includes(lookupChar[c - 1]);
            let connector: Array<[number, number]>;
            if (isPrevApo) {
              // The connector sweeps down from the tail of the apostrophe to the starting position of the next letter
              const midX = lastPt[0] - 2;
              const midY = (lastPt[1] + firstPt[1]) / 2 + 6;
              connector = [
                [lastPt[0], lastPt[1]],
                [midX, midY],
                [firstPt[0], firstPt[1]]
              ];
            } else {
              const midX = lastPt[0] * 0.4 + firstPt[0] * 0.6;
              const midY = Math.min(90, Math.max(lastPt[1], firstPt[1]) + 4);
              connector = [
                [lastPt[0], lastPt[1]],
                [midX, midY],
                [firstPt[0], firstPt[1]]
              ];
            }
            combinedStrokes.push(connector);
          }
        }
        
        combinedStrokes = [...combinedStrokes, ...clonedShifted];
        const isApostrophe = ['\'', '’', '‘', 'ʻ'].includes(singleChar);
        const baseW = isApostrophe ? 8 : (['m', 'w', 'М', 'Ш', 'Щ', 'Ю', 'Ж', 'W', 'M'].includes(singleChar) ? 46 : 30);
        shiftX += baseW;
      }
    }
    if (combinedStrokes.length > 0) {
      strokes = combinedStrokes;
    }
  }

  // Final fallback
  if (!strokes) {
    const defaultCoords: [number, number] = [startX, startY];
    if (char === ' ') {
      return { pathData: '', width: config.wordSpacing, firstPoint: defaultCoords, lastPoint: defaultCoords };
    }
    strokes = [
      [[10, 20], [40, 20], [40, 80], [10, 80], [10, 20]]
    ];
  }

  // Dynamic context-aware diacritical dot adjustment for single character renderings
  if (strokes && strokes.length > 0 && lookupChar.length === 1) {
    strokes = applyContextualDotAdjustments(lookupChar, strokes, prevUnit, nextUnit);
  }

  // Clone strokes so we can safely add dynamic serif decorations if needed
  let finalStrokes: GlyphStrokes = strokes.map(stroke => stroke.map(pt => [...pt] as [number, number]));

  // Prevent "stamp effect" on adjacent repeating identical letters (e.g., ll, ee, нн, сс, її)
  // by applying asymmetric geometric deformations to make them look distinct and hand-drawn.
  const isRepeatingDuplicate = !!(prevUnit && char.toLowerCase() === prevUnit.toLowerCase());
  const isFirstOfDuplicate   = !!(nextUnit && char.toLowerCase() === nextUnit.toLowerCase());

  if (isRepeatingDuplicate || isFirstOfDuplicate) {
    // Determine dynamic deforms deterministically per position
    let defX = 1.0;
    let defY = 1.0;
    let offsetShiftX = 0;
    let offsetShiftY = 0;

    if (isFirstOfDuplicate) {
      // First character of the repeating pair: slightly taller, narrower, shifted slightly up
      defX = 0.92;
      defY = 1.06;
      offsetShiftY = -3.5;
      offsetShiftX = -1.5;
    } else if (isRepeatingDuplicate) {
      // Second character of the repeating pair: slightly shorter, wider, shifted slightly down
      defX = 1.08;
      defY = 0.91;
      offsetShiftY = 3.5;
      offsetShiftX = 1.5;
    }

    // Apply the deformation to finalStrokes (scaled around the logical center of the letter grid x=25, y=45)
    finalStrokes = finalStrokes.map(stroke =>
      stroke.map(([px, py]) => {
        const dx = px - 25;
        const dy = py - 45;
        return [
          25 + dx * defX + offsetShiftX,
          45 + dy * defY + offsetShiftY
        ] as [number, number];
      })
    );
  }

  // Standard serif generation logic
  if (config.fontFamily === 'serif' && char !== ' ') {
    const isAlphanumeric = /^[a-zA-Zа-яА-Я0-9ёЁ]$/.test(char);
    if (isAlphanumeric) {
      const serifStrokes: GlyphStrokes = [];
      finalStrokes.forEach((stroke) => {
        if (stroke.length >= 2) {
          const startPoint = stroke[0];
          const endPoint = stroke[stroke.length - 1];
          const distStartEnd = Math.hypot(startPoint[0] - endPoint[0], startPoint[1] - endPoint[1]);
          if (distStartEnd < 8) return; // Closed loop (e.g., 'o', '0', 'O')

          let totalLength = 0;
          for (let i = 0; i < stroke.length - 1; i++) {
            totalLength += Math.hypot(stroke[i + 1][0] - stroke[i][0], stroke[i + 1][1] - stroke[i][1]);
          }
          if (totalLength < 15) return; // Mini accent or dot (e.g., 'i' dots)

          // Start point serif
          const dxStart = stroke[1][0] - stroke[0][0];
          const dyStart = stroke[1][1] - stroke[0][1];
          const lenStart = Math.hypot(dxStart, dyStart);
          if (lenStart > 0.1) {
            const ux = dxStart / lenStart;
            const uy = dyStart / lenStart;
            const px = -uy;
            const py = ux;
            const serifLen = 5.5;
            serifStrokes.push([
              [stroke[0][0] - px * serifLen, stroke[0][1] - py * serifLen],
              [stroke[0][0] + px * serifLen, stroke[0][1] + py * serifLen]
            ]);
          }

          // End point serif
          const n = stroke.length - 1;
          const dxEnd = stroke[n][0] - stroke[n - 1][0];
          const dyEnd = stroke[n][1] - stroke[n - 1][1];
          const lenEnd = Math.hypot(dxEnd, dyEnd);
          if (lenEnd > 0.1) {
            const ux = dxEnd / lenEnd;
            const uy = dyEnd / lenEnd;
            const px = -uy;
            const py = ux;
            const serifLen = 5.5;
            serifStrokes.push([
              [stroke[n][0] - px * serifLen, stroke[n][1] - py * serifLen],
              [stroke[n][0] + px * serifLen, stroke[n][1] + py * serifLen]
            ]);
          }
        }
      });
      finalStrokes = [...finalStrokes, ...serifStrokes];
    }
  }

  // Calculate dynamic slant factor based on average slant of cursive
  // Plus minor tilt variance per character
  let baseSlant = style ? style.slant : 0;
  if (isFirstOfDuplicate) {
    baseSlant += 4.5; // Slight forward lean for first duplicate
  } else if (isRepeatingDuplicate) {
    baseSlant -= 4.5; // Slight backward/upright lean for second duplicate to create stylistic rhythm
  }

  const slantAngleDeg = (baseSlant + config.tiltVariance * (Math.sin(charIndex * 1.5 + lineIndex * 2.3)));
  const slantRad = (slantAngleDeg * Math.PI) / 180;
  const slantFactor = Math.tan(slantRad);

  // Spacing variance per character
  const localSpacingOffset = config.spacingVariance * Math.cos(charIndex * 2.1 + lineIndex * 0.7);
  
  // Baseline wave (baseline offset variance)
  const baseBaselineOffset = style ? style.baselineOffset : 0;
  const localBaselineOffset = (baseBaselineOffset * (size / 100)) + config.baselineVariance * Math.sin(charIndex * 0.9 + lineIndex * 1.4);

  let pathString = '';
  
  // Determine actual width to allocate for this character
  // Default cell size on grid is 50, standard characters are scaled
  const baseWidth = getUnitBaseWidth(char, false, style?.fontFamily);
  const baseLetterSpacing = style ? style.letterSpacing : 0;
  let targetCharWidth = (baseWidth * (size / 100)) + localSpacingOffset + config.letterSpacing + baseLetterSpacing;

  if (isFirstOfDuplicate) {
    targetCharWidth *= 0.94; // slightly narrower allocation
  } else if (isRepeatingDuplicate) {
    targetCharWidth *= 1.06; // slightly wider allocation
  }

  // Let's calculate absolute first & last connection coordinates of this glyph
  let firstPoint: [number, number] = [startX, startY + localBaselineOffset];
  let lastPoint: [number, number] = [startX + targetCharWidth, startY + localBaselineOffset];

  // Set the precise coordinates based on actual character baseline shape
  if (finalStrokes.length > 0 && finalStrokes[0].length > 0) {
    const [px, py] = finalStrokes[0][0];
    const scaledX = (px * (size / 100));
    const scaledY = (py * (size / 100));
    const skewedX = scaledX + (scaledY * slantFactor);
    firstPoint = [startX + skewedX, startY + (py - 50) * (size / 100) + localBaselineOffset];
  }
  if (finalStrokes.length > 0) {
    const lastSt = finalStrokes[finalStrokes.length - 1];
    if (lastSt.length > 0) {
      const [px, py] = lastSt[lastSt.length - 1];
      const scaledX = (px * (size / 100));
      const scaledY = (py * (size / 100));
      const skewedX = scaledX + (scaledY * slantFactor);
      lastPoint = [startX + skewedX, startY + (py - 50) * (size / 100) + localBaselineOffset];
    }
  }

  // Draw natural letter connection in cursive mode (if config is not purely mechanical/sans printing)
  const isCursive = style && style.id !== 'minimalist-print' && style.id !== 'architect-draft' && (style.slant > 3 || style.letterSpacing < 4);
  let connectorPath = '';
  if (isCursive && prevLastPoint && char !== ' ') {
    const cpX = (prevLastPoint[0] + firstPoint[0]) / 2;
    // Connective dip matching speed and style line heights
    const cpY = Math.max(prevLastPoint[1], firstPoint[1]) + 2 + (config.noiseLevel * 0.5);
    connectorPath = `M ${prevLastPoint[0].toFixed(1)} ${prevLastPoint[1].toFixed(1)} Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${firstPoint[0].toFixed(1)} ${firstPoint[1].toFixed(1)}`;
  }

  // Deterministic seed mapping for unique letter variations (so no two 'e' or 'a' are identical)
  const charSeed = charIndex * 13.9 + lineIndex * 31.7 + (char.charCodeAt(0) || 0) * 7.3;

  if (connectorPath) {
    pathString += connectorPath + ' ';
  }

  finalStrokes.forEach((stroke, strokeIdx) => {
    let strokeString = '';
    stroke.forEach(([px, py], pointIdx) => {
      // Calculate individual control points perturbations based on specific coordinate seeds
      const ptSeed = charSeed + strokeIdx * 23.3 + pointIdx * 11.9;
      
      // Dynamic coordinate shake based on the selected noise/neatness level
      const coordJitterX = config.noiseLevel > 0 
        ? Math.sin(ptSeed * 1.5) * config.noiseLevel * 0.45
        : 0;
      const coordJitterY = config.noiseLevel > 0 
        ? Math.cos(ptSeed * 1.8) * config.noiseLevel * 0.45
        : 0;

      // Scale coordinates from normalized 0..100 grid to target size
      const scaledX = (px * (size / 100));
      const scaledY = (py * (size / 100));

      // Global random micro-shake per rendering
      const globalJitterX = config.noiseLevel > 0 
        ? (Math.sin(charIndex * 4.1) * 0.1 * config.noiseLevel)
        : 0;
      const globalJitterY = config.noiseLevel > 0 
        ? (Math.cos(charIndex * 4.1) * 0.1 * config.noiseLevel)
        : 0;

      // Apply tilt (skew) modification
      const skewedX = scaledX + (scaledY * slantFactor);

      // Final dynamic placement position (subtract 50 * size / 100 to align baseline correctly)
      const finalX = startX + skewedX + coordJitterX + globalJitterX;
      const finalY = startY + (py - 50) * (size / 100) + localBaselineOffset + coordJitterY + globalJitterY;

      if (pointIdx === 0) {
        strokeString += `M ${finalX.toFixed(1)} ${finalY.toFixed(1)}`;
      } else {
        strokeString += ` L ${finalX.toFixed(1)} ${finalY.toFixed(1)}`;
      }
    });
    pathString += strokeString + ' ';
  });

  return {
    pathData: pathString.trim(),
    width: targetCharWidth,
    firstPoint,
    lastPoint
  };
}

// Splits clean text into formatted lines for multipage wrapping
export interface WrappedLine {
  text: string;
  isLaTeX?: boolean;
}

export interface RenderedPage {
  lines: Array<{
    y: number;
    elements: Array<{
      type: 'text' | 'latex' | 'table' | 'form_line';
      pathData?: string;
      char?: string;
      x: number;
      y: number;
      width: number;
      latexExpression?: string; // for rendering formulas in SVG
      useFont?: boolean;
      fontFamily?: string;
      rotation?: number;
      isPrinted?: boolean;
      isUnderlined?: boolean;
      isLine?: boolean;
      label?: string;
      
      // Table properties
      tableStyle?: 'ruler' | 'handdrawn' | 'printed';
      tableRows?: string[][];
      tableHeight?: number;
    }>;
  }>;
}

// Computes wrapped lines based on width margins of A4
// Standard A4 dimensions in pixels at 72 PPI are 595 x 842.
// We use A4 standard 794 x 1123 pixels (matching high quality print aspect ratio)
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;

export function wrapTextIntoPages(
  text: string,
  config: PageConfig,
  style?: HandwritingStyle,
  fontSize: number = 24,
  availableStyles: HandwritingStyle[] = []
): Array<RenderedPage> {
  const processedText = preprocessUserTextMath(text);
  const pages: Array<RenderedPage> = [];
  const lines = processedText.split('\n');
  const maxLineWidth = PAGE_WIDTH - config.margins.left - config.margins.right;
  const maxLinesPerPage = Math.floor(
    (PAGE_HEIGHT - config.margins.top - config.margins.bottom) / config.lineSpacing
  );

  let currentPageLines: RenderedPage['lines'] = [];
  let currentY = config.margins.top;
  let lineIndex = 0;

  // Let's helper function to tokenize line inline
  const tokenizeLine = (
    lineText: string, 
    defaultStyle: HandwritingStyle
  ): any[] => {
    const items: any[] = [];
    let i = 0;
    
    const styleStack: HandwritingStyle[] = [defaultStyle];
    const getCurrentStyle = () => styleStack[styleStack.length - 1] || defaultStyle;

    const findStyle = (idOrName: string): HandwritingStyle | undefined => {
      const s = availableStyles.find(x => x.id === idOrName || x.name === idOrName);
      if (s) return s;
      
      const term = idOrName.toLowerCase();
      // Font fallbacks
      if (term.includes('caveat')) {
        return { id: 'caveat-font', name: 'Caveat', creator: 'Ольга К.', description: '', slant: 3, letterSpacing: 2.5, baselineOffset: 1, glyphs: {}, useFont: true, fontFamily: 'Caveat' };
      }
      if (term.includes('marck')) {
        return { id: 'marck-font', name: 'Marck Script', creator: 'Елена В.', description: '', slant: 8, letterSpacing: 1.0, baselineOffset: 3, glyphs: {}, useFont: true, fontFamily: 'Marck Script' };
      }
      if (term.includes('badscript') || term.includes('bad script')) {
        return { id: 'badscript-font', name: 'Bad Script', creator: 'Николай П.', description: '', slant: 4, letterSpacing: 1.8, baselineOffset: 2, glyphs: {}, useFont: true, fontFamily: 'Bad Script' };
      }
      if (term.includes('neucha')) {
        return { id: 'neucha-font', name: 'Neucha', creator: 'Павел С.', description: '', slant: 0, letterSpacing: 3.5, baselineOffset: 1, glyphs: {}, useFont: true, fontFamily: 'Neucha' };
      }
      if (term === 'serif' || term === 'print-serif') {
        return {
          id: 'print-serif',
          name: '🖨️ Печатный Serif',
          creator: 'Типография',
          description: 'Times New Roman',
          slant: 0,
          letterSpacing: 2.0,
          baselineOffset: 0,
          glyphs: {},
          useFont: true,
          fontFamily: '"Times New Roman", Times, serif',
          isPrinted: true
        };
      }
      if (term === 'sans' || term === 'print-sans') {
        return {
          id: 'print-sans',
          name: '🖨️ Печатный Sans',
          creator: 'Типография',
          description: 'Arial',
          slant: 0,
          letterSpacing: 2.0,
          baselineOffset: 0,
          glyphs: {},
          useFont: true,
          fontFamily: '"Inter", "Arial", sans-serif',
          isPrinted: true
        };
      }
      if (term === 'mono' || term === 'print-mono') {
        return {
          id: 'print-mono',
          name: '🖨️ Печатная машинка',
          creator: 'Машинка',
          description: 'Courier New',
          slant: 0,
          letterSpacing: 2.5,
          baselineOffset: 0,
          glyphs: {},
          useFont: true,
          fontFamily: '"Courier New", Courier, monospace',
          isPrinted: true
        };
      }
      return undefined;
    };

    while (i < lineText.length) {
      if (lineText[i] === '[') {
        const closeBracketIndex = lineText.indexOf(']', i);
        if (closeBracketIndex !== -1) {
          const tagContent = lineText.slice(i + 1, closeBracketIndex).trim();
          
          if (tagContent.startsWith('style:')) {
            const styleId = tagContent.replace('style:', '').trim();
            const targetStyle = findStyle(styleId) || defaultStyle;
            styleStack.push(targetStyle);
            i = closeBracketIndex + 1;
            continue;
          } else if (tagContent === '/style') {
            if (styleStack.length > 1) {
              styleStack.pop();
            }
            i = closeBracketIndex + 1;
            continue;
          } else if (tagContent === 'print') {
            const printStyle = findStyle('print-serif') || defaultStyle;
            styleStack.push(printStyle);
            i = closeBracketIndex + 1;
            continue;
          } else if (tagContent === '/print') {
            if (styleStack.length > 1) {
              styleStack.pop();
            }
            i = closeBracketIndex + 1;
            continue;
          } else if (tagContent.startsWith('print:')) {
            const printType = tagContent.replace('print:', '').trim();
            const printStyle = findStyle('print-' + printType) || findStyle(printType) || defaultStyle;
            styleStack.push(printStyle);
            i = closeBracketIndex + 1;
            continue;
          } else if (tagContent.startsWith('line:')) {
            const parts = tagContent.split(':');
            const widthStr = parts[1] || '150';
            const labelStr = parts[2] || '';
            const widthVal = parseInt(widthStr, 10) || 150;
            items.push({
              type: 'form_line_start',
              width: widthVal,
              label: labelStr
            });
            i = closeBracketIndex + 1;
            continue;
          } else if (tagContent === '/line') {
            items.push({ type: 'form_line_end' });
            i = closeBracketIndex + 1;
            continue;
          }
        }
      }

      if (lineText[i] === ' ') {
        items.push({ type: 'space' });
        i++;
      } else {
        const wordChars: Array<{ char: string; style: HandwritingStyle }> = [];
        while (i < lineText.length && lineText[i] !== ' ') {
          if (lineText[i] === '[') {
            const closeBracketIndex = lineText.indexOf(']', i);
            if (closeBracketIndex !== -1) {
              const tagContent = lineText.slice(i + 1, closeBracketIndex).trim();
              if (tagContent.startsWith('style:') || tagContent === '/style' || tagContent === 'print' || tagContent === '/print' || tagContent.startsWith('print:') || tagContent.startsWith('line:') || tagContent === '/line') {
                break;
              }
            }
          }
          wordChars.push({
            char: lineText[i],
            style: getCurrentStyle()
          });
          i++;
        }
        if (wordChars.length > 0) {
          items.push({
            type: 'word',
            chars: wordChars
          });
        }
      }
    }

    return items;
  };

  const defaultGlobalStyle = style || {
    id: 'caveat-font',
    name: 'Caveat',
    creator: 'Ольга К.',
    description: '',
    slant: 3,
    letterSpacing: 2.5,
    baselineOffset: 1,
    glyphs: {},
    useFont: true,
    fontFamily: 'Caveat'
  };

  let i = 0;
  while (i < lines.length) {
    const originalLine = lines[i];
    const trimmed = originalLine.trim();

    // Check if line is a table specifier or markdown table starts
    let tableStyle: 'ruler' | 'handdrawn' | 'printed' = 'handdrawn';
    let isTableBlock = false;
    let tableLines: string[] = [];

    if (trimmed.startsWith('[table:printed]') || trimmed.startsWith('[table:print]')) {
      tableStyle = 'printed';
      isTableBlock = true;
      i++; // skip specifier line
      while (i < lines.length && !lines[i].trim().includes('[endtable]')) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
          tableLines.push(line);
        }
        i++;
      }
      if (i < lines.length && lines[i].trim().includes('[endtable]')) {
        i++; // skip [endtable]
      }
    } else if (trimmed.startsWith('[table:ruler]') || trimmed.startsWith('[table:straight]')) {
      tableStyle = 'ruler';
      isTableBlock = true;
      i++; // skip specifier line
      while (i < lines.length && !lines[i].trim().includes('[endtable]')) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
          tableLines.push(line);
        }
        i++;
      }
      if (i < lines.length && lines[i].trim().includes('[endtable]')) {
        i++; // skip [endtable]
      }
    } else if (trimmed.startsWith('[table:handdrawn]') || trimmed.startsWith('[table:hand]')) {
      tableStyle = 'handdrawn';
      isTableBlock = true;
      i++; // skip specifier line
      while (i < lines.length && !lines[i].trim().includes('[endtable]')) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
          tableLines.push(line);
        }
        i++;
      }
      if (i < lines.length && lines[i].trim().includes('[endtable]')) {
        i++; // skip [endtable]
      }
    } else if (trimmed.startsWith('|')) {
      // Automatic markdown table detection
      tableStyle = 'handdrawn'; // default to handdrawn
      isTableBlock = true;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (line.startsWith('|')) {
          tableLines.push(line);
          i++;
        } else {
          break;
        }
      }
    }

    if (isTableBlock && tableLines.length > 0) {
      // Process tableLines into table row matrices
      const rows: string[][] = [];
      tableLines.forEach(tLine => {
        const cells = tLine.split('|')
          .map(c => c.trim())
          .filter((c, idx, arr) => {
            if (idx === 0 && tLine.startsWith('|') && c === '') return false;
            if (idx === arr.length - 1 && tLine.endsWith('|') && c === '') return false;
            return true;
          });
        const isDashLine = cells.every(c => c.match(/^[- :]+$/));
        if (!isDashLine && cells.length > 0) {
          rows.push(cells);
        }
      });

      if (rows.length > 0) {
        const rowHeight = config.lineSpacing * 1.6;
        const tableHeight = rows.length * rowHeight;

        // Page break check
        if (currentY + tableHeight > PAGE_HEIGHT - config.margins.bottom && currentPageLines.length > 0) {
          pages.push({ lines: currentPageLines });
          currentPageLines = [];
          currentY = config.margins.top;
        }

        currentPageLines.push({
          y: currentY,
          elements: [{
            type: 'table',
            x: config.margins.left,
            y: currentY,
            width: maxLineWidth,
            tableStyle: tableStyle,
            tableRows: rows,
            tableHeight: tableHeight
          } as any]
        });

        currentY += tableHeight + config.lineSpacing;
        lineIndex++;

        if (currentY + config.lineSpacing > PAGE_HEIGHT - config.margins.bottom) {
          pages.push({ lines: currentPageLines });
          currentPageLines = [];
          currentY = config.margins.top;
        }

        continue;
      }
    }

    // Check if line is LaTeX formula
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
      const formula = trimmed.slice(2, -2).trim();
      
      if (currentY + config.lineSpacing * 1.8 > PAGE_HEIGHT - config.margins.bottom) {
        pages.push({ lines: currentPageLines });
        currentPageLines = [];
        currentY = config.margins.top;
      }

      const formulaWidth = measureLaTeXFormula(formula, fontSize, config, style);

      currentPageLines.push({
        y: currentY,
        elements: [{
          type: 'latex',
          x: config.margins.left + (maxLineWidth / 2) - (formulaWidth / 2),
          y: currentY,
          width: formulaWidth,
          latexExpression: formula
        }]
      });
      currentY += Math.max(config.lineSpacing * 1.8, 55);
      lineIndex++;
      i++;
      continue;
    }

    // Standard text wrapping using advanced visual parsing
    const visualItems = tokenizeLine(originalLine, defaultGlobalStyle);
    let currentX = config.margins.left;
    let currentLineElements: RenderedPage['lines'][0]['elements'] = [];
    let activeFormLineEndCoord: number | null = null;

    visualItems.forEach((item: any) => {
      if (item.type === 'space') {
        currentX += config.wordSpacing;
        return;
      }

      if (item.type === 'form_line_start') {
        // Enforce form line fit check
        if (currentX + item.width > PAGE_WIDTH - config.margins.right) {
          if (currentLineElements.length > 0) {
            currentPageLines.push({
              y: currentY,
              elements: currentLineElements
            });
            currentLineElements = [];
            currentY += config.lineSpacing;
            lineIndex++;

            if (currentY + config.lineSpacing > PAGE_HEIGHT - config.margins.bottom) {
              pages.push({ lines: currentPageLines });
              currentPageLines = [];
              currentY = config.margins.top;
            }
          }
          currentX = config.margins.left;
        }

        // Add pre-printed horizontal line
        currentLineElements.push({
          type: 'form_line',
          x: currentX,
          y: currentY,
          width: item.width,
          label: item.label
        } as any);

        activeFormLineEndCoord = currentX + item.width;
        return;
      }

      if (item.type === 'form_line_end') {
        // Safe align to the pre-printed blank slot end
        if (activeFormLineEndCoord !== null && currentX < activeFormLineEndCoord) {
          currentX = activeFormLineEndCoord;
        }
        activeFormLineEndCoord = null;
        return;
      }

      if (item.type === 'word') {
        const wordChars = item.chars;
        
        // Compute total word width dynamically based on letters' individual style spacing
        let wordWidth = 0;
        const charLayouts = wordChars.map((charObj: any) => {
          const baseWidth = getUnitBaseWidth(charObj.char, charObj.style.useFont, charObj.style.fontFamily);
          const styleLetterSpacing = charObj.style.letterSpacing || 0;
          const widthVal = (baseWidth * (fontSize / 100)) + config.letterSpacing + styleLetterSpacing;
          return { char: charObj.char, style: charObj.style, width: widthVal };
        });
        wordWidth = charLayouts.reduce((sum: number, c: any) => sum + c.width, 0);

        if (currentX + wordWidth > PAGE_WIDTH - config.margins.right) {
          if (currentLineElements.length > 0) {
            currentPageLines.push({
              y: currentY,
              elements: currentLineElements
            });
            currentLineElements = [];
            
            currentY += config.lineSpacing;
            lineIndex++;

            if (currentY + config.lineSpacing > PAGE_HEIGHT - config.margins.bottom) {
              pages.push({ lines: currentPageLines });
              currentPageLines = [];
              currentY = config.margins.top;
            }
          }
          currentX = config.margins.left;
        }

        let lastCharEndPoint: [number, number] | null = null;
        charLayouts.forEach((charLayout: any, idx: number) => {
          const prevU = idx > 0 ? charLayouts[idx - 1].char : undefined;
          const nextU = idx < charLayouts.length - 1 ? charLayouts[idx + 1].char : undefined;
          const rendering = renderGlyphToSVGPath(
            charLayout.char,
            currentX,
            currentY,
            fontSize,
            config,
            idx + currentLineElements.length,
            lineIndex,
            charLayout.style,
            lastCharEndPoint,
            prevU,
            nextU
          );

          if (rendering.useFont) {
            currentLineElements.push({
              type: 'text',
              char: charLayout.char,
              x: currentX,
              // Printed fonts sit straight on currentY baseline
              y: charLayout.style.isPrinted ? currentY : rendering.lastPoint[1],
              width: rendering.width,
              useFont: true,
              fontFamily: charLayout.style.fontFamily,
              rotation: charLayout.style.isPrinted ? 0 : rendering.rotation
            });
            lastCharEndPoint = rendering.lastPoint;
          } else if (rendering.pathData) {
            currentLineElements.push({
              type: 'text',
              pathData: rendering.pathData,
              char: charLayout.char,
              x: currentX,
              y: currentY,
              width: rendering.width
            });
            lastCharEndPoint = rendering.lastPoint;
          } else {
            lastCharEndPoint = null;
          }
          currentX += rendering.width;
        });
      }
    });

    if (currentLineElements.length > 0) {
      currentPageLines.push({
        y: currentY,
        elements: currentLineElements
      });
      currentY += config.lineSpacing;
      lineIndex++;

      if (currentY + config.lineSpacing > PAGE_HEIGHT - config.margins.bottom) {
        pages.push({ lines: currentPageLines });
        currentPageLines = [];
        currentY = config.margins.top;
      }
    }

    i++;
  }

  // Push final page
  if (currentPageLines.length > 0 || pages.length === 0) {
    pages.push({ lines: currentPageLines });
  }

  return pages;
}

// Procedural LaTeX mathematical renderer returning customized SVG elements representing
// mathematical layouts (Greek variables, fractions, summation bounds, roots)
export interface MatchedFormulaItem {
  type: string;
  char?: string;
  raw?: string;
  xOffset: number;
  yOffset: number;
  scale: number;
}

type MathNode =
  | { type: 'row'; children: MathNode[] }
  | { type: 'char'; char: string }
  | { type: 'symbol'; seq: string }
  | { type: 'frac'; num: MathNode; den: MathNode }
  | { type: 'sqrt'; content: MathNode; degree?: MathNode }
  | { type: 'script'; base: MathNode; sub?: MathNode; sup?: MathNode }
  | { type: 'bigOp'; op: string; sub?: MathNode; sup?: MathNode }
  | { type: 'space' };

function tokenizeLaTeX(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const char = expr[i];
    if (char === '\\') {
      let seq = '\\';
      i++;
      while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
        seq += expr[i];
        i++;
      }
      tokens.push(seq);
    } else if (/\s/.test(char)) {
      tokens.push(' ');
      i++;
    } else if (/[0-9a-zA-Z={}()^_+*/.,;<>!?|:-]/.test(char)) {
      tokens.push(char);
      i++;
    } else {
      tokens.push(char);
      i++;
    }
  }
  return tokens.filter((t, idx, arr) => {
    if (t === ' ' && arr[idx - 1] === ' ') return false;
    return true;
  });
}

const REVERSE_ALIAS_MAP: Record<string, string> = {
  '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
  '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\sigma': 'σ',
  '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω',
  '\\degree': '°', '\\pm': '±', '\\times': '×', '\\div': '÷',
  '\\approx': '≈', '\\ne': '≠', '\\le': '≤', '\\ge': '≥',
  '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\hbar': 'ħ',
  '\\pi': 'π', '\\int': '∫', '\\sum': 'Σ', '\\cdot': '·',
  '\\to': '→', '\\rightarrow': '→'
};

function parseLaTeXAST(expression: string): MathNode {
  const tokens = tokenizeLaTeX(expression);
  let pos = 0;

  function peek(): string | undefined {
    return tokens[pos];
  }

  function next(): string {
    return tokens[pos++];
  }

  function parseRow(isGroup: boolean): MathNode {
    const children: MathNode[] = [];
    while (pos < tokens.length) {
      const token = peek();
      if (isGroup && token === '}') {
        break;
      }
      if (token === '}') {
        break;
      }
      children.push(parseNode());
    }
    if (children.length === 1) return children[0];
    return { type: 'row', children };
  }

  function parseGroup(): MathNode {
    if (peek() === '{') {
      next(); // consume '{'
      const node = parseRow(true);
      if (peek() === '}') next(); // consume '}'
      return node;
    } else {
      return parseNode();
    }
  }

  function parseNode(): MathNode {
    const token = next();
    if (!token) return { type: 'char', char: '' };

    if (token === ' ') {
      return { type: 'space' };
    }

    const knownOps: Record<string, string> = {
      '\\log': 'log',
      '\\ln': 'ln',
      '\\sin': 'sin',
      '\\cos': 'cos',
      '\\tan': 'tan',
      '\\cot': 'cot',
      '\\sec': 'sec',
      '\\csc': 'csc',
      '\\arcsin': 'arcsin',
      '\\arccos': 'arccos',
      '\\arctan': 'arctan',
      '\\det': 'det',
      '\\lim': 'lim',
      '\\max': 'max',
      '\\min': 'min'
    };

    let baseNode: MathNode;

    if (knownOps[token]) {
      const expanded = knownOps[token];
      const children: MathNode[] = expanded.split('').map(c => ({ type: 'char', char: c }));
      baseNode = { type: 'row', children };
    } else if (token === '\\frac') {
      const num = parseGroup();
      const den = parseGroup();
      baseNode = { type: 'frac', num, den };
    } else if (token === '\\sqrt') {
      let degree: MathNode | undefined = undefined;
      if (peek() === '[') {
        next(); // consume '['
        const degreeNodes: MathNode[] = [];
        while (peek() && peek() !== ']') {
          degreeNodes.push(parseNode());
        }
        if (peek() === ']') next(); // consume ']'
        degree = degreeNodes.length === 1 ? degreeNodes[0] : { type: 'row', children: degreeNodes };
      }
      const content = parseGroup();
      baseNode = { type: 'sqrt', content, degree };
    } else if (token === '\\sum' || token === '\\int') {
      const bigOpNode: MathNode & { type: 'bigOp' } = { type: 'bigOp', op: token };
      while (peek() === '_' || peek() === '^') {
        const scriptType = next();
        const scriptVal = parseGroup();
        if (scriptType === '_') {
          bigOpNode.sub = scriptVal;
        } else {
          bigOpNode.sup = scriptVal;
        }
      }
      return bigOpNode;
    } else if (token.startsWith('\\')) {
      baseNode = { type: 'symbol', seq: token };
    } else if (token === '{') {
      const node = parseRow(true);
      if (peek() === '}') next();
      baseNode = node;
    } else {
      baseNode = { type: 'char', char: token };
    }

    let sub: MathNode | undefined;
    let sup: MathNode | undefined;
    while (peek() === '_' || peek() === '^') {
      const scriptType = next();
      const scriptVal = parseGroup();
      if (scriptType === '_') {
        sub = scriptVal;
      } else {
        sup = scriptVal;
      }
    }

    if (sub || sup) {
      return { type: 'script', base: baseNode, sub, sup };
    }

    return baseNode;
  }

  return parseRow(false);
}

function buildLayout(
  node: MathNode,
  size: number,
  actualConfig: PageConfig,
  style: HandwritingStyle | undefined,
  paths: Array<{ d: string; scale?: number; type?: string }>,
  horizontalLines: Array<{ x1: number; y1: number; x2: number; y2: number; type?: string }>,
  textElements: Array<{ char: string; x: number; y: number; fontSize: number; fontFamily?: string; rotation?: number }>
): { width: number; ascent: number; descent: number; render: (x: number, y: number) => void } {
  // Overriding useFont of math formula elements to false. Cursive web fonts (Marck Script, Caveat, etc.)
  // do not contain custom handwriting glyphs for mathematical operators, summations, integrations, roots,
  // or Greek letters, which leads to broken, missing, or misaligned blocky system print font fallbacks.
  // Forcing useFont to false on activeStyle ensures all math formulas rendering always use highly detailed vector stroke shapes.
  const activeStyle = style ? { ...style, useFont: false } : undefined;
  style = activeStyle;
  const useFont = false;

  switch (node.type) {
    case 'space': {
      const w = size * 0.3;
      return {
        width: w,
        ascent: size * 0.7,
        descent: size * 0.2,
        render: () => {}
      };
    }
    
    case 'char':
    case 'symbol': {
      const charStr = node.type === 'char' ? node.char : node.seq;
      const glyphRes = renderGlyphToSVGPath(
        charStr,
        0,
        0,
        size,
        actualConfig,
        0,
        1,
        style
      );

      const w = glyphRes.width;
      const asc = size * 0.75;
      const desc = size * 0.25;

      return {
        width: w,
        ascent: asc,
        descent: desc,
        render: (rx, ry) => {
          if (useFont) {
            const displayChar = REVERSE_ALIAS_MAP[charStr] || charStr;
            textElements.push({
              char: displayChar,
              x: rx,
              y: ry + (style?.baselineOffset || 0) * (size / 100),
              fontSize: size,
              fontFamily: style?.fontFamily,
              rotation: glyphRes.rotation || 0
            });
          } else {
            const drawRes = renderGlyphToSVGPath(
              charStr,
              rx,
              ry - size * 0.25,
              size,
              actualConfig,
              0,
              1,
              style
            );
            if (drawRes.pathData) {
              paths.push({ d: drawRes.pathData });
            }
          }
        }
      };
    }

    case 'row': {
      const childrenLayouts = node.children.map(c => buildLayout(c, size, actualConfig, style, paths, horizontalLines, textElements));
      let totalW = 0;
      let maxAsc = 0;
      let maxDesc = 0;

      childrenLayouts.forEach(child => {
        totalW += child.width;
        if (child.ascent > maxAsc) maxAsc = child.ascent;
        if (child.descent > maxDesc) maxDesc = child.descent;
      });

      return {
        width: totalW,
        ascent: maxAsc,
        descent: maxDesc,
        render: (rx, ry) => {
          let currX = rx;
          childrenLayouts.forEach(child => {
            child.render(currX, ry);
            currX += child.width;
          });
        }
      };
    }

    case 'frac': {
      const scaleFactor = 0.75;
      const scaledSize = Math.max(11, size * scaleFactor);
      const numLayout = buildLayout(node.num, scaledSize, actualConfig, style, paths, horizontalLines, textElements);
      const denLayout = buildLayout(node.den, scaledSize, actualConfig, style, paths, horizontalLines, textElements);

      const fracW = Math.max(numLayout.width, denLayout.width) + 12;
      const lineGap = Math.max(2, scaledSize * 0.11);
      const asc = numLayout.ascent + numLayout.descent + lineGap + 3;
      const desc = denLayout.ascent + denLayout.descent + lineGap + 3;

      return {
        width: fracW,
        ascent: asc,
        descent: desc,
        render: (rx, ry) => {
          const middleY = ry - 4;
          horizontalLines.push({
            x1: rx,
            y1: middleY,
            x2: rx + fracW,
            y2: middleY,
            type: 'fraction'
          });

          const numX = rx + (fracW - numLayout.width) / 2;
          const numY = middleY - lineGap - numLayout.descent;
          numLayout.render(numX, numY);

          const denX = rx + (fracW - denLayout.width) / 2;
          const denY = middleY + lineGap + denLayout.ascent;
          denLayout.render(denX, denY);
        }
      };
    }

    case 'sqrt': {
      const contentScale = 0.85;
      const contentLayout = buildLayout(node.content, size * contentScale, actualConfig, style, paths, horizontalLines, textElements);
      
      const degScale = 0.45;
      const degLayout = node.degree ? buildLayout(node.degree, size * degScale, actualConfig, style, paths, horizontalLines, textElements) : null;
      
      const degW = degLayout ? degLayout.width : 0;
      const hookW = Math.max(14, degW + 6);
      const gapRight = 4;
      const totalW = hookW + contentLayout.width + gapRight;
      
      const extAsc = Math.max(contentLayout.ascent + 5, degLayout ? (contentLayout.ascent + degLayout.ascent - 2) : 0);
      const desc = contentLayout.descent + 3;

      return {
        width: totalW,
        ascent: extAsc,
        descent: desc,
        render: (rx, ry) => {
          const topY = ry - contentLayout.ascent - 3;
          const bottomY = ry + contentLayout.descent + 3;
          
          // Render the content under root
          contentLayout.render(rx + hookW, ry);

          // 1. Entrance tick
          horizontalLines.push({
            x1: rx,
            y1: ry - size * 0.12,
            x2: rx + 3,
            y2: ry - size * 0.12,
            type: 'root'
          });

          // 2. Diagonal down to root bottom crook
          horizontalLines.push({
            x1: rx + 3,
            y1: ry - size * 0.12,
            x2: rx + 6,
            y2: bottomY,
            type: 'root'
          });

          // 3. Diagonal up from crook to roof start
          horizontalLines.push({
            x1: rx + 6,
            y1: bottomY,
            x2: rx + hookW - 2,
            y2: topY,
            type: 'root'
          });

          // 4. Roof roof horizontal bar covering content
          horizontalLines.push({
            x1: rx + hookW - 2,
            y1: topY,
            x2: rx + totalW,
            y2: topY,
            type: 'root'
          });

          // Render root degree if present (e.g. \sqrt[3]{...} or \sqrt[99999]{...})
          if (degLayout) {
            const degX = rx + 2 + (hookW - 6 - degW) / 2;
            const degY = ry - contentLayout.ascent * 0.25 - 2;
            degLayout.render(degX, degY);
          }
        }
      };
    }

    case 'script': {
      const baseLayout = buildLayout(node.base, size, actualConfig, style, paths, horizontalLines, textElements);
      const scriptScale = 0.6;
      const supLayout = node.sup ? buildLayout(node.sup, size * scriptScale, actualConfig, style, paths, horizontalLines, textElements) : null;
      const subLayout = node.sub ? buildLayout(node.sub, size * scriptScale, actualConfig, style, paths, horizontalLines, textElements) : null;

      const rightWidth = Math.max(supLayout?.width || 0, subLayout?.width || 0);
      const totalW = baseLayout.width + rightWidth + 2;
      const asc = Math.max(baseLayout.ascent, supLayout ? (baseLayout.ascent + supLayout.ascent - 3) : 0);
      const desc = Math.max(baseLayout.descent, subLayout ? (baseLayout.descent + subLayout.descent - 3) : 0);

      return {
        width: totalW,
        ascent: asc,
        descent: desc,
        render: (rx, ry) => {
          baseLayout.render(rx, ry);
          if (supLayout) {
            supLayout.render(rx + baseLayout.width + 1, ry - baseLayout.ascent + 5);
          }
          if (subLayout) {
            subLayout.render(rx + baseLayout.width + 1, ry + baseLayout.descent - 2);
          }
        }
      };
    }

    case 'bigOp': {
      const isSum = node.op === '\\sum';
      const isInt = node.op === '\\int';
      const opScale = isSum ? 1.3 : 1.5;
      const opGlyphRes = renderGlyphToSVGPath(node.op, 0, 0, size * opScale, actualConfig, 0, 1, style);
      const opW = opGlyphRes.width;
      const opAsc = size * opScale * 0.75;
      const opDesc = size * opScale * 0.25;

      const limitScale = 0.55;
      const supLayout = node.sup ? buildLayout(node.sup, size * limitScale, actualConfig, style, paths, horizontalLines, textElements) : null;
      const subLayout = node.sub ? buildLayout(node.sub, size * limitScale, actualConfig, style, paths, horizontalLines, textElements) : null;

      const limitW = Math.max(supLayout?.width || 0, subLayout?.width || 0);
      const totalW = Math.max(opW, limitW) + 4;
      let asc = opAsc;
      let desc = opDesc;

      if (supLayout) asc += supLayout.ascent + supLayout.descent + 3;
      if (subLayout) desc += subLayout.ascent + subLayout.descent + 3;

      return {
        width: totalW,
        ascent: asc,
        descent: desc,
        render: (rx, ry) => {
          const opX = rx + (totalW - opW) / 2;
          const opY = ry - size * opScale * 0.25;

          if (useFont) {
            const displayChar = REVERSE_ALIAS_MAP[node.op] || node.op;
            textElements.push({
              char: displayChar,
              x: opX,
              y: opY + (style?.baselineOffset || 0) * (size / 100),
              fontSize: size * opScale,
              fontFamily: style?.fontFamily,
              rotation: opGlyphRes.rotation || 0
            });
          } else {
            const drawRes = renderGlyphToSVGPath(node.op, opX, opY, size * opScale, actualConfig, 0, 1, style);
            if (drawRes.pathData) {
              const opType = node.op === '\\int' ? 'integral' : node.op === '\\sum' ? 'sum' : 'integral';
              paths.push({ d: drawRes.pathData, type: opType });
            }
          }

          if (supLayout) {
            const offset = isInt ? 4 : 0;
            const supX = rx + (totalW - supLayout.width) / 2 + offset;
            const supY = ry - opAsc - 4;
            supLayout.render(supX, supY);
          }
          if (subLayout) {
            const offset = isInt ? -2 : 0;
            const subX = rx + (totalW - subLayout.width) / 2 + offset;
            const subY = ry + opDesc + subLayout.ascent + 2;
            subLayout.render(subX, subY);
          }
        }
      };
    }

    default:
      return {
        width: 0,
        ascent: 0,
        descent: 0,
        render: () => {}
      };
  }
}

export function parseLaTeXFormula(
  expression: string,
  startX: number,
  startY: number,
  size: number,
  config?: PageConfig,
  style?: HandwritingStyle
): {
  paths: Array<{ d: string; scale?: number; type?: string }>;
  horizontalLines: Array<{ x1: number; y1: number; x2: number; y2: number; type?: string }>;
  textElements: Array<{ char: string; x: number; y: number; fontSize: number; fontFamily?: string; rotation?: number }>;
} {
  const paths: Array<{ d: string; scale?: number; type?: string }> = [];
  const horizontalLines: Array<{ x1: number; y1: number; x2: number; y2: number; type?: string }> = [];
  const textElements: Array<{ char: string; x: number; y: number; fontSize: number; fontFamily?: string; rotation?: number }> = [];

  const configPlaceholder: PageConfig = {
    paperType: 'blank',
    fontFamily: 'sans',
    inkColor: 'blue',
    penStyle: 'gel',
    lineSpacing: 28,
    letterSpacing: 0,
    wordSpacing: 10,
    tiltVariance: 2,
    spacingVariance: 0.5,
    baselineVariance: 0.3,
    strokeThickness: 1.5,
    noiseLevel: 0.2,
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    showMargins: false,
    curvedLines: false
  };

  const actualConfig = config ? { ...config, paperType: 'blank' as const, showMargins: false } : configPlaceholder;

  try {
    const cleanExpr = expression
      .replace(/\\left|\\right/g, ' ')
      .replace(/\\,|\\!|\\:|\\;|\\ /g, ' ');
    const ast = parseLaTeXAST(cleanExpr);
    const layout = buildLayout(ast, size, actualConfig, style, paths, horizontalLines, textElements);
    layout.render(startX, startY);
  } catch (err) {
    console.error("LaTeX rendering failed:", err);
  }

  return { paths, horizontalLines, textElements };
}

export function measureLaTeXFormula(
  expression: string,
  size: number,
  config?: PageConfig,
  style?: HandwritingStyle
): number {
  const configPlaceholder: PageConfig = {
    paperType: 'blank',
    fontFamily: 'sans',
    inkColor: 'blue',
    penStyle: 'gel',
    lineSpacing: 28,
    letterSpacing: 0,
    wordSpacing: 10,
    tiltVariance: 2,
    spacingVariance: 0.5,
    baselineVariance: 0.3,
    strokeThickness: 1.5,
    noiseLevel: 0.2,
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    showMargins: false,
    curvedLines: false
  };

  const actualConfig = config ? { ...config, paperType: 'blank' as const, showMargins: false } : configPlaceholder;

  try {
    const cleanExpr = expression
      .replace(/\\left|\\right/g, ' ')
      .replace(/\\,|\\!|\\:|\\;|\\ /g, ' ');
    const ast = parseLaTeXAST(cleanExpr);
    const paths: any[] = [];
    const horizontalLines: any[] = [];
    const textElements: any[] = [];
    const layout = buildLayout(ast, size, actualConfig, style, paths, horizontalLines, textElements);
    return layout.width;
  } catch (err) {
    return 160;
  }
}

export function preprocessUserTextMath(text: string): string {
  if (!text) return '';

  // 1. Normalize common AI formatting:
  // Convert standard markdown fenced code blocks of type 'latex' or 'math' into $$ ... $$
  text = text.replace(/```(?:latex|math)\n([\s\S]*?)\n```/gi, '\n$$ $1 $$\n');

  // Convert \[ ... \] block formats to $$ ... $$ block formats
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    const cleanFormula = formula.replace(/\s+/g, ' ').trim();
    return `\n$$ ${cleanFormula} $$\n`;
  });

  // Compact any $$ ... $$ blocks (especially those spanning multiple lines) into a single line
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const cleanFormula = formula.replace(/\s+/g, ' ').trim();
    return `$$ ${cleanFormula} $$`;
  });

  // 2. Map complex mathematical structures written inside inline formats to block format
  const blockKeywords = [
    '\\frac', '\\sum', '\\int', '\\sqrt', '\\lim', '\\matrix', '\\begin', '\\prod',
    '\\Delta', '\\psi', '\\alpha', '\\beta', '\\gamma', '\\theta', '\\lambda',
    '\\mu', '\\rho', '\\sigma', '\\phi', '\\omega'
  ];

  // Normalizing \( ... \)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    const fTrimmed = formula.trim();
    const needsBlock = blockKeywords.some(kw => fTrimmed.includes(kw)) || fTrimmed.length > 25;
    if (needsBlock) {
      return `\n$$ ${fTrimmed} $$\n`;
    } else {
      return `$ ${fTrimmed} $`;
    }
  });

  // Normalize single dollar inline math containing block keywords or extensive contents to full block
  text = text.replace(/(?<!\$)\$([^$\n]+)\$(?!\$)/g, (match, formula) => {
    const fTrimmed = formula.trim();
    const needsBlock = blockKeywords.some(kw => fTrimmed.includes(kw)) || fTrimmed.length > 25;
    if (needsBlock) {
      return `\n$$ ${fTrimmed} $$\n`;
    }
    return `$ ${fTrimmed} $`;
  });

  // 3. For actual simple inline single-dollar formulae (like $x = 10$), simplify standard LaTeX symbols
  // into their direct unicode characters so they render seamlessly inline using handwriting vector glyphs
  const latexToUnicode: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
    '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\rho': 'ρ', '\\sigma': 'σ',
    '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω',
    '\\pi': 'π', '\\cdot': '·', '\\pm': '±', '\\times': '×', '\\div': '÷',
    '\\approx': '≈', '\\ne': '≠', '\\le': '≤', '\\ge': '≥',
    '\\degree': '°', '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇',
    '\\hbar': 'ħ', '\\to': '→', '\\rightarrow': '→'
  };

  text = text.replace(/(?<!\$)\$([^$\n]+)\$(?!\$)/g, (match, formula) => {
    let result = formula;
    Object.entries(latexToUnicode).forEach(([latex, unicode]) => {
      const escaped = latex.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped + '\\b', 'g');
      result = result.replace(regex, unicode);
    });
    // Remove formatting backslashes
    result = result.replace(/\\/g, '');
    return result.trim();
  });

  // 4. Clean up spacing around double-dollars blocks
  let lines = text.split('\n');
  let cleanedLines: string[] = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
      cleanedLines.push(trimmed);
    } else {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}
