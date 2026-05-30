import React, { useState, useEffect } from 'react';
import { buildTrueTypeFont } from '../utils/fontBuilder';
import { GlyphData, FontConfig } from '../types';
import { 
  Download, Type, Sliders, FileText, Check, 
  Sparkles, AlignLeft, Settings2, Trash2, Printer
} from 'lucide-react';

interface PlaygroundProps {
  glyphsList: GlyphData[];
  onClearAll: () => void;
}

export default function Playground({ glyphsList, onClearAll }: PlaygroundProps) {
  const [fontName, setFontName] = useState('MyHandwriting');
  const [styleName, setStyleName] = useState('Regular');
  const [isCompiling, setIsCompiling] = useState(false);
  const [fontRegistered, setFontRegistered] = useState(false);
  
  // Customization adjustments
  const [fontSize, setFontSize] = useState(24);
  const [letterSpacing, setLetterSpacing] = useState(2); // px
  const [lineHeight, setLineHeight] = useState(1.6);
  const [inkColor, setInkColor] = useState('#1e3a8a'); // Blue ink by default
  const [paperStyle, setPaperStyle] = useState<'lined' | 'grid' | 'craft' | 'blank'>('lined');
  
  const [sandboxText, setSandboxText] = useState(
    'Привет! Это твой собственный, полностью уникальный рукописный шрифт.\n\n' +
    'Напиши здесь любое послание в стильном блокноте. Ты можешь менять цвет чернил, ' +
    'высоту букв, выбирать листы в клетку или линейку.\n\n' +
    'Установи скачанный шрифт в систему Windows или MacOS и используй его в Word, Photoshop, ' +
    'Figma, Canva и других приложениях!'
  );

  // Compile and dynamic @font-face injection script
  const handleCompileFont = () => {
    if (glyphsList.length === 0) return;
    setIsCompiling(true);

    setTimeout(() => {
      try {
        const config: FontConfig = {
          familyName: fontName.trim() || 'MyHandwriting',
          styleName: styleName.trim() || 'Regular',
          unitsPerEm: 16384,
          ascender: 12800,
          descender: -3584,
        };

        const buffer = buildTrueTypeFont(glyphsList, config);
        const blob = new Blob([buffer], { type: 'font/ttf' });
        const fontUrl = URL.createObjectURL(blob);

        // Remove any previous dynamic style if it existed
        const oldStyle = document.getElementById('dynamic-handwritten-style-tag');
        if (oldStyle) oldStyle.remove();

        const style = document.createElement('style');
        style.id = 'dynamic-handwritten-style-tag';
        style.innerHTML = `
          @font-face {
            font-family: '${config.familyName}';
            src: url('${fontUrl}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
        `;
        document.head.appendChild(style);
        
        setFontRegistered(true);
      } catch (err) {
        console.error(err);
        alert('Ошибка при компиляции TrueType шрифта. Проверьте векторные контуры.');
      } finally {
        setIsCompiling(false);
      }
    }, 450);
  };

  // Immediate download trigger for compiled font
  const triggerFontDownload = () => {
    const config: FontConfig = {
      familyName: fontName.trim() || 'MyHandwriting',
      styleName: styleName.trim() || 'Regular',
      unitsPerEm: 16384,
      ascender: 12800,
      descender: -3584,
    };
    
    const buffer = buildTrueTypeFont(glyphsList, config);
    const blob = new Blob([buffer], { type: 'font/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.familyName}-${config.styleName}.ttf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate and download a beautified TXT diagnostic and telemetry report 
  const downloadTelemetryLog = () => {
    let text = '';
    const divider = '='.repeat(80) + '\n';
    const subDivider = '-'.repeat(80) + '\n';

    text += divider;
    text += '          TYPESCRIBE COMPUTER VISION & FONT GENERATION TELEMETRY LOG\n';
    text += divider;
    text += `Дата и время генерации:  ${new Date().toISOString()}\n`;
    text += `Название шрифта:         ${fontName.trim() || 'MyHandwriting'}\n`;
    text += `Стиль шрифта:            ${styleName.trim() || 'Regular'}\n`;
    text += `Размер сетки (Units/Em): 16,384 em\n`;
    text += `Линия подъема (Ascender): 12,800\n`;
    text += `Линия спуска (Descender): -3,584\n`;
    text += subDivider;

    text += '\n[1] ОБЩИЕ МЕТРИКИ ШРИФТА И КОЛЛИЗИИ\n';
    text += '-'.repeat(40) + '\n';
    text += `Всего символов в базе:   ${glyphsList.length} шт.\n`;
    
    const unicodeMap = new Map();
    const nameMap = new Map();
    let collisionsCount = 0;
    const collisionDetails: string[] = [];

    glyphsList.forEach(glyph => {
      const code = glyph.char.charCodeAt(0);
      if (unicodeMap.has(code)) {
        collisionsCount++;
        collisionDetails.push(`Конфликт Unicode U+${code.toString(16).toUpperCase()}: символы '${glyph.char}' и '${unicodeMap.get(code)}'`);
      } else {
        unicodeMap.set(code, glyph.char);
      }
    });

    text += `Обнаруженные конфликты:  ${collisionsCount > 0 ? `${collisionsCount}!` : '0 (Чистая сборка)'}\n`;
    if (collisionDetails.length > 0) {
      text += 'Детализация коллизий:\n';
      collisionDetails.forEach(c => {
        text += `  ⚠️ ${c}\n`;
      });
    }

    text += '\n[2] ТЕЛЕМЕТРИЯ КОМПЬЮТЕРНОГО ЗРЕНИЯ И СКАНИРОВАНИЯ\n';
    text += '-'.repeat(40) + '\n';

    const ft = typeof window !== 'undefined' ? (window as any).__forensic_trace : null;
    if (ft) {
      text += `Статус трассировки:      Активен\n`;
      text += `Обработано ячеек бланка:  ${ft.totalProcessedCells || 0}\n`;
      text += `Всего найдено контуров:   ${ft.totalContours || 0}\n`;
      text += `Исключено шума/границ:    ${ft.totalRejectedContours || 0}\n`;
      text += `Успешно добавлено в шрифт: ${ft.totalGlyphs || 0}\n`;
      text += `Координатные коллизии:    ${ft.totalCollisions || 0}\n`;

      if (ft.warnings && ft.warnings.length > 0) {
        text += '\nПредупреждения сканера (Warnings):\n';
        ft.warnings.forEach((warn: string) => {
          text += `  ⚠️ ${warn}\n`;
        });
      } else {
        text += `\nПредупреждения:          Сообщений нет. Калибровка листов выполнена успешно.\n`;
      }
    } else {
      text += `Трассировка сканера недоступна (символы могли быть нарисованы вручную или данные сброшены).\n`;
    }

    text += '\n[3] ПОДРОБНЫЙ СЕНСОРНЫЙ АНАЛИЗ ГЛИФОВ\n';
    text += '-'.repeat(40) + '\n';
    
    if (ft && ft.savedImages && Object.keys(ft.savedImages).length > 0) {
      text += 'Символ | Строка | Столбец | Всего контуров | Кепт-контуры | Остаточные чернила\n';
      text += '-'.repeat(74) + '\n';
      Object.keys(ft.savedImages).forEach(ch => {
        const item = ft.savedImages[ch];
        const s = item.stats;
        const charPadded = ch.padEnd(6);
        const rowPadded = String(s.row).padEnd(6);
        const colPadded = String(s.col).padEnd(7);
        const rawPadded = String(s.contourCount).padEnd(14);
        const keptPadded = String(s.filteredCount).padEnd(12);
        const inkPadded = String(s.labelInkAfter);
        text += ` ${charPadded} |  ${rowPadded} |  ${colPadded} | ${rawPadded} | ${keptPadded} | ${inkPadded}\n`;
      });
      text += '-'.repeat(74) + '\n';
    } else {
      text += 'Детальные логи бланка недоступны. Используйте вкладку сканера для считывания бланка.\n';
    }

    text += '\n[4] СТРУКТУРНЫЕ ВЕКТОРНЫЕ ПАРАМЕТРЫ ШРИФТА (OPENTYPE EXP.)\n';
    text += '-'.repeat(40) + '\n';

    glyphsList.forEach(glyph => {
      const code = glyph.char.charCodeAt(0);
      const isSpace = glyph.char === ' ';
      text += `\nСимвол: '${glyph.char}'\n`;
      text += `  Код Unicode: U+${code.toString(16).toUpperCase().padStart(4, '0')} (${code})\n`;
      text += `  Ширина символа (Advance Width): ${glyph.width} em\n`;
      if (isSpace) {
        text += `  Тип: Пробел (Разделительный глиф без контуров)\n`;
      } else {
        text += `  Количество опорных векторных контуров: ${glyph.paths ? glyph.paths.length : 0}\n`;
        if (glyph.paths && glyph.paths.length > 0) {
          text += `  Векторная сложность: ${glyph.paths.reduce((acc, p) => acc + (p ? p.length : 0), 0)} узлов\n`;
          let pointsLog = '';
          glyph.paths.forEach((pathSegment, idx) => {
            if (!pathSegment) return;
            const pathTypeCount = pathSegment.reduce((acc: any, cmd: any) => {
              if (cmd && cmd.type) {
                acc[cmd.type] = (acc[cmd.type] || 0) + 1;
              }
              return acc;
            }, {});
            const details = Object.entries(pathTypeCount).map(([k, v]) => `${k}:${v}`).join(', ');
            pointsLog += `    Контур #${idx + 1}: ${pathSegment.length} команд (${details})\n`;
          });
          text += pointsLog;
        }
      }
    });

    text += '\n' + divider;
    text += '                      [КОНЕЦ ТЕЛЕМЕТРИЧЕСКОГО ОТЧЕТА]\n';
    text += divider;

    // Trigger download of the TXT file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Typescribe-${fontName.trim() || 'MyHandwriting'}-telemetry-log.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Custom inline background styling for different notepad motifs
  const getPaperStyleClass = () => {
    switch (paperStyle) {
      case 'lined':
        return 'paper-ruled';
      case 'grid':
        return 'paper-squared';
      case 'craft':
        return 'paper-vintage';
      default:
        return 'bg-white';
    }
  };

  const getInkContrastText = () => {
    switch (inkColor) {
      case '#10b981': return 'text-emerald-500';
      case '#ef4444': return 'text-red-500';
      case '#000000': return 'text-black';
      default: return 'text-blue-900';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* LEFT COMPILING CONTROL DASHBOARD */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col justify-between gap-6">
        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h3 className="text-lg font-bold text-slate-800">Настройки сборки (.TTF)</h3>
            <p className="text-xs text-slate-400">Назовите ваш шрифт и скомпилируйте его из векторных макетов.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Название шрифта (Family Name):</label>
              <input
                type="text"
                value={fontName}
                onChange={(e) => setFontName(e.target.value.replace(/[^a-zA-Z0-9\s-_]/g, ''))}
                placeholder="Например, MyHandwriting"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Стиль (Style Name):</label>
              <input
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="Regular, Bold, Italic..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs">
              <span className="text-slate-500 font-semibold">Оцифровано символов:</span>
              <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-full text-xs font-mono">
                {glyphsList.length} шт.
              </span>
            </div>
          </div>
        </div>

        {/* Action Call buttons */}
        <div className="space-y-3 pt-6 border-t border-slate-100">
          <button
            onClick={handleCompileFont}
            disabled={glyphsList.length === 0 || isCompiling}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {isCompiling ? 'Компиляция TrueType...' : '1. Собрать шрифт на лету'}
          </button>

          {fontRegistered && (
            <>
              <button
                onClick={triggerFontDownload}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                2. Скачать файл .TTF в систему
              </button>
              <button
                onClick={downloadTelemetryLog}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-3 rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                Скачать лог оцифровки (.txt)
              </button>
            </>
          )}

          <button
            onClick={onClearAll}
            className="w-full flex items-center justify-center gap-2 border border-red-100 bg-red-50 hover:bg-red-100/60 text-red-600 font-medium py-2 text-xs rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Очистить всю базу символов
          </button>
        </div>
      </div>

      {/* RIGHT INTERACTIVE SANDBOX TYPING PLAYGROUND (2 columns spans) */}
      <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6 flex flex-col justify-between">
        
        {/* Sandbox customization controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Песочница и Примерочная</h3>
            <p className="text-xs text-slate-400">Наберите текст ниже, чтобы увидеть шрифт в действии.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            {/* Ink choice */}
            <div className="flex items-center gap-1.5">
              <span>Паста:</span>
              <div className="flex items-center gap-1">
                {['#1e3a8a', '#000000', '#ef4444', '#10b981'].map(c => (
                  <button
                    key={c}
                    onClick={() => setInkColor(c)}
                    className={`w-5 h-5 rounded-full border border-slate-300 relative ${
                      inkColor === c ? 'ring-2 ring-emerald-500' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Backdrop selection */}
            <div className="flex items-center gap-1.5">
              <span>Бумага:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(['lined', 'grid', 'craft', 'blank'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setPaperStyle(style)}
                    className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold cursor-pointer transition-all ${
                      paperStyle === style 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {style === 'lined' ? 'Линейка' : style === 'grid' ? 'Клетка' : style === 'craft' ? 'Крафт' : 'Чистый'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizing slider */}
            <div className="flex items-center gap-1.5">
              <span>Размер (px):</span>
              <input
                type="range"
                min="14"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16 h-1 w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* WRITTEN CANVAS NOTEBOARD VIEWPORT */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-2xl min-h-[400px] rounded-2xl shadow-inner border border-slate-200 overflow-hidden relative">
            
            {/* Custom notebook page pattern injected in stylesheet */}
            <textarea
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              placeholder="Начните писать здесь свои строки..."
              className={`w-full h-full min-h-[400px] p-8 outline-none border-none resize-none overflow-y-auto leading-relaxed select-text transition-all ${getPaperStyleClass()}`}
              style={{
                fontFamily: fontRegistered ? `'${fontName}'` : 'system-ui',
                fontSize: `${fontSize}px`,
                letterSpacing: `${letterSpacing}px`,
                lineHeight: lineHeight,
                color: inkColor,
              }}
            />

            {!fontRegistered && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center select-none rounded-2xl">
                <div className="bg-white/95 p-6 rounded-2xl max-w-sm shadow-xl space-y-3">
                  <Type className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">Шрифт ещё не скомпилирован</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Нажмите кнопку <strong>«Собрать шрифт»</strong> слева, чтобы превратить ваши оцифрованные макеты в настоящий векторный шрифт и открыть интерактивную песочницу!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Ruled Paper Styling rules */}
      <style>{`
        .paper-ruled {
          background-color: #fcfbf7;
          background-image: linear-gradient(#e2e8f0 1.5px, transparent 1.5px);
          background-size: 100% 36px;
          border-left: 2px solid #ef4444;
          box-shadow: inset 24px 0 0 #fcfbf7, inset 26px 0 0 #ef4444;
          padding-left: 38px !important;
        }
        .paper-squared {
          background-color: #fafaf9;
          background-image: linear-gradient(#e5e5e0 1px, transparent 1px), linear-gradient(90deg, #e5e5e0 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .paper-vintage {
          background-color: #eab308;
          background-image: radial-gradient(#ca8a04 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
