import React, { useState, useEffect } from 'react';
import { TelegramUser, TelegramTheme, PageConfig, HandwritingStyle } from '../types';
import { wrapTextIntoPages } from '../utils/handwritingEngine';
import { 
  Send, Bot, User, CheckCircle, Smartphone, ExternalLink, 
  Zap, Settings, HelpCircle, X, ChevronRight, ChevronLeft,
  FileDown, Download, Sliders, Palette
} from 'lucide-react';
import A4Paper from './A4Paper';
import { motion, AnimatePresence } from 'motion/react';

interface TelegramSimulatorProps {
  onApplyTelegramTheme: (theme: TelegramTheme) => void;
  mockUser: TelegramUser;
  textInput: string;
  setTextInput: (text: string) => void;
  selectedStyleId: string;
  setSelectedStyleId: (id: string) => void;
  config: PageConfig;
  setConfig: React.Dispatch<React.SetStateAction<PageConfig>>;
  fontSize: number;
  setFontSize: (val: number) => void;
  activeStyle: HandwritingStyle;
  availableStyles: HandwritingStyle[];
  onOpenGeneratorWithText: (text: string) => void;
}

export default function TelegramSimulator({ 
  onApplyTelegramTheme, 
  mockUser,
  textInput,
  setTextInput,
  selectedStyleId,
  setSelectedStyleId,
  config,
  setConfig,
  fontSize,
  setFontSize,
  activeStyle,
  availableStyles,
  onOpenGeneratorWithText
}: TelegramSimulatorProps) {
  
  const [messages, setMessages] = useState<Array<{ 
    sender: 'bot' | 'user'; 
    text: string; 
    date: string; 
    inlineMarkup?: boolean;
    handwrittenText?: string;
  }>>([
    {
      sender: 'bot',
      text: 'Привет! Добро пожаловать в MVP куратор Handwriting AI System! 🚀\n\nЯ могу превратить любой ваш напечатанный текст в натуральный человеческий почерк в режиме реального времени!\n\nОтправьте мне любой текст, и я мгновенно сгенерирую рукописный образец! Или запустите Web App кнопкой ниже для полноценной верстки.',
      date: '21:00'
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [tgTheme, setTgTheme] = useState<'default' | 'dark' | 'neon'>('default');
  const [isWebAppOpen, setIsWebAppOpen] = useState<boolean>(false);

  // Sync simulated Telegram themes
  const themes: Record<string, TelegramTheme> = {
    default: {
      bg_color: '#ffffff',
      text_color: '#222222',
      hint_color: '#707579',
      link_color: '#2481cc',
      button_color: '#2481cc',
      button_text_color: '#ffffff'
    },
    dark: {
      bg_color: '#182533',
      text_color: '#f5f5f5',
      hint_color: '#7f91a4',
      link_color: '#5288c1',
      button_color: '#2f689e',
      button_text_color: '#ffffff'
    },
    neon: {
      bg_color: '#0d0e15',
      text_color: '#00ffcc',
      hint_color: '#656a8a',
      link_color: '#ff007f',
      button_color: '#ff007f',
      button_text_color: '#0d0e15'
    }
  };

  useEffect(() => {
    onApplyTelegramTheme(themes[tgTheme]);
  }, [tgTheme]);

  // Handle simulated text message parsing and generator outputs
  const handleSendMessage = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: textToSend, date: currentTime };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulated Bot Responses & Handwritings
    setTimeout(() => {
      let botReply = '';
      let renderedHandwriting = '';

      const slug = textToSend.toLowerCase();
      if (slug.includes('start') || textToSend.startsWith('/start')) {
        botReply = `Привет, ${mockUser.first_name || 'друг'}! Я готов к работе. Используйте кнопку "Запустить Web App" на панели или клавиатуре, либо просто напишите свой текст для мгновенной генерации конспекта!`;
      } else if (slug.includes('help') || textToSend.startsWith('/help')) {
        botReply = 'Справка бота:\n/start - Начать беседу\n/styles - Список доступных почерков\n/help - Данный справочник\n\nПросто отправьте любой текст, и я сгенерирую его вашим текущим почерком!';
      } else if (slug.startsWith('/styles')) {
        botReply = `Доступно стилей почерка: ${availableStyles.length}.\nТекущий активный почерк: "${activeStyle.name}" (by ${activeStyle.creator}).\nВы можете в любой момент изменить настройки в меню Web App.`;
      } else {
        botReply = `Мгновенная генерация почерка! Я успешно конвертировал ваше сообщение в цифровую рукопись с параметрами "${activeStyle.name}". Вы можете отредактировать ее в Web App.`;
        renderedHandwriting = textToSend;
      }

      setMessages(prev => [...prev, {
        sender: 'bot' as const,
        text: botReply,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inlineMarkup: true,
        handwrittenText: renderedHandwriting || undefined
      }]);
    }, 700);
  };

  const inkColorHex = {
    blue: '#2b52b2',
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
  }[config.inkColor] || config.inkColor || '#2b52b2';

  // Wrap text coordinates for simple mini preview inside message bubble
  const getMiniHandwritingPreview = (text: string) => {
    const miniConfig: PageConfig = {
      ...config,
      lineSpacing: 22,
      margins: { top: 12, bottom: 12, left: 35, right: 35 }
    };
    const miniPages = wrapTextIntoPages(text, miniConfig, activeStyle, 18);
    return miniPages[0] || null;
  };

  const simulatedPages = wrapTextIntoPages(textInput, config, activeStyle, fontSize);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* Specs Column */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="text-blue-600 animate-pulse" size={18} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Интеграция с Telegram Web App
            </h3>
          </div>
          <p className="text-[11.5px] text-gray-500 leading-relaxed font-semibold">
            Эта панель эмулирует поведение контейнера <code>Telegram.WebApp</code>. Вы можете настраивать параметры и видеть изменения в реальном времени.
          </p>

          <div className="bg-slate-50 p-3 border border-gray-100 rounded-xl flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-gray-400">Адрес контейнера Telegram WebApp</span>
            <code className="text-[10px] bg-white p-2 rounded text-gray-700 font-mono break-all border border-gray-200 shadow-sm">
              https://telegram.org/js/telegram-web-app.js
            </code>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Симулировать тему чата:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.keys(themes).map(themeKey => {
                const label = {
                  default: 'Светлая',
                  dark: 'Темная',
                  neon: 'Неон'
                }[themeKey] || themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => setTgTheme(themeKey as any)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border cursor-pointer transition-all ${
                      tgTheme === themeKey
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-100/40 rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle size={14} className="text-blue-600" />
            Возможности синхронизации
          </span>
          <ul className="text-[10.5px] text-blue-950 font-semibold space-y-1.5 pl-4 list-disc">
            <li>Наберите любой текст в поле чата справа, чтобы мгновенно сгенерировать его рукописным шрифтом.</li>
            <li>Нажмите <strong>"Запустить Web App"</strong>, чтобы открыть полноценный интерфейс Mini App.</li>
            <li>Полная адаптивность к ползункам и стилям, заданным в системе на других вкладках.</li>
          </ul>
        </div>
      </div>

      {/* Device frame container */}
      <div className="lg:col-span-7 flex flex-col bg-slate-950 rounded-[2.5rem] p-3 border-[6px] border-slate-800 shadow-2xl relative aspect-[9/16] max-h-[580px] w-full max-w-[380px] mx-auto overflow-hidden">
        {/* Phone ear speaker notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
        </div>

        {/* Telegram App Sandbox Interface */}
        <div className="flex flex-col w-full h-full bg-slate-900 rounded-[2rem] overflow-hidden relative">
          
          {/* Telegram Header */}
          <div className="bg-slate-800 pt-6 px-4 pb-3 flex items-center justify-between border-b border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold relative shadow-inner">
                <Bot size={16} />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-slate-800 rounded-full"></span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  TypeScribe Рукописный Бот
                </h4>
                <span className="text-[9.5px] text-gray-400 font-semibold tracking-wide">в сети</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-700/40 text-[9px] text-blue-400 font-extrabold px-2 py-0.5 rounded-full border border-blue-500/15">
              <Smartphone size={10} />
              <span>ЭМУЛЯЦИЯ</span>
            </div>
          </div>

          {/* Interactive Chat Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3.5 min-h-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=50')] bg-cover bg-blend-multiply bg-slate-950">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const miniPreview = msg.handwrittenText ? getMiniHandwritingPreview(msg.handwrittenText) : null;
                
                return (
                  <motion.div
                    key={`${i}-${msg.date}`}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    layout
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === 'bot' ? 'self-start' : 'self-end'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-[12px] leading-relaxed font-semibold transition-all ${
                        msg.sender === 'bot'
                          ? 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/60 shadow-md'
                          : 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-line font-medium text-slate-200">{msg.text}</p>
                      
                      {/* SVG Handwriting Realism Render attachment in bubble */}
                      <AnimatePresence>
                        {msg.handwrittenText && miniPreview && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, y: 10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="mt-3 p-2.5 bg-[#fbfcfa] rounded-xl shadow-lg border border-slate-300 overflow-hidden w-full max-w-[270px]"
                          >
                            <div className="text-[8px] text-gray-400 font-bold mb-1 flex justify-between uppercase tracking-wider">
                              <span>✍️ БОТ СИНТЕЗИРОВАЛ ПИСЬМО</span>
                              <span className="text-blue-600 font-extrabold">{activeStyle.name.split(' ')[0]}</span>
                            </div>
                            
                            <div className="relative overflow-hidden border border-dashed border-gray-200 bg-[#fbfcfa]" style={{ height: '110px' }}>
                              <svg className="w-full h-full" viewBox="0 0 595 440">
                                {config.paperType === 'lined' && (
                                  <g>
                                    {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390].map(y => (
                                      <line key={y} x1="0" y1={y} x2="595" y2={y} stroke="#dceeff" strokeWidth="1.2" />
                                    ))}
                                  </g>
                                )}
                                {config.paperType === 'squared' && (
                                  <g>
                                    {[20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420].map(x => (
                                      <line key={x} x1={x} y1="0" x2={x} y2="440" stroke="#e6f2fd" strokeWidth="1" />
                                    ))}
                                    {[20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420].map(y => (
                                      <line key={y} x1="0" y1={y} x2="595" y2={y} stroke="#e6f2fd" strokeWidth="1" />
                                    ))}
                                  </g>
                                )}
                                {config.showMargins && (
                                  <line x1="50" y1="0" x2="50" y2="440" stroke="#f09090" strokeWidth="1.5" strokeDasharray="5 3" />
                                )}
                                
                                {/* Render lines in mini canvas */}
                                {miniPreview.lines.map((line, lIdx) => (
                                  <g key={lIdx}>
                                    {line.elements.map((el, eIdx) => {
                                      if (el.type === 'table') {
                                        return (
                                          <g key={eIdx} stroke={inkColorHex} strokeWidth="1.2" opacity="0.65" fill="none">
                                            <rect x="80" y={line.y - 15} width="180" height="32" rx="3" />
                                            <line x1="80" y1={line.y} x2="260" y2={line.y} />
                                            <line x1="170" y1={line.y - 15} x2="170" y2={line.y + 17} />
                                          </g>
                                        );
                                      }

                                      let baseThickness = config.strokeThickness * 0.75;
                                      let baseOpacity = 0.95;
                                      let strokeLinecap: 'round' | 'square' = 'round';
                                      
                                      const activeTool = config.toolType || (config.inkColor === 'pencil' ? 'pencil' : config.inkColor === 'marker-yellow' ? 'marker' : config.inkColor.startsWith('felt') ? 'felt' : 'pen');

                                      if (activeTool === 'pencil') {
                                        baseOpacity = 0.72;
                                      } else if (activeTool === 'colored-pencil') {
                                        baseOpacity = 0.82;
                                      } else if (activeTool === 'felt') {
                                        baseOpacity = 0.92;
                                      } else if (activeTool === 'marker') {
                                        baseOpacity = 0.44;
                                        strokeLinecap = 'square';
                                      }

                                      return (
                                        <path 
                                          key={eIdx} 
                                          d={el.pathData} 
                                          fill="none" 
                                          stroke={inkColorHex} 
                                          strokeWidth={baseThickness} 
                                          strokeLinecap={strokeLinecap} 
                                          strokeLinejoin="round" 
                                          opacity={baseOpacity}
                                        />
                                      );
                                    })}
                                  </g>
                                ))}
                              </svg>
                            </div>
                            
                            <div className="mt-2 flex gap-1.5">
                              <button 
                                onClick={() => {
                                  onOpenGeneratorWithText(msg.handwrittenText!);
                                  alert('Текст перенесен для полноценной настройки А4!');
                                }}
                                className="flex-1 bg-blue-600 border border-blue-500 hover:bg-blue-700 text-white rounded-lg py-1 text-[10px] font-bold shadow-sm cursor-pointer"
                              >
                                Посмотреть А4 📄
                              </button>
                              <button
                                onClick={() => {
                                  setTextInput(msg.handwrittenText!);
                                  alert('Текст успешно настроен в параметрах генератора.');
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-2 text-[10px] font-bold cursor-pointer"
                              >
                                Редактировать
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {msg.inlineMarkup && msg.sender === 'bot' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex flex-col gap-1.5">
                          <button 
                            onClick={() => setIsWebAppOpen(true)}
                            className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-[10.5px] font-bold tracking-wide flex items-center justify-center gap-1 hover:bg-blue-700 cursor-pointer shadow-md"
                          >
                            <span>Запустить Web App</span>
                            <ExternalLink size={11} />
                          </button>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button 
                              onClick={() => handleSendMessage('/help')}
                              className="bg-slate-700/50 border border-slate-600/70 text-slate-300 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-750 cursor-pointer"
                            >
                              Помощь ❓
                            </button>
                            <button 
                              onClick={() => handleSendMessage('/styles')}
                              className="bg-slate-700/50 border border-slate-600/70 text-slate-300 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-750 cursor-pointer"
                            >
                              Почерки ✍️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[8.5px] text-slate-400 font-semibold mt-1 px-1 self-end">{msg.date}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>


          {/* Bottom Chat Keyboard input bar */}
          <div className="p-3 bg-slate-800 border-t border-slate-700/60 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Введите текст или команду..."
              className="flex-1 bg-slate-950 border border-slate-700/60 focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none placeholder-slate-500 font-semibold"
            />
            <button
              onClick={() => handleSendMessage()}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              <Send size={14} />
            </button>
          </div>

          {/* TELEGRAM MINI APP OVERLAY MODAL */}
          <AnimatePresence>
            {isWebAppOpen && (
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 24, stiffness: 200 }}
                className="absolute inset-0 bg-slate-900 flex flex-col z-50 overflow-hidden"
              >
                
                {/* Mini App Titlebar */}
                <div className="bg-slate-800 px-3.5 py-3.5 flex items-center justify-between border-b border-slate-700/60 shadow">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsWebAppOpen(false)}
                      className="p-1 hover:bg-slate-700 text-gray-400 hover:text-white rounded-md cursor-pointer transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-none">TypeScribe Cursive</h3>
                      <span className="text-[9.5px] text-blue-400 font-semibold leading-none mt-1 inline-block">@TypeScribeBot</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      Web App Активен
                    </span>
                  </div>
                </div>

                {/* Mini App Body Workspace */}
                <div className="flex-1 p-3 overflow-y-auto bg-slate-50 text-slate-800 flex flex-col gap-4">
                  
                  {/* Simulated Web App theme notification */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-2.5 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} className="text-blue-600 flex-shrink-0" />
                    <span className="text-[10px] font-bold">Успешно загружено с контекстом темы Telegram!</span>
                  </motion.div>

                  {/* Compact editor text area */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2"
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Текст записки
                    </span>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-blue-300"
                      placeholder="Введите text для генерации мини-почерка..."
                    />
                  </motion.div>

                  {/* Compact style switcher */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2"
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                      <Palette size={11} className="text-blue-500" />
                      ВЫБЕРИТЕ СТИЛЬ ПОЧЕРКА
                    </span>
                    <select
                      value={selectedStyleId}
                      onChange={(e) => setSelectedStyleId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                    >
                      {availableStyles.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </motion.div>

                  {/* Real-time PDF layout preview */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2"
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Предпросмотр структуры PDF в реальном времени
                    </span>
                    <div className="scale-75 origin-top -mb-10 w-full overflow-hidden">
                      <A4Paper pages={simulatedPages} config={config} fontSize={fontSize} style={activeStyle} />
                    </div>
                  </motion.div>

                </div>

                {/* Bot Telegram - Simulated Main Button */}
                <div className="p-3 bg-slate-800 border-t border-slate-700/60">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      alert('Успешная имитация нажатия на MainButton в Telegram! Запущено скачивание конспекта.');
                      // Simply download PNG trigger as mock
                      const doc = document.getElementById('a4-sheet-container');
                      if(doc) {
                        const pngBtn = doc.querySelector('button[title="Download PNG"]') || doc.querySelector('button');
                        if(pngBtn) (pngBtn as any).click();
                      }
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow shadow-blue-500/30 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Скачать конспект (MainButton)</span>
                  </motion.button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
