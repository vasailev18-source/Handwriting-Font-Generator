import React, { useState, useEffect } from 'react';
import { ALL_TEMPLATES } from '../utils/templates';
import { Download, Printer, FileText, Info, CheckCircle2 } from 'lucide-react';

export default function WorkbookBlank() {
  const [selectedTemplateId, setSelectedTemplateId] = useState('cyrillic_8row_p1');
  const activeTemplate = ALL_TEMPLATES.find(t => t.id === selectedTemplateId) || ALL_TEMPLATES[0];
  const [isInsideIframe, setIsInsideIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInsideIframe(window.self !== window.top);
    } catch {
      setIsInsideIframe(true);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Helper to generate a styling-friendly version for the grid
  const cellGrid = [];
  const rowsCount = activeTemplate.rows;
  const colsCount = activeTemplate.cols;

  for (let r = 0; r < rowsCount; r++) {
    const rowCells = [];
    for (let c = 0; c < colsCount; c++) {
      const cell = activeTemplate.cells.find(cell => cell.row === r && cell.col === c);
      rowCells.push(cell);
    }
    cellGrid.push(rowCells);
  }

  return (
    <div id="workbook-blank" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-8 print:p-0 print:shadow-none print:border-none">
      {/* Configuration & Controls - Hidden on print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Шаг 1: Скачайте и распечатайте бланк</h2>
          </div>
          <p className="text-sm text-slate-500">
            Выберите сетку, заполните её ручкой по правилам и сделайте чёткое фото.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
          >
            {ALL_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Распечатать бланк
          </button>

          {isInsideIframe && (
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Открыть в новом окне ↗
            </a>
          )}
        </div>
      </div>

      {/* Rules Notice - Hidden on print */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden text-xs text-slate-600">
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            Рекомендации по заполнению:
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
            <li>Пишите строго по центру ячеек <strong>чёрной ручкой</strong> или фломастером.</li>
            <li>Не задевайте внутренние рамки ячеек — пишите чуть мельче размера сетки.</li>
            <li>Не складывайте и не мните лист.</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Как фотографировать/сканировать:
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
            <li>Разместите бланк на ровной поверхности при хорошем освещении (избегайте теней).</li>
            <li><strong>Все 4 угловых чёрных маркера</strong> должны целиком помещаться в кадр.</li>
            <li>Держите камеру параллельно листу — без сильных перекосов.</li>
          </ul>
        </div>
      </div>

      {/* Digital Printable Form Canvas */}
      <div className="flex justify-center bg-slate-100 p-4 md:p-8 rounded-2xl overflow-x-auto print:bg-transparent print:p-0 print:rounded-none">
        <div
          id="printable-a4-area"
          className="bg-white text-black min-w-[760px] max-w-[760px] min-h-[1075px] max-h-[1075px] shadow-md relative p-12 flex flex-col justify-between print:shadow-none print:p-4 select-none"
          style={{ boxSizing: 'border-box' }}
        >
          {/* TOP MARGIN MARKERS */}
          {/* Top-Left QR Code simulated alignment box */}
          <div className="absolute top-6 left-6 w-8 h-8 border-[6px] border-black flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-black"></div>
          </div>
          {/* Top-Right alignment box */}
          <div className="absolute top-6 right-6 w-8 h-8 border-[6px] border-black flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-black"></div>
          </div>

          {/* HEADER SECTION */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="space-y-1">
              <h1 className="text-[17px] font-bold tracking-wider uppercase text-zinc-900">
                Бланк сбора и оцифровки почерка • TypeScribe AI
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium">
                ИНСТРУКЦИЯ: Пишите символы чёрной ручкой посредине ячеек. Не задевайте границы рамки. Сделайте чёткое фото.
              </p>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[11px] font-bold text-zinc-800">Шаблон: {activeTemplate.name}</span>
              <span className="text-[8px] text-zinc-400 font-mono">ID: {activeTemplate.id}_v2.5</span>
            </div>
          </div>

          {/* THE GRID */}
          <div className="flex-1 flex flex-col border border-collapse border-zinc-900 bg-zinc-50/10">
            {cellGrid.map((rowCells, rIdx) => {
              // Special double high logic for upper corner cell (logo)
              // If we are on Row 1 and Col 0/1, we do not render because Row 0 Col 0 spans it
              if (rIdx === 1 && (rowCells[0]?.isLogo || rowCells[1]?.isLogo)) {
                return (
                  <div key={rIdx} className="flex flex-1 min-h-0 border-b border-zinc-900">
                    {/* Render from col 2 onwards */}
                    {rowCells.slice(2).map((cell, cIdx) => (
                      <div
                        key={cIdx + 2}
                        className="flex-1 border-r border-zinc-900 relative flex flex-col items-center justify-center bg-white"
                      >
                        {cell && (
                          <>
                            <span className="absolute top-1 left-1.5 text-[10px] font-bold text-zinc-400 select-none">
                              {cell.label}
                            </span>
                            <span className="text-[28px] font-light text-zinc-100 opacity-20 select-none">
                              {cell.char}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div key={rIdx} className="flex flex-1 min-h-0 border-b border-zinc-900 last:border-b-0">
                  {rowCells.map((cell, cIdx) => {
                    // Render Logo space spanning 2 cols + 2 rows
                    if (rIdx === 0 && cIdx === 0 && cell?.isLogo) {
                      return (
                        <div
                          key={cIdx}
                          className="w-[25%] border-r-2 border-b-2 border-zinc-900 bg-zinc-50 flex flex-col items-center justify-center p-4 relative"
                          style={{ minHeight: '140px', height: '200%', zIndex: 10 }}
                        >
                          <div className="text-center space-y-1.5">
                            <span className="text-[18px] font-black tracking-tighter text-zinc-900">TypeScribe</span>
                            <div className="text-[8px] font-bold bg-zinc-900 text-white rounded px-1.5 py-0.5 uppercase tracking-widest">
                              HANDWRITING AI
                            </div>
                            <div className="w-16 h-16 border-2 border-dashed border-zinc-300 rounded-lg mx-auto flex items-center justify-center text-[7px] text-zinc-400 px-1 font-mono">
                              QR / LOGO
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Skip the offset dummy cells of the Logo box
                    if ((rIdx === 0 || rIdx === 1) && cIdx === 1 && cell?.isLogo) return null;

                    return (
                      <div
                        key={cIdx}
                        className="flex-1 border-r border-zinc-900 last:border-r-0 relative flex flex-col items-center justify-center bg-white"
                      >
                        {cell && (
                          <>
                            <span className="absolute top-1 left-1.5 text-[10px] font-bold text-zinc-400 select-none">
                              {cell.label}
                            </span>
                            {/* Visual faint letters backdrops to guide the user */}
                            <span className="text-[28px] font-light text-zinc-100 opacity-20 select-none">
                              {cell.char}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* WARNING FOOTER */}
          <div className="text-center mt-4 pt-4 border-t border-dashed border-zinc-300 text-[8px] font-bold text-red-600 tracking-wider">
            ⚠️ ВНИМАНИЕ: Все 4 угловых маркера (верхние и нижние) ОБЯЗАТЕЛЬНО должны полностью помещаться на фото!
          </div>

          {/* BOTTOM MARGIN MARKERS */}
          {/* Bottom-Left alignment box */}
          <div className="absolute bottom-6 left-6 w-8 h-8 border-[6px] border-black flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-black"></div>
          </div>
          {/* Bottom-Right alignment box */}
          <div className="absolute bottom-6 right-6 w-8 h-8 border-[6px] border-black flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-black"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
