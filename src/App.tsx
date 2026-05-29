import { useState, useEffect } from 'react';
import { PageConfig, HandwritingStyle } from './types';
import { wrapTextIntoPages, RenderedPage } from './utils/handwritingEngine';
import A4Paper from './components/A4Paper';
import StyleStudio from './components/StyleStudio';
import TelegramSimulator from './components/TelegramSimulator';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Settings2, 
  Share2, 
  Eye, 
  Trash2, 
  BookOpen, 
  Bot, 
  Smile, 
  Edit3, 
  Compass, 
  FileText, 
  Sigma, 
  Fingerprint, 
  HelpCircle,
  Minimize2,
  Maximize2,
  Table2,
  Plus,
  PlusCircle,
  RotateCcw
} from 'lucide-react';

export const TOOL_META = {
  pen: {
    min: 0.5,
    max: 2.5,
    step: 0.1,
    default: 1.2,
    label: 'ТОЛЩИНА СТЕРЖНЯ',
    desc: '🖋️ Насыщенный чернильный стержень (шарик/перо) 0.5 - 1.0мм',
    colors: ['blue', 'black', 'purple', 'red', 'green', 'brown']
  },
  liner: {
    min: 0.3,
    max: 1.8,
    step: 0.05,
    default: 0.7,
    label: 'ТОЛЩИНА ЛИНЕРА',
    desc: '🖋️ Капиллярный линер (Micron, Stabilo Point 88) с идеально постоянной толщиной линии под любым давлением.',
    colors: ['black', 'blue', 'red', 'green', 'purple', 'brown']
  },
  felt: {
    min: 2.0,
    max: 8.0,
    step: 0.2,
    default: 4.5,
    label: 'ТОЛЩИНА ФЛОМАСТЕРА',
    desc: '🖍️ Пористый круглый наконечник фломастера 2.0 - 4.5мм',
    colors: ['blue', 'black', 'red', 'green', 'purple', 'pink', 'orange', 'yellow', 'brown']
  },
  pencil: {
    min: 0.5,
    max: 2.5,
    step: 0.1,
    default: 1.1,
    label: 'ГРИФЕЛЬ КАРАНДАША',
    desc: '✏️ Классический графитовый грифель (HB). Автоматически выбирает серый цвет.',
    colors: ['grey']
  },
  'colored-pencil': {
    min: 0.8,
    max: 3.5,
    step: 0.1,
    default: 1.5,
    label: 'ГРИФЕЛЬ ЦВЕТНОГО КАРАНДАША',
    desc: '🎨 Мягкий цветной карандашный грифель с матовой текстурой.',
    colors: ['blue', 'black', 'red', 'green', 'purple', 'pink', 'orange', 'yellow', 'brown']
  },
  marker: {
    min: 8.0,
    max: 30.0,
    step: 0.5,
    default: 15.0,
    label: 'ШИРИНА СКОСА МАРКЕРА',
    desc: '⚡ Широкое срезанное перо скошенного маркера для выделения.',
    colors: ['yellow', 'pink', 'green', 'orange', 'blue', 'purple']
  }
} as const;

export const PALETTE_COLORS = [
  { id: 'blue', hex: '#1d3f94', name: 'Синий', bgClass: 'bg-[#1d3f94]' },
  { id: 'black', hex: '#17171a', name: 'Черный', bgClass: 'bg-[#17171a]' },
  { id: 'purple', hex: '#5c2090', name: 'Фиолетовый', bgClass: 'bg-[#5c2090]' },
  { id: 'red', hex: '#c91818', name: 'Красный', bgClass: 'bg-[#c91818]' },
  { id: 'green', hex: '#14612d', name: 'Зеленый', bgClass: 'bg-[#14612d]' },
  { id: 'pink', hex: '#e3305d', name: 'Розовый', bgClass: 'bg-[#e3305d]' },
  { id: 'orange', hex: '#ea580c', name: 'Оранжевый', bgClass: 'bg-[#ea580c]' },
  { id: 'yellow', hex: '#f4af00', name: 'Желтый', bgClass: 'bg-[#f4af00]' },
  { id: 'brown', hex: '#7a431d', name: 'Коричневый', bgClass: 'bg-[#7a431d]' },
  { id: 'grey', hex: '#4d4f52', name: 'Графитовый', bgClass: 'bg-[#4d4f52]' },
] as const;

export const REAL_LIFE_COLORS = {
  pen_ballpoint: [
    { id: 'bic-blue', name: 'Сиренево-синий Bic Cristal', hex: '#1e3d8f', comment: 'Классическая школьная ручка, масляный след, 90% плотности' },
    { id: 'pilot-blue', name: 'Глубокий синий Pilot Super Grip', hex: '#192e70', comment: 'Насыщенный деловой синий под давлением' },
    { id: 'ballpoint-schneider-blue', name: 'Небесно-синий Schneider Slider Basic', hex: '#2c59c5', comment: 'Мягкие немецкие чернила Viscoglide, чистый ясный оттенок' },
    { id: 'ballpoint-linc-blue', name: 'Ярко-синий Linc Glycer', hex: '#204cd1', comment: 'Индийские супер-мягкие чернила пониженной вязкости' },
    { id: 'ballpoint-black', name: 'Черный Bic Round Stic', hex: '#202022', comment: 'Мягкий масляный черный с легким графитовым отливом' },
    { id: 'school-violet', name: 'Фиолетовый стержень ErichKrause', hex: '#5e2e85', comment: 'Знакомый фиолетовый цвет записей в детских тетрадях' },
    { id: 'teacher-red', name: 'Красный коралловый Pilot', hex: '#9e1c1c', comment: 'Педагогический рубиново-красный для исправлений' },
    { id: 'ballpoint-parker-red', name: 'Красный Parker Jotter Red', hex: '#c2272d', comment: 'Фирменный стержень с густой алой масляной пастой' },
    { id: 'ballpoint-green', name: 'Зеленый Bic Ultra Round', hex: '#126b3c', comment: 'Ревизионный темно-зеленый оттенок для заметок' }
  ],
  pen_gel: [
    { id: 'gel-black', name: 'Угольно-черный Crown Hi-Jell', hex: '#08080a', comment: 'Насыщенный гелевый уголь, сильный контраст с бумагой' },
    { id: 'gel-muji-black', name: 'Матовый черный MUJI Gel Pen', hex: '#111214', comment: 'Минималистичные японские чернила, эталон графичности' },
    { id: 'gel-indigo', name: 'Гелевый индиго ErichKrause Gel', hex: '#1a2c5e', comment: 'Темно-синий чернильный гель для важной документации' },
    { id: 'gel-pentel-navy', name: 'Темно-синий Pentel EnerGel Navy', hex: '#14224c', comment: 'Мгновенно сохнущий глубокий благородный индиго' },
    { id: 'gel-blue', name: 'Яркий синий Pensan Gel', hex: '#2252cc', comment: 'Насыщенный ультрамариновый гель с равномерным током' },
    { id: 'gel-uniball-red', name: 'Алый Uni-ball Signo UM-151', hex: '#cf1b24', comment: 'Яркий водостойкий гелевый пигмент для черновиков' },
    { id: 'gel-purple', name: 'Фиолетовый неоновый ErichKrause', hex: '#6c2ab3', comment: 'Яркий чернично-сиреневый след гелевой пасты' },
    { id: 'gel-gold', name: 'Золотой металлик Crown Metallic', hex: '#bd9b31', comment: 'Золотистый гелевый пигмент с деликатным мерцанием' },
    { id: 'gel-silver', name: 'Серебряный металлик Crown Metallic', hex: '#8a939e', comment: 'Серебристый акцентный гель для писем' }
  ],
  pen_fountain: [
    { id: 'fountain-royal', name: 'Королевский синий Parker Quink', hex: '#1d388f', comment: 'Благородные перьевые чернила с эффектом затеняемости (shading)' },
    { id: 'fountain-konpeki', name: 'Васильковый Pilot Iroshizuku Kon-peki', hex: '#297fd6', comment: 'Легендарные японские чернила цвета чистого южного неба' },
    { id: 'fountain-blueblack', name: 'Сине-черный Lamy Blue-Black', hex: '#1b2c40', comment: 'Классические архивные чернила, уходящие в свинцовый серый' },
    { id: 'fountain-aurora-black', name: 'Угольный Aurora Black', hex: '#0f0f10', comment: 'Густой глубочайший черный оттенок для перьевых ручек' },
    { id: 'fountain-oxblood', name: 'Бордо Diamine Oxblood', hex: '#63131c', comment: 'Роскошный глубокий винный цвет с благородным градиентом' },
    { id: 'fountain-sherwood', name: 'Шервудский зеленый Diamine Sherwood Green', hex: '#124823', comment: 'Бархатистый лесной зеленый с роскошными переходами тона' },
    { id: 'fountain-emerald', name: 'Изумруд Graf von Faber-Castell', hex: '#105c3c', comment: 'Темно-зеленый оттенок вековых елей с пористым затеканием' },
    { id: 'fountain-violet', name: 'Фиалковый Pelikan 4001 Violet', hex: '#551978', comment: 'Глубокий фиолетовый тон с красивым переливом плотности' },
    { id: 'fountain-yamabudo', name: 'Яма-будо Pilot Iroshizuku', hex: '#8c1556', comment: 'Драгоценный японский пурпур дикого винограда' }
  ],
  liner: [
    { id: 'liner-black-micron', name: 'Черный Sakura Pigma Micron 03', hex: '#0a0b0d', comment: 'Архивный капиллярный пигмент для чертежей и каллиграфии' },
    { id: 'liner-blue-stabilo', name: 'Синий капиллярный Stabilo point 88', hex: '#1c459e', comment: 'Светло-синий ровный след со стальным наконечником' },
    { id: 'liner-black-unipin', name: 'Черный Uni Pin Fine Line 0.5', hex: '#111112', comment: 'Плотный матовый водостойкий японский пигментный лайнер' },
    { id: 'liner-green-micron', name: 'Зеленый Sakura Pigma Micron 05', hex: '#0f5230', comment: 'Насыщенный темно-изумрудный пигментный линер' },
    { id: 'liner-brown-derwent', name: 'Коричневый линер Derwent Sepia', hex: '#5c3822', comment: 'Благородный матовый оттенок сепии для графических набросков' },
    { id: 'liner-violet-stabilo', name: 'Фиолетовый Stabilo point 88', hex: '#581b9c', comment: 'Яркий чернично-сиреневый капиллярный цвет' }
  ],
  felt: [
    { id: 'felt-black', name: 'Черный маркер Centropen 2511', hex: '#131314', comment: 'Плотный черный спиртовой пигмент классического фломастера' },
    { id: 'felt-blue', name: 'Синий Koh-i-Noor художественный', hex: '#1b4bd1', comment: 'Сочный синий цвет детского фломастера' },
    { id: 'felt-stabilo-emerald', name: 'Изумрудный Stabilo Pen 68 Emerald', hex: '#0d8560', comment: 'Сочный глубокий мятно-изумрудный пигмент' },
    { id: 'felt-red', name: 'Яркий красный Centropen', hex: '#c91e1e', comment: 'Алая заправка для граффити и эскизов' },
    { id: 'felt-green', name: 'Травянистый Koh-i-Noor', hex: '#138c43', comment: 'Глубокий салатово-зеленый оттенок фетрового грифеля' },
    { id: 'felt-purple', name: 'Фиолетовый аметист Koh-i-Noor', hex: '#5a19ab', comment: 'Яркий насыщенный фиолетовый стержень' },
    { id: 'felt-pink', name: 'Розовая маджента Centropen', hex: '#d92b67', comment: 'Неоновая розовая фуксия для эскизов и конспектов' },
    { id: 'felt-sharpie-slate', name: 'Сланцево-серый Sharpie Fine Point', hex: '#4f5661', comment: 'Перманентный фломастер приглушенного оттенка мокрого камня' },
    { id: 'felt-pitt-sanguine', name: 'Сангина Faber-Castell Pitt Artist', hex: '#b55431', comment: 'Художественная теплая терракота высокой светостойкости' },
    { id: 'felt-brown', name: 'Коричневый древесный Сконто', hex: '#522f18', comment: 'Умеренно-коричневый землистый цвет' }
  ],
  pencil: [
    { id: 'pencil-blackwing', name: 'Бархатный Palomino Blackwing Matte', hex: '#242528', comment: 'Культовый экстра-мягкий темный графит масляного скольжения' },
    { id: 'pencil-2b', name: 'Мягкий Faber-Castell 9000 2B', hex: '#484a4f', comment: 'Бархатистый темный графит для выразительных штрихов' },
    { id: 'pencil-rotring', name: 'Карандаш Rotring Tikky 0.5 HB', hex: '#65686e', comment: 'Металлическая жесткость стержня автоматического карандаша' },
    { id: 'pencil-4b', name: 'Мягчайший Derwent Графит 4B', hex: '#2e3033', comment: 'Почти черный жирный отпечаток мягкого угля' },
    { id: 'pencil-h', name: 'Чертежный Koh-i-Noor 1500 H', hex: '#85888d', comment: 'Чистый сухой бледно-серый оттенок для аккуратной разметки' },
    { id: 'pencil-4h', name: 'Твердый Koh-i-Noor 1500 4H', hex: '#aaadb3', comment: 'Сухой и предельно светлый след для незаметных опорных линий' }
  ],
  'colored-pencil': [
    { id: 'col-blue', name: 'Синий индиго Faber-Castell Polychromos', hex: '#1e44a3', comment: 'Синий художественный восковой карандаш высокой укрывистости' },
    { id: 'col-prismacolor-indigo', name: 'Восковой индиго Prismacolor Premier', hex: '#1c2e5c', comment: 'Глубокий синий индиго с кремовым мягким нанесением' },
    { id: 'col-green', name: "Изумрудно-зеленый Caran d'Ache Pablo", hex: '#116b34', comment: "Темно-зеленый восковой карандаш швейцарской серии" },
    { id: 'col-polychromos-olive', name: 'Оливковая зелень Faber-Castell', hex: '#4f5c33', comment: 'Сдержанный благородный растительный оттенок вокса' },
    { id: 'col-red', name: 'Карминовый красный Faber-Castell', hex: '#b51b1b', comment: 'Мягко ложащийся красный восковой грифель' },
    { id: 'col-purple', name: 'Пурпурный Koh-i-Noor Polycolor', hex: '#611b93', comment: 'Насыщенный благородный пурпур за счет художественного воска' },
    { id: 'col-yellow', name: 'Кадмий желтый Derwent Artists', hex: '#f5a611', comment: 'Мягкий кроющий солнечно-желтый восковой слой' },
    { id: 'col-derwent-ochre', name: 'Охра Derwent Lightfast Ochre', hex: '#d19e41', comment: 'Теплая песочно-глиняная охра с бархатистой фактурой' },
    { id: 'col-orange', name: 'Оранжевый хром Faber-Castell Polychromos', hex: '#e04e10', comment: 'Плотный восковой хром-оранжевый финиш' },
    { id: 'col-pink', name: "Розовый фламинго Caran d'Ache Pablo", hex: '#cc215a', comment: "Красивый розовый матовый восковой финиш" },
    { id: 'col-brown', name: "Жженая умбра Caran d'Ache", hex: '#633c24', comment: "Маслянистый природный темно-коричневый карандаш" }
  ],
  marker: [
    { id: 'marker-yellow', name: 'Флуоресцентный Желтый Stabilo Boss', hex: '#eef022', comment: 'Светящийся кислотно-желтый пигмент, затекающий в бумагу' },
    { id: 'marker-green', name: 'Пастельный Мятный Stabilo Pastel', hex: '#a3f7be', comment: 'Нежный расслабряющий мятный текстовыделитель' },
    { id: 'marker-pink', name: 'Неоновый Розовый Milan Neon', hex: '#fca3ca', comment: 'Пронзительный конфетно-розовый маркерный след' },
    { id: 'marker-stabilo-cherry', name: 'Пастельная вишня Stabilo Boss Cherry', hex: '#f0adb9', comment: 'Нежнейший зефирно-вишневый фон для акцентов в списках' },
    { id: 'marker-turquoise', name: 'Бирюзовый Бриз Milan Pastel', hex: '#9bf0e7', comment: 'Пастельно-бирюзовый для мягкого контраста' },
    { id: 'marker-orange', name: 'Абрикосовый неоновый Stabilo', hex: '#fcd1b1', comment: 'Светлый теплый абрикосовый маркер для эстетичных конспектов' },
    { id: 'marker-lilac', name: 'Сиреневый Туман Milan Pastel', hex: '#dec0fa', comment: 'Пастельный лавандовый маркер для деликатного фонового выделения' },
    { id: 'marker-zebra-gray', name: 'Приглушенный серый Zebra Mildliner Gray', hex: '#b0b5be', comment: 'Профессиональный мягкий серый хайлайтер для деликатных акцентов' },
    { id: 'marker-pastel-lemon', name: 'Лимонный щербет Milan Pastel Lemon', hex: '#f9f2b3', comment: 'Деликатный бледно-лимонный цвет вместо резкого кислотного' }
  ]
};
export const OFFICE_THEME_COLUMNS = [
  { name: 'Ч/Б', base: '#ffffff', shades: ['#ffffff', '#f2f2f2', '#d9d9d9', '#bfbfbf', '#a6a6a6', '#7f7f7f'] },
  { name: 'Текст', base: '#17171a', shades: ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#4b5563', '#111827'] },
  { name: 'Синий', base: '#1d3f94', shades: ['#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6', '#1d3f94', '#172554'] },
  { name: 'Чернильный', base: '#3b82f6', shades: ['#eff6ff', '#dbeafe', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af'] },
  { name: 'Красный', base: '#c91818', shades: ['#fef2f2', '#fee2e2', '#fca5a5', '#f87171', '#c91818', '#7f1d1d'] },
  { name: 'Зеленый', base: '#14612d', shades: ['#f0fdf4', '#dcfce7', '#86efac', '#4ade80', '#14612d', '#064e3b'] },
  { name: 'Фиолетовый', base: '#5c2090', shades: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#c084fc', '#5c2090', '#4a044e'] },
  { name: 'Розовый', base: '#e3305d', shades: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f472b6', '#e3305d', '#831843'] },
  { name: 'Оранжевый', base: '#ea580c', shades: ['#fff7ed', '#ffedd5', '#fed7aa', '#fb923c', '#ea580c', '#7c2d12'] },
  { name: 'Желтый', base: '#f4af00', shades: ['#fefbeb', '#fef3c7', '#fde68a', '#fcd34d', '#f4af00', '#78350f'] }
];

export const OFFICE_STANDARD_COLORS = [
  '#c00000',
  '#ff0000',
  '#ffc000',
  '#ffff00',
  '#92d050',
  '#00b050',
  '#00b0f0',
  '#0070c0',
  '#002060',
  '#7030a0'
];

// Helper to bridge old/new properties safely
export const getToolThicknessMeta = (inkColor: string, toolType?: string) => {
  const activeTool = (toolType || (inkColor === 'pencil' ? 'pencil' : inkColor === 'marker-yellow' ? 'marker' : inkColor.startsWith('felt') ? 'felt' : 'pen')) as keyof typeof TOOL_META;
  return TOOL_META[activeTool] || TOOL_META.pen;
};

// Default preloaded handwriting presets (containing beautiful parameters)
const DEFAULT_PRESETS: HandwritingStyle[] = [
  {
    id: 'caveat-font',
    name: 'Школьный Кавеат (Ольга К.)',
    creator: 'Ольга К.',
    description: 'Повседневный, аккуратный русско-английский почерк на базе классического шрифта Caveat.',
    slant: 3,
    letterSpacing: 2.5,
    baselineOffset: 1,
    glyphs: {},
    useFont: true,
    fontFamily: 'Caveat'
  },
  {
    id: 'marck-font',
    name: 'Каллиграфия Марк (Елена В.)',
    creator: 'Елена В.',
    description: 'Очень плавное и изящное традиционное русско-английское письмо.',
    slant: 8,
    letterSpacing: 1.0,
    baselineOffset: 3,
    glyphs: {},
    useFont: true,
    fontFamily: 'Marck Script'
  },
  {
    id: 'badscript-font',
    name: 'Повседневный БедСкрипт (Николай П.)',
    creator: 'Николай П.',
    description: 'Красивый неравномерный почерк гелиевой ручкой с реалистичными колебаниями.',
    slant: 4,
    letterSpacing: 1.8,
    baselineOffset: 2,
    glyphs: {},
    useFont: true,
    fontFamily: 'Bad Script'
  },
  {
    id: 'neucha-font',
    name: 'Студенческий Конспект (Павел С.)',
    creator: 'Павел С.',
    description: 'Отличный полупечатный почерк, идеально подходящий для лекций и списков.',
    slant: 0,
    letterSpacing: 3.5,
    baselineOffset: 1,
    glyphs: {},
    useFont: true,
    fontFamily: 'Neucha'
  },
  {
    id: 'compact-rounded',
    name: 'Компактный Округлый (Артем Д.)',
    creator: 'Артем Д.',
    description: 'Более плотные, уютные буквы с округлыми элементами и близким расположением строк.',
    slant: -3,
    letterSpacing: -1,
    baselineOffset: 2,
    glyphs: {}
  },
  {
    id: 'minimalist-print',
    name: 'Печатный Минимализм (Анна К.)',
    creator: 'Анна К.',
    description: 'Современные печатные формы букв, идеальны для структурированных научных записей.',
    slant: 4,
    letterSpacing: 2.2,
    baselineOffset: -1,
    glyphs: {}
  },
  {
    id: 'neat-school',
    name: 'Каллиграфическая Школа (Виктор П.)',
    creator: 'Виктор П.',
    description: 'Идеальное академическое школьное письмо, сбалансированный наклон и округлости.',
    slant: 15,
    letterSpacing: 2.5,
    baselineOffset: 0,
    glyphs: {}
  },
  {
    id: 'messy-student',
    name: 'Студенческая Спешка (Дмитрий К.)',
    creator: 'Дмитрий К.',
    description: 'Спешные студенческие конспекты с сильным волнообразным смещением строк.',
    slant: 22,
    letterSpacing: 0.5,
    baselineOffset: -2,
    glyphs: {}
  },
  {
    id: 'bumpy-road',
    name: 'Трясущийся Автобус (Рита М.)',
    creator: 'Рита М.',
    description: 'Дрожащие волнообразные буквы, имитирующие письмо от руки в трясущемся транспорте.',
    slant: -5,
    letterSpacing: -1.5,
    baselineOffset: 4,
    glyphs: {}
  },
  {
    id: 'architect-draft',
    name: 'Чертеж Архитектора (Олег Г.)',
    creator: 'Олег Г.',
    description: 'Чистый чертежный шрифт с преобладанием заглавных букв и широкими пробелами.',
    slant: 0,
    letterSpacing: 3.0,
    baselineOffset: -1,
    glyphs: {}
  },
  {
    id: 'child-play',
    name: 'Детский Почерк (Кира С.)',
    creator: 'Кира С.',
    description: 'Крупные, неровные округлые буквы с гигантскими интервалами и лёгким наклоном.',
    slant: -2,
    letterSpacing: 4.5,
    baselineOffset: 3,
    glyphs: {}
  },
  {
    id: 'left-handed',
    name: 'Леворукий Наклон (Катя В.)',
    creator: 'Катя В.',
    description: 'Особый наклон влево (почерк левши) с аккуратным плотным выравниванием букв.',
    slant: -14,
    letterSpacing: 1.2,
    baselineOffset: 1,
    glyphs: {}
  },
  {
    id: 'vintage-letter',
    name: 'Винтажное Письмо (Михаил Т.)',
    creator: 'Михаил Т.',
    description: 'Изысканный каллиграфический стиль переписки XIX века с высоким наклоном.',
    slant: 18,
    letterSpacing: 3.5,
    baselineOffset: -2,
    glyphs: {}
  },
  {
    id: 'medical-scribble',
    name: 'Врачебный Рецепт (Др. Петров)',
    creator: 'Др. Петров',
    description: 'Сверхбыстрые наброски врача с высокой хаотичностью и крошечными интервалами.',
    slant: 25,
    letterSpacing: -2.5,
    baselineOffset: -4,
    glyphs: {}
  },
  {
    id: 'sharp-geometric',
    name: 'Острая Угловатость (Вадим Ф.)',
    creator: 'Вадим Ф.',
    description: 'Футуристичные угловатые штрихи с низкой скруглённостью букв.',
    slant: 5,
    letterSpacing: 2.0,
    baselineOffset: 2,
    glyphs: {}
  }
];

// Presets mapping that updates sliders and config details dynamically to match style personalities
const STYLE_CONFIG_PRESETS: Record<string, Partial<PageConfig>> = {
  'elegant-cursive': {
    tiltVariance: 2,
    spacingVariance: 0.4,
    baselineVariance: 0.2,
    noiseLevel: 0.2,
    fontFamily: 'serif',
    strokeThickness: 1.2,
    lineSpacing: 28,
  },
  'caveat-font': {
    tiltVariance: 3.5,
    spacingVariance: 0.8,
    baselineVariance: 0.6,
    noiseLevel: 0.3,
    fontFamily: 'sans',
    strokeThickness: 1.5,
    lineSpacing: 28,
  },
  'marck-font': {
    tiltVariance: 2.0,
    spacingVariance: 0.5,
    baselineVariance: 0.4,
    noiseLevel: 0.2,
    fontFamily: 'serif',
    strokeThickness: 1.3,
    lineSpacing: 30,
  },
  'badscript-font': {
    tiltVariance: 5.0,
    spacingVariance: 1.2,
    baselineVariance: 0.9,
    noiseLevel: 0.5,
    fontFamily: 'serif',
    strokeThickness: 1.4,
    lineSpacing: 28,
  },
  'neucha-font': {
    tiltVariance: 1.5,
    spacingVariance: 0.4,
    baselineVariance: 0.3,
    noiseLevel: 0.15,
    fontFamily: 'sans',
    strokeThickness: 1.6,
    lineSpacing: 28,
  },
  'compact-rounded': {
    tiltVariance: 3,
    spacingVariance: 0.5,
    baselineVariance: 0.3,
    noiseLevel: 0.3,
    fontFamily: 'sans',
    strokeThickness: 1.6,
    lineSpacing: 24,
  },
  'minimalist-print': {
    tiltVariance: 1,
    spacingVariance: 0.2,
    baselineVariance: 0.1,
    noiseLevel: 0.1,
    fontFamily: 'sans',
    strokeThickness: 1.0,
    lineSpacing: 30,
  },
  'neat-school': {
    tiltVariance: 1.5,
    spacingVariance: 0.3,
    baselineVariance: 0.15,
    noiseLevel: 0.15,
    fontFamily: 'serif',
    strokeThickness: 1.3,
    lineSpacing: 28,
  },
  'messy-student': {
    tiltVariance: 7,
    spacingVariance: 1.5,
    baselineVariance: 1.2,
    noiseLevel: 1.1,
    fontFamily: 'sans',
    strokeThickness: 1.5,
    lineSpacing: 26,
  },
  'bumpy-road': {
    tiltVariance: 10,
    spacingVariance: 2.2,
    baselineVariance: 1.8,
    noiseLevel: 1.6,
    fontFamily: 'sans',
    strokeThickness: 1.7,
    lineSpacing: 25,
  },
  'architect-draft': {
    tiltVariance: 0.5,
    spacingVariance: 0.1,
    baselineVariance: 0.05,
    noiseLevel: 0.05,
    fontFamily: 'sans',
    strokeThickness: 1.1,
    lineSpacing: 32,
  },
  'child-play': {
    tiltVariance: 8,
    spacingVariance: 2.0,
    baselineVariance: 1.5,
    noiseLevel: 1.3,
    fontFamily: 'sans',
    strokeThickness: 2.0,
    lineSpacing: 32,
  },
  'left-handed': {
    tiltVariance: 4,
    spacingVariance: 0.7,
    baselineVariance: 0.5,
    noiseLevel: 0.4,
    fontFamily: 'serif',
    strokeThickness: 1.3,
    lineSpacing: 28,
  },
  'vintage-letter': {
    tiltVariance: 3,
    spacingVariance: 0.8,
    baselineVariance: 0.6,
    noiseLevel: 0.5,
    fontFamily: 'serif',
    strokeThickness: 1.5,
    lineSpacing: 34,
  },
  'medical-scribble': {
    tiltVariance: 12,
    spacingVariance: 2.5,
    baselineVariance: 2.0,
    noiseLevel: 2.0,
    fontFamily: 'sans',
    strokeThickness: 1.4,
    lineSpacing: 22,
  },
  'sharp-geometric': {
    tiltVariance: 2,
    spacingVariance: 0.4,
    baselineVariance: 0.3,
    noiseLevel: 0.25,
    fontFamily: 'sans',
    strokeThickness: 1.2,
    lineSpacing: 28,
  }
};

const getFontLabel = (styleId: string, stylesList: HandwritingStyle[]): string => {
  const index = stylesList.findIndex(s => s.id === styleId);
  const num = index !== -1 ? index + 1 : 1;
  const numStr = num < 10 ? `0${num}` : `${num}`;
  
  if (styleId === 'caveat-font') {
    return `Шрифт #${numStr} + KZ`;
  }
  return `Шрифт #${numStr}`;
};

const getFontFlags = (styleId: string): string[] => {
  if (styleId === 'caveat-font') {
    return ['🇺🇦', '🇬🇧', '🇷🇺', '🇰🇿'];
  }
  return ['🇺🇦', '🇬🇧', '🇷🇺'];
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'studio' | 'telegram'>('generate');
  
  // Custom Styles state
  const [styles, setStyles] = useState<HandwritingStyle[]>(DEFAULT_PRESETS);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('caveat-font');
  const activeStyle = styles.find(s => s.id === selectedStyleId) || styles[0];

  // Interface for custom user signatures associated with fonts
  interface SignatureItem {
    id: string;
    name: string;      // Person's name/surname/label
    signature: string; // The physical handwriting string to render
  }

  const [fontSignatures, setFontSignatures] = useState<Record<string, SignatureItem[]>>(() => {
    const saved = localStorage.getItem('handwriting_font_signatures');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      'caveat-font': [
        { id: 's1', name: 'Александр Климов (директор)', signature: 'А.Климов' },
        { id: 's2', name: 'Елена Соколова (бухгалтер)', signature: 'Е.Соколова' }
      ]
    };
  });

  const [selectedSignatureIds, setSelectedSignatureIds] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('handwriting_selected_signature_ids');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('handwriting_font_signatures', JSON.stringify(fontSignatures));
  }, [fontSignatures]);

  useEffect(() => {
    localStorage.setItem('handwriting_selected_signature_ids', JSON.stringify(selectedSignatureIds));
  }, [selectedSignatureIds]);

  const getStyleSignatures = (styleId: string): SignatureItem[] => {
    if (fontSignatures[styleId] && fontSignatures[styleId].length > 0) {
      return fontSignatures[styleId];
    }
    const index = styles.findIndex(s => s.id === styleId);
    const num = index !== -1 ? index + 1 : 1;
    return [
      { id: `${styleId}-def-1`, name: `Иван Смирнов (Шрифт #${num})`, signature: 'И.Смирнов' },
      { id: `${styleId}-def-2`, name: `Ольга Павлова (Шрифт #${num})`, signature: 'Павлова' }
    ];
  };

  const currentSignatures = getStyleSignatures(activeStyle.id);
  const activeSigId = selectedSignatureIds[activeStyle.id] || currentSignatures[0]?.id;
  const activeSignature = currentSignatures.find(s => s.id === activeSigId) || currentSignatures[0];

  // Font Selection Dropdown toggle and states
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fontsInfoModal, setFontsInfoModal] = useState(false);
  
  // Custom Color Palette sub-tabs and picker state
  const [colorTab, setColorTab] = useState<'ink' | 'outline'>('ink');
  const [customHexInput, setCustomHexInput] = useState('');
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  // Sheet configuration state
  const [config, setConfig] = useState<PageConfig>({
    paperType: 'lined',
    fontFamily: 'sans',
    inkColor: 'blue',
    penStyle: 'gel',
    lineSpacing: 28,
    letterSpacing: 1,
    wordSpacing: 16,
    tiltVariance: 3,
    spacingVariance: 0.8,
    baselineVariance: 0.4,
    strokeThickness: 1.4,
    noiseLevel: 0.3,
    margins: { top: 45, bottom: 45, left: 50, right: 50 },
    showMargins: true,
    curvedLines: true,
    paperTexture: 'clean',
    paperEffect: 'none'
  });

  // Synchronize Custom Hex Input with active color values (Ink color vs. Text outline)
  useEffect(() => {
    const activeColor = colorTab === 'ink' 
      ? config.inkColor 
      : (config.textOutlineColor || '');
    
    // Convert named preset back to true hex for the HTML native color picker
    const resolvedHex = {
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
    }[activeColor as string] || activeColor;

    if (resolvedHex && resolvedHex.startsWith('#')) {
      setCustomHexInput(resolvedHex);
    } else {
      setCustomHexInput('#ffffff');
    }
  }, [colorTab, config.inkColor, config.textOutlineColor]);

  // Source text inputs
  const [textInput, setTextInput] = useState<string>(
    `Привет! Данный текст демонстрирует различные каллиграфические возможности синтеза, включая сложные кириллические связки и физико-математические формулы.

1. Тестирование соединений и «заборного» эффекта (с защитой от «эффекта штампа» для повторяющихся нн, сс, ее, лл, оо):
• лишишься (проверка заборного эффекта ш—и—ш—ь—с—я)
• минимум (проверка букв м—и—н—и—м—у—м)
• съешьте (проверка букв с хвостиками и верхних выносов с, ъ, е, ш, ь, т, е)
• длинный, касса, аллея, воодушевление, ассоциация (каждая из двойных букв нн, сс, лл, оо, ее деформируется асимметрично, заменяя «штамп» на живой человеческий почерк)
• жужжание / филиал (сложная анатомия жж, фл, фи, буквы с хвостиками з, ц, щ, д, у)
• бытие / вьюга / объявление / соловьи (связки с ь, ъ, ы: ые, ью, ья, ье, ьо, ыи)

2. Украинские связки и сложные анатомические группы (включая защиту от наложений точек її/їй/бё/ъё):
• дзиґа / джміль (проверка связок дз, дж, букв ґ и і)
• її, їй, ії (проверка защиты от слияния точек-вредителей через чередующийся сдвиг)
• бё, ъё (проверка защиты от срезания точек длинными верхними хвостами букв б и ъ)
• з’їв, комп’ютер, подвір’я (проверка контекстной бесшовной связки после апострофа: ’я, ’ю, ’є, ’ї)

3. English Handwriting & Continuous Ligatures:
• difficult affiliation (testing connections of ff, fi, fl, ft)
• theology of the shining choir (connections of th, te, sh, ch, of, to)
• different opinion and treatment (connections of er, en, on, an, in, is, it, yo, re)
• sketchy feelings of commitment (testing ch, ck, oo, ll, tt, ment, ing, ion)

4. Демонстрация продвинутых физико-математических формул:
Вы можете вписывать сложные многоэтажные формулы LaTeX прямо на лист в формате двойных знаков доллара:

$$ \\int_{a}^{b} x^2 dx = \\frac{b^3 - a^3}{3} $$

$$ \\sum_{n=1}^{\\infty} \\frac{\\theta + \\lambda}{\\mu^2} $$

$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$

$$ \\psi(x, t) = \\alpha \\cdot e^{i(kx - \\omega t)} $$

$$ \\Delta = e^2 + \\frac{\\alpha + \\gamma}{\\delta \\cdot \\sigma} $$

$$ \\sin^2(\\theta) + \\cos^2(\\theta) = 1 $$

$$ \\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e $$

$$ \\log_2(x) + \\ln(y) = \\tan(\\phi) $$

Желаем продуктивной работы с Handwriting AI!`
  );

  const [fontSize, setFontSize] = useState<number>(24);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [newSigName, setNewSigName] = useState<string>('');
  const [newSigText, setNewSigText] = useState<string>('');

  // Get active signature text
  const activeSignatureText = activeSignature ? activeSignature.signature : '';

  // Generate layouts
  const renderedPages = wrapTextIntoPages(
    textInput + (showSignature && activeSignatureText ? `\n\n\n\n\n\n\n\n\n                                                   ${activeSignatureText}` : ''),
    config,
    activeStyle,
    fontSize,
    styles
  );

  // Apply simulated Telegram Theme variables
  const handleApplyTelegramTheme = (tgTheme: any) => {
    if (!tgTheme) return;
    document.documentElement.style.setProperty('--tg-theme-bg-color', tgTheme.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', tgTheme.text_color || '#333');
    document.documentElement.style.setProperty('--tg-theme-button-color', tgTheme.button_color || '#2481cc');
  };

  const insertLaTeXTemplate = (template: string) => {
    setTextInput(prev => prev + `\n$$ ${template} $$`);
  };

  const insertTableTemplate = (type: 'ruler' | 'handdrawn' | 'printed') => {
    const template = type === 'ruler'
      ? `\n[table:ruler]\n| Товар | Кол-во | Цена |\n| Хлеб  | 1      | 50р  |\n| Молоко| 2      | 90р  |\n[endtable]\n`
      : type === 'printed'
      ? `\n[table:printed]\n| Товар | Кол-во | Цена |\n| Книга | 1      | 450р |\n| Ручка | 3      | 30р  |\n[endtable]\n`
      : `\n[table:handdrawn]\n| Товар | Кол-во | Цена |\n| Книга | 1      | 450р |\n| Ручка | 3      | 30р  |\n[endtable]\n`;
    setTextInput(prev => prev + template);
  };

  const handleAISummarize = async () => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/gemini/optimize-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput })
      });
      const data = await response.json();
      if (data.result) {
        setTextInput(data.result);
      }
    } catch {
      alert('Не удалось оптимизировать структуру текста без настроенного ключа Gemini.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-x-hidden pb-10">
      {/* Brand Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-200">
              <Edit3 size={20} />
            </div>
            <div>
              <h1 id="app-title" className="text-sm font-bold tracking-tight text-gray-950 flex items-center gap-2">
                TypeScribe AI Handwriting
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold">MVP 2.0</span>
              </h1>
              <p className="text-[10.5px] text-gray-400 font-semibold tracking-wide">
                ЦИФРОВАЯ СИСТЕМА ИМИТАЦИИ ПОЧЕРКА И ФОРМУЛ LaTeX
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg cursor-pointer transition-all ${
                activeTab === 'generate' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText size={14} />
              <span>Генератор листов</span>
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg cursor-pointer transition-all ${
                activeTab === 'studio' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Compass size={14} />
              <span>Студия стилей</span>
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg cursor-pointer transition-all ${
                activeTab === 'telegram' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Bot size={14} />
              <span>Фид Telegram-бота</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column Controls */}
              <div className="lg:col-span-5 flex flex-col gap-6">

                {/* Handwriting Selection Panel with Elegant Dropdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative z-35 font-sans" id="handwriting-dropdown-panel">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                      Выберите стиль почерка
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Всего: {styles.length}
                    </span>
                  </div>

                  {/* Dropdown Display Button */}
                  <div className="relative">
                    <button
                      onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                      className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 px-3.5 transition-all cursor-pointer text-left shadow-xs hover:shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-base select-none group-hover:scale-105 transition-transform">
                          ✍️
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            Активный шрифт
                          </div>
                          <div className="text-xs font-bold text-slate-800 leading-tight">
                            {getFontLabel(activeStyle.id, styles)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getFontFlags(activeStyle.id).map((flag, idx) => (
                            <span key={idx} className="text-xs filter drop-shadow-xs">{flag}</span>
                          ))}
                        </div>
                        <span className={`text-slate-400 transition-transform duration-300 text-[10px] ${isFontDropdownOpen ? 'rotate-180 text-purple-500' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    {/* Absolute Dropdown Overlay */}
                    {isFontDropdownOpen && (
                      <>
                        {/* Outside click handler backdrop */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default"
                          onClick={() => setIsFontDropdownOpen(false)} 
                        />
                        
                        <div className="absolute top-[102%] left-0 right-0 z-50 bg-white border border-slate-200/95 shadow-xl rounded-2xl p-2.5 mt-1 max-h-[360px] overflow-hidden flex flex-col animate-fade-in">
                          {/* Sorter / Category Header */}
                          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1.5">
                            <span>По дате добавления</span>
                            <span className="text-purple-500">▼</span>
                          </div>

                          {/* Font List Container */}
                          <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-none">
                            {styles.map(style => {
                              const isSelected = style.id === selectedStyleId;
                              const fontLabel = getFontLabel(style.id, styles);
                              const flags = getFontFlags(style.id);
                              
                              // Determine display typography based on the font-family configuration
                              const fontStyleObj = style.useFont && style.fontFamily 
                                ? { fontFamily: style.fontFamily } 
                                : { fontFamily: '"Marck Script", "Caveat", cursive', fontStyle: 'italic' as const };

                              return (
                                <button
                                  key={style.id}
                                  onClick={() => {
                                    setSelectedStyleId(style.id);
                                    const preset = STYLE_CONFIG_PRESETS[style.id];
                                    if (preset) {
                                      setConfig(prev => ({ ...prev, ...preset }));
                                    }
                                    setIsFontDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                                    isSelected 
                                      ? 'bg-purple-50/80 border border-purple-200/50' 
                                      : 'hover:bg-slate-50 border border-transparent'
                                  }`}
                                >
                                  <div>
                                    <div 
                                      className={`text-sm font-bold text-slate-800 leading-tight tracking-normal mb-0.5 ${
                                        isSelected ? 'text-purple-700' : 'text-slate-800'
                                      }`}
                                      style={fontStyleObj}
                                    >
                                      {fontLabel}
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-bold leading-none">
                                      от {style.creator}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 pl-2">
                                    {flags.map((flag, idx) => (
                                      <span key={idx} className="text-xs tracking-tighter filter drop-shadow-xs">{flag}</span>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Horizontal divider */}
                          <div className="h-px bg-slate-100 my-1.5" />

                          {/* Bottom Action Panel */}
                          <div className="flex flex-col gap-1 px-0.5">
                            <button
                              onClick={async () => {
                                if (isLoadingMore) return;
                                setIsLoadingMore(true);
                                // Simulation of loading extra premium handwritten styles
                                await new Promise(resolve => setTimeout(resolve, 800));
                                
                                // Inject custom mock styles to satisfy the "load more" screen behavior
                                const premiumStyles: HandwritingStyle[] = [
                                  {
                                    id: 'premium-script-48',
                                    name: 'Каллиграфия #48 (Анастасия Г.)',
                                    creator: 'Анастасия Г.',
                                    description: 'Высокохудожественный стиль с летящими росчерками.',
                                    slant: 11,
                                    letterSpacing: 2,
                                    baselineOffset: 1,
                                    glyphs: {},
                                    useFont: true,
                                    fontFamily: 'Playpen Sans'
                                  },
                                  {
                                    id: 'premium-kalam-36',
                                    name: 'Чернила Калам #36 (Нурлан Б.)',
                                    creator: 'Нурлан Б.',
                                    description: 'Выразительный казахский почерк широким пером.',
                                    slant: 5,
                                    letterSpacing: 3,
                                    baselineOffset: -1,
                                    glyphs: {},
                                    useFont: true,
                                    fontFamily: 'Kalam'
                                  }
                                ];
                                
                                setStyles(prev => {
                                  // filter existing to avoid duplicate loading keys
                                  const filtered = prev.filter(s => !s.id.startsWith('premium-'));
                                  return [...filtered, ...premiumStyles];
                                });
                                setIsLoadingMore(false);
                              }}
                              disabled={isLoadingMore}
                              className="w-full text-center text-[10px] font-bold text-blue-600 hover:text-blue-700 py-1 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {isLoadingMore ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                  <span>Загрузка шрифтов...</span>
                                </>
                              ) : (
                                <span>Загрузить остальные шрифты...</span>
                              )}
                            </button>

                            <div className="grid grid-cols-2 gap-1.5 mt-1">
                              <button
                                onClick={() => setFontsInfoModal(true)}
                                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] py-1 px-2 rounded-lg transition-all text-center cursor-pointer"
                              >
                                Подробнее
                              </button>
                              
                              <button
                                onClick={() => {
                                  setIsFontDropdownOpen(false);
                                  setActiveTab('studio');
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] py-1 px-2 rounded-lg transition-all text-center cursor-pointer shadow-xs shadow-purple-500/10"
                              >
                                Добавить шрифт
                              </button>
                            </div>
                          </div>

                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Text & LaTeX input panel */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                      Текст для конвертации
                    </span>
                    <button
                      onClick={handleAISummarize}
                      disabled={isTranslating}
                      className="flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md hover:bg-purple-100 border border-purple-100 transition-all cursor-pointer"
                    >
                      <Sparkles size={11} />
                      <span>{isTranslating ? 'Улучшение...' : 'Улучшить с AI'}</span>
                    </button>
                  </div>

                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={8}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none rounded-xl p-4 text-xs font-medium leading-relaxed font-sans shadow-inner placeholder-gray-400"
                    placeholder="Введите ваши конспекты, абзацы или LaTeX формулы..."
                  />

                  {/* Math Injection Templates */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2 tracking-wider flex items-center gap-1">
                      <Sigma size={11} className="text-blue-500" />
                      Вставить математический шаблон
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => insertLaTeXTemplate('\\frac{\\alpha + \\beta}{x^2}')}
                        className="bg-gray-50 border border-gray-200 hover:border-blue-500 text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                      >
                        Дробь
                      </button>
                      <button
                        onClick={() => insertLaTeXTemplate('\\int_{a}^{b} x^2 dx')}
                        className="bg-gray-50 border border-gray-200 hover:border-blue-500 text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                      >
                        Интеграл с пределами
                      </button>
                      <button
                        onClick={() => insertLaTeXTemplate('\\sqrt{a^2 + b^2}')}
                        className="bg-gray-50 border border-gray-200 hover:border-blue-500 text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                      >
                        Квадратный корень
                      </button>
                      <button
                        onClick={() => insertLaTeXTemplate('\\sum_{k=1}^{n} k')}
                        className="bg-gray-50 border border-gray-200 hover:border-blue-500 text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                      >
                        Сумма
                      </button>
                      <button
                        onClick={() => insertLaTeXTemplate('\\frac{\\frac{a + b}{c}}{\\frac{d}{e}}')}
                        className="bg-gray-50 border border-gray-200 hover:border-blue-500 text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer text-blue-600"
                        title="Трехэтажная дробь"
                      >
                        3-этажная дробь
                      </button>
                      <button
                        onClick={() => insertLaTeXTemplate('\\frac{\\frac{\\frac{a}{b}}{c}}{\\frac{d}{e}}')}
                        className="bg-gray-50 border border-gray-200 hover:border-blue-500 text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer text-purple-600"
                        title="Четырехэтажная дробь"
                      >
                        4-этажная дробь
                      </button>
                      <button
                        onClick={() => insertLaTeXTemplate('\\sqrt[99999]{x^2 + y^2 + \\frac{\\alpha}{\\beta}}')}
                        className="bg-gray-50 border border-gray-200 hover:border-blue-500 text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer text-emerald-600"
                        title="Корень 99999 степени"
                      >
                        Корень 99999 ст.
                      </button>
                    </div>
                  </div>

                  {/* Table Templates */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2 tracking-wider flex items-center gap-1">
                      <Table2 size={11} className="text-purple-600" />
                      Вставить рукописную таблицу
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => insertTableTemplate('ruler')}
                        className="bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md text-purple-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>📏 Нарисовать по линейке</span>
                      </button>
                      <button
                        onClick={() => insertTableTemplate('handdrawn')}
                        className="bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md text-orange-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>✍️ Слегка неровно от руки</span>
                      </button>
                    </div>
                  </div>

                  {/* Print & Form Field Templates */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-2 tracking-wider flex items-center gap-1">
                      <Settings2 size={11} className="text-emerald-600" />
                      Печатная разметка и Бланки
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => insertTableTemplate('printed')}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md text-emerald-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>🖨️ Печатная таблица</span>
                      </button>
                      <button
                        onClick={() => {
                          setTextInput(prev => prev + `\n[line:200:ФИО] [style:neat-school]Иванов Иван Иванович[/style] [/line]\n[line:100:Дата] [style:neat-school]25.05.2026[/style] [/line] [line:100:Подпись]             [/line]`);
                        }}
                        className="bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md text-teal-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>➖ Строка бланка (ФИО, Дата)</span>
                      </button>
                      <button
                        onClick={() => {
                          setTextInput(prev => prev + `\n[print]Печатный текст Serif (Times New Roman)[/print]`);
                        }}
                        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md text-gray-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>📜 Печатный Serif</span>
                      </button>
                      <button
                        onClick={() => {
                          setTextInput(prev => prev + `\n[print:sans]Печатный текст Sans (Inter/Arial)[/print]`);
                        }}
                        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md text-gray-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>📄 Печатный Sans</span>
                      </button>
                      <button
                        onClick={() => {
                          setTextInput(prev => prev + `\n[print:mono]Печатная машинка (Courier)[/print]`);
                        }}
                        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md text-gray-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>📟 Машинка (Mono)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Margins & Sizing Adjusters */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="text-blue-600" size={16} />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
                      Параметры разметки
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 block mb-1">ТИП БУМАГИ</label>
                      <select
                        value={config.paperType}
                        onChange={(e) => setConfig({ ...config, paperType: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                      >
                        <option value="lined">Линейка</option>
                        <option value="squared">Клетка</option>
                        <option value="blank">Чистый лист</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 block mb-1">ИНСТРУМЕНТ И СТИЛЬ ПИСЬМА</label>
                      <select
                        value={
                          config.toolType === 'pen' || !config.toolType
                            ? `pen_${config.penStyle || 'gel'}`
                            : config.toolType
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          let newTool: 'pen' | 'felt' | 'pencil' | 'colored-pencil' | 'marker' = 'pen';
                          let newStyle: 'ballpoint' | 'fountain' | 'gel' = 'gel';
                          
                          if (val.startsWith('pen_')) {
                            newTool = 'pen';
                            newStyle = val.replace('pen_', '') as any;
                          } else {
                            newTool = val as any;
                          }
                          
                          // Look up corresponding thickness default value
                          const thicknessDefault = {
                            pen_ballpoint: 1.1,
                            pen_gel: 1.4,
                            pen_fountain: 1.6,
                            felt: 4.5,
                            pencil: 1.1,
                            'colored-pencil': 1.5,
                            marker: 15.0
                          }[val] || 1.3;

                          // Retrieve default ink hex for newly chosen tool
                          const activeColorList = REAL_LIFE_COLORS[val as keyof typeof REAL_LIFE_COLORS] || REAL_LIFE_COLORS.pen_ballpoint;
                          const newColor = activeColorList[0].hex;

                          setConfig({
                            ...config,
                            toolType: newTool,
                            penStyle: newStyle,
                            strokeThickness: thicknessDefault,
                            inkColor: newColor
                          });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-blue-600 border-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pen_ballpoint">🖋️ Шариковая ручка (Bic, Pilot)</option>
                        <option value="pen_gel">🧪 Гелевая ручка (Crown, ErichKrause)</option>
                        <option value="pen_fountain">✒️ Перьевая ручка (Parker, Lamy)</option>
                        <option value="felt">🖍️ Фломастер (Centropen, Koh-i-Noor)</option>
                        <option value="pencil">✏️ Простой карандаш (Твердости HB, 2B, H)</option>
                        <option value="colored-pencil">🎨 Цветной карандаш (Faber-Castell)</option>
                        <option value="marker">⚡ Текстовыделитель (Stabilo Boss)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 block mb-1">СТИЛЬ ТЕКСТА</label>
                      <select
                        value={config.fontFamily}
                        onChange={(e) => setConfig({ ...config, fontFamily: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold"
                      >
                        <option value="sans">Без засечек</option>
                        <option value="serif">С засечками</option>
                      </select>
                    </div>
                  </div>

                  {/* Ink/Graphite Color Palette */}
                  {/* Office-Style Segmented Tab for Ink vs Text Outline */}
                  <div className="pt-3.5 border-t border-gray-100 flex flex-col gap-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">Палитра цветов и стержней</label>
                      <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2.5 py-0.5 rounded border border-gray-100 truncate max-w-[200px]" title={config.inkColor}>
                        {colorTab === 'ink'
                          ? `След: ${
                              Object.values(REAL_LIFE_COLORS).flat().find(c => c.hex === config.inkColor)?.name || 
                              PALETTE_COLORS.find(c => c.id === config.inkColor)?.name || 
                              config.inkColor
                            }`
                          : `Окантовка: ${config.textOutlineColor || 'Без окантовки'}`}
                      </span>
                    </div>

                    {/* Segmented Tab controls */}
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setColorTab('ink')}
                        className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          colorTab === 'ink'
                            ? 'bg-white text-gray-850 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        🖋️ Цвет чернил / грифеля
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorTab('outline')}
                        className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          colorTab === 'outline'
                            ? 'bg-white text-gray-850 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        ✨ Окантовка текста
                      </button>
                    </div>

                    {/* Realistic Ink Selection Grid (for Ink Tab) */}
                    {colorTab === 'ink' && (
                      <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-gray-150 shadow-sm">
                        <div className="flex flex-col mb-1.5 animate-fadeIn">
                          <span className="text-[9.5px] font-black text-blue-600 tracking-wider uppercase mb-0.5">🎨 Аутентичные чернила из реальной жизни</span>
                          <span className="text-[9px] text-gray-400 leading-tight">Профессиональные пигменты и графиты мировых канцелярских брендов</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {(() => {
                            const activeToolKey = config.toolType === 'pen' || !config.toolType
                              ? `pen_${config.penStyle || 'gel'}`
                              : config.toolType;
                            const activeColors = REAL_LIFE_COLORS[activeToolKey as keyof typeof REAL_LIFE_COLORS] || REAL_LIFE_COLORS.pen_ballpoint;
                            
                            return activeColors.map((colorItem) => {
                              const isSelected = config.inkColor === colorItem.hex;
                              return (
                                <button
                                  key={colorItem.id}
                                  type="button"
                                  onClick={() => {
                                    setConfig({ ...config, inkColor: colorItem.hex });
                                  }}
                                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all hover:bg-gray-50 cursor-pointer ${
                                    isSelected 
                                      ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400/30 font-semibold' 
                                      : 'border-gray-150 bg-white'
                                  }`}
                                >
                                  {/* Glossy color drop */}
                                  <div className="relative w-5 h-5 rounded-full border border-black/10 shadow-sm flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: colorItem.hex }}>
                                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white/45 pointer-events-none" />
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm invert" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 leading-tight">
                                    <div className="text-[10px] font-extrabold text-gray-800 truncate">{colorItem.name}</div>
                                    <div className="text-[8.5px] text-gray-400 truncate leading-none">{colorItem.comment}</div>
                                  </div>
                                </button>
                              );
                            });
                          })()}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                          className="text-[9.5px] font-bold text-gray-400 hover:text-blue-500 transition-all flex items-center justify-center gap-1 mt-1 pt-1.5 border-t border-gray-100 cursor-pointer"
                        >
                          {showAdvancedColors ? '▲ Скрыть расширенную Office-палитру' : '▼ Показать полную палитру цветов и оттенков'}
                        </button>
                      </div>
                    )}

                    {/* Office Grid Display Header */}
                    {((colorTab === 'outline') || (colorTab === 'ink' && showAdvancedColors)) && (
                      <div className="flex flex-col gap-2.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100 animate-fadeIn">
                      
                      {/* Theme Colors Matrix (10 Columns, 6 Rows of Shades) */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">Цвета темы</span>
                        <div className="flex justify-between gap-[3px] bg-white p-2 rounded-lg border border-gray-100 shadow-inner overflow-x-auto">
                          {OFFICE_THEME_COLUMNS.map((col, colIdx) => {
                            return (
                              <div key={colIdx} className="flex flex-col gap-[3px] flex-1 min-w-[14px] max-w-[28px]">
                                {col.shades.map((shade, shadeIdx) => {
                                  const isInkTab = colorTab === 'ink';
                                  
                                  // Graphite pencil only supports grays / black-whites
                                  let isShadeAllowed = true;
                                  if (isInkTab && config.toolType === 'pencil') {
                                    isShadeAllowed = colIdx === 0 || colIdx === 1;
                                  }

                                  const isSelected = isInkTab
                                    ? config.inkColor === shade
                                    : config.textOutlineColor === shade;

                                  return (
                                    <button
                                      key={shadeIdx}
                                      type="button"
                                      disabled={!isShadeAllowed}
                                      onClick={() => {
                                        if (isInkTab) {
                                          setConfig({ ...config, inkColor: shade });
                                        } else {
                                          setConfig({ ...config, textOutlineColor: shade });
                                        }
                                      }}
                                      className={`aspect-square w-full rounded-[1px] transition-all relative cursor-pointer border-[0.5px] border-black/5 hover:scale-115 active:scale-95 ${
                                        isSelected ? 'ring-1 ring-offset-[0.5px] ring-blue-500 scale-105 z-10' : ''
                                      } ${!isShadeAllowed ? 'opacity-10 cursor-not-allowed hover:scale-100' : ''}`}
                                      style={{ backgroundColor: shade }}
                                      title={`${col.name} (Оттенок ${shadeIdx + 1}): ${shade}`}
                                    >
                                      {isSelected && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm invert" />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Standard Colors Row */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider block">Стандартные цвета</span>
                        <div className="flex justify-between gap-[3.5px] bg-white p-2 rounded-lg border border-gray-100 shadow-inner">
                          {OFFICE_STANDARD_COLORS.map((colorHex, idx) => {
                            const isInkTab = colorTab === 'ink';
                            let isColorAllowed = true;
                            if (isInkTab && config.toolType === 'pencil') {
                              isColorAllowed = false;
                            }

                            const isSelected = isInkTab
                              ? config.inkColor === colorHex
                              : config.textOutlineColor === colorHex;

                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={!isColorAllowed}
                                onClick={() => {
                                  if (isInkTab) {
                                    setConfig({ ...config, inkColor: colorHex });
                                  } else {
                                    setConfig({ ...config, textOutlineColor: colorHex });
                                  }
                                }}
                                className={`aspect-square flex-1 min-w-[14px] max-w-[28px] rounded transition-all relative cursor-pointer border-[0.5px] border-black/5 hover:scale-[1.2] active:scale-90 ${
                                  isSelected ? 'ring-1 ring-offset-[0.5px] ring-blue-500 scale-[1.1] z-10' : ''
                                } ${!isColorAllowed ? 'opacity-10 cursor-not-allowed hover:scale-100' : ''}`}
                                style={{ backgroundColor: colorHex }}
                                title={`Стандартный цвет: ${colorHex}`}
                              >
                                {isSelected && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm invert" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Spectrum Picker and direct HEX input */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">Спектр:</span>
                          <input
                            type="color"
                            value={customHexInput}
                            onChange={(e) => {
                               const value = e.target.value;
                               if (colorTab === 'ink') {
                                 setConfig({ ...config, inkColor: value });
                               } else {
                                 setConfig({ ...config, textOutlineColor: value });
                               }
                            }}
                            className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 bg-white shadow-sm flex-shrink-0"
                          />
                        </div>

                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-[9.5px] font-mono font-bold text-gray-400">HEX:</span>
                          <input
                            type="text"
                            value={customHexInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomHexInput(val);
                              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                if (colorTab === 'ink') {
                                  setConfig({ ...config, inkColor: val });
                                } else {
                                  setConfig({ ...config, textOutlineColor: val });
                                }
                              }
                            }}
                            placeholder="#000000"
                            className="w-full max-w-[70px] bg-white border border-gray-250 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-gray-700 outline-none focus:border-blue-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (colorTab === 'ink') {
                              // Reset ink to standard blue
                              setConfig({ ...config, inkColor: 'blue' });
                            } else {
                              // Reset/remove text outline color
                              setConfig({ ...config, textOutlineColor: undefined });
                            }
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-150 rounded-lg transition-all flex items-center gap-0.5 flex-shrink-0 cursor-pointer"
                        >
                          <RotateCcw size={10} />
                          <span>Сбросить</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                  {/* Dynamic Font Size Adjustment Slider + Quick Actions */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400">РАЗМЕР ШРИФТА (ПОЧЕРКА)</label>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="16"
                        max="36"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => setFontSize(18)}
                          className={`px-2 py-0.5 text-[10px] sm:text-[10.5px] font-bold rounded border cursor-pointer hover:bg-gray-50 transition-all ${fontSize <= 20 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                          Мелкий
                        </button>
                        <button
                          onClick={() => setFontSize(24)}
                          className={`px-2 py-0.5 text-[10px] sm:text-[10.5px] font-bold rounded border cursor-pointer hover:bg-gray-50 transition-all ${fontSize > 20 && fontSize < 28 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                          Средний
                        </button>
                        <button
                          onClick={() => setFontSize(30)}
                          className={`px-2 py-0.5 text-[10px] sm:text-[10.5px] font-bold rounded border cursor-pointer hover:bg-gray-50 transition-all ${fontSize >= 28 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                          Крупный
                        </button>
                      </div>
                    </div>

                    {/* Smart advisor box for felt-tip and marker pens */}
                    {(config.inkColor === 'marker-yellow' || config.inkColor === 'felt-pink' || config.inkColor === 'felt-blue') && fontSize < 26 && (
                      <div className="mt-1 text-[11px] leading-relaxed text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex flex-col gap-1.5 animate-fadeIn">
                        <span className="font-bold flex items-center gap-1">
                          ⚠️ Слишком толстый инструмент!
                        </span>
                        <span>
                          Из-за толщины фломастера или маркера буквы могут сливаться в сплошные пятна при малом размере шрифта ({fontSize}px). Советуем увеличить размер почерка.
                        </span>
                        <button
                          onClick={() => setFontSize(28)}
                          className="self-start text-[10px] font-bold bg-amber-100 px-2.5 py-1 rounded cursor-pointer hover:bg-amber-200 text-amber-800 transition-colors flex items-center gap-1"
                        >
                          🪄 Сделать шрифт крупным (28px)
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 block mb-1">ТЕКСТУРА БУМАГИ</label>
                      <select
                        value={config.paperTexture || 'clean'}
                        onChange={(e) => setConfig({ ...config, paperTexture: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-blue-600 border-blue-100"
                      >
                        <option value="clean">Чистый цифровой лист</option>
                        <option value="fiber">Волокнистая бумага</option>
                        <option value="copy">Скан / Ксерокопия</option>
                        <option value="vintage">Винтажная бумага (Под чай)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 block mb-1">ОСВЕЩЕНИЕ И СКАН-ЭФФЕКТЫ</label>
                      <select
                        value={config.paperEffect || 'none'}
                        onChange={(e) => setConfig({ ...config, paperEffect: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-purple-600 border-purple-100"
                      >
                        <option value="none">Без эффектов</option>
                        <option value="shadow">Тень от телефона / камеры</option>
                        <option value="crumpled">Мятый лист</option>
                        <option value="scanner">Фильтр CamScanner (Контрастный)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 block mb-1">КРАСНЫЕ ПОЛЯ</label>
                      <button
                        onClick={() => setConfig({ ...config, showMargins: !config.showMargins })}
                        className={`w-full py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          config.showMargins
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-white border-gray-200 text-gray-650'
                        }`}
                      >
                        {config.showMargins ? 'Показать поля' : 'Без полей'}
                      </button>
                    </div>
                  </div>

                  {/* Range inputs for physics simulation */}
                  <div className="flex flex-col gap-3 mt-1">
                    <div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-1">
                        <span>РАЗБРОС НАКЛОНА БУКВ</span>
                        <span className="text-gray-700">{config.tiltVariance}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={config.tiltVariance}
                        onChange={(e) => setConfig({ ...config, tiltVariance: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-1">
                        <span>РАЗБРОС ИНТЕРВАЛОВ (ХАОС)</span>
                        <span className="text-gray-700">{config.spacingVariance}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.spacingVariance}
                        onChange={(e) => setConfig({ ...config, spacingVariance: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-1">
                        <span>ВОЛНИСТОСТЬ СТРОКИ</span>
                        <span className="text-gray-700">{config.baselineVariance}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.baselineVariance}
                        onChange={(e) => setConfig({ ...config, baselineVariance: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-1">
                        <span>МЕЖСТРОЧНЫЙ ИНТЕРВАЛ</span>
                        <span className="text-gray-700">{config.lineSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        min="22"
                        max="38"
                        step="1"
                        value={config.lineSpacing}
                        onChange={(e) => setConfig({ ...config, lineSpacing: parseInt(e.target.value) })}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-1">
                        <span>РАЗМЕР ШРИФТА (ПОЧЕРКА)</span>
                        <span className="text-gray-700">{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="36"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-1">
                        <span>{getToolThicknessMeta(config.inkColor, config.toolType)?.label || 'ТОЛЩИНА ПЕРА (ЛИНИИ)'}</span>
                        <span className="text-gray-700 font-bold">{config.strokeThickness.toFixed(1)}px</span>
                      </div>
                      <input
                        type="range"
                        min={getToolThicknessMeta(config.inkColor, config.toolType)?.min || 0.5}
                        max={getToolThicknessMeta(config.inkColor, config.toolType)?.max || 3.0}
                        step={getToolThicknessMeta(config.inkColor, config.toolType)?.step || 0.1}
                        value={config.strokeThickness}
                        onChange={(e) => setConfig({ ...config, strokeThickness: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                      <span className="text-[9.5px] mt-1 text-gray-400 block font-normal">
                        {getToolThicknessMeta(config.inkColor, config.toolType)?.desc}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 mb-1">
                        <span>АККУРАТНОСТЬ И ПОСТОЯНСТВО</span>
                        <span className="text-gray-700">{((1 - Math.min(config.noiseLevel / 2.0, 1)) * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.noiseLevel}
                        onChange={(e) => setConfig({ ...config, noiseLevel: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Signature builder */}
                  <div className="border-t border-gray-100 pt-3.5 mt-1 animate-fadeIn">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <Fingerprint size={12} className="text-blue-500" />
                        БИБЛИОТЕКА ПОДПИСЕЙ
                      </span>
                      <button
                        onClick={() => setShowSignature(!showSignature)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer hover:bg-gray-50 transition-all ${
                          showSignature 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {showSignature ? '● Подпись включена' : '○ Выключена'}
                      </button>
                    </div>

                    {showSignature && (
                      <div className="flex flex-col gap-2">
                        {/* Selector of signatures */}
                        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {currentSignatures.map((sig) => {
                            const isSelected = sig.id === activeSigId;
                            return (
                              <div 
                                key={sig.id}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                                  isSelected 
                                    ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold' 
                                    : 'bg-gray-50/40 border-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <div 
                                  className="flex-1 cursor-pointer flex items-center gap-2"
                                  onClick={() => {
                                    setSelectedSignatureIds(prev => ({
                                      ...prev,
                                      [activeStyle.id]: sig.id
                                    }));
                                  }}
                                >
                                  <input 
                                    type="radio" 
                                    checked={isSelected}
                                    readOnly
                                    className="accent-blue-600"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">{sig.name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">Подпись на бумаге: "{sig.signature}"</span>
                                  </div>
                                </div>

                                {/* Delete button if not default */}
                                {!sig.id.includes('-def-') && sig.id !== 's1' && sig.id !== 's2' && (
                                  <button
                                    onClick={() => {
                                      const updatedList = currentSignatures.filter(s => s.id !== sig.id);
                                      setFontSignatures(prev => ({
                                        ...prev,
                                        [activeStyle.id]: updatedList
                                      }));
                                      if (isSelected && updatedList.length > 0) {
                                        setSelectedSignatureIds(prev => ({
                                          ...prev,
                                          [activeStyle.id]: updatedList[0].id
                                        }));
                                      }
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                                    title="Удалить подпись"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Signature Form */}
                        <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 block">СОЗДАТЬ ПОДПИСЬ ДЛЯ ЭТОГО ШРИФТА</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={newSigName}
                              onChange={(e) => setNewSigName(e.target.value)}
                              placeholder="ФИО владельца"
                              className="bg-white border border-gray-200 outline-none rounded-lg p-2 text-[11px] font-medium"
                            />
                            <input
                              type="text"
                              value={newSigText}
                              onChange={(e) => setNewSigText(e.target.value)}
                              placeholder="Текст подписи"
                              className="bg-white border border-gray-200 outline-none rounded-lg p-2 text-[11px] font-medium"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (!newSigName.trim() || !newSigText.trim()) return;
                              const newSigItem: SignatureItem = {
                                id: `user-sig-${Date.now()}`,
                                name: newSigName.trim(),
                                signature: newSigText.trim()
                              };
                              const updatedList = [...currentSignatures, newSigItem];
                              
                              setFontSignatures(prev => ({
                                ...prev,
                                [activeStyle.id]: updatedList
                              }));
                              setSelectedSignatureIds(prev => ({
                                ...prev,
                                [activeStyle.id]: newSigItem.id
                              }));
                              setNewSigName('');
                              setNewSigText('');
                            }}
                            className="w-full bg-blue-600 text-white rounded-lg p-1.5 text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Plus size={12} /> Добавить подпись
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column Canvas Preview */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">
                    Реалистичный предпросмотр документа
                  </span>
                  <A4Paper pages={renderedPages} config={config} fontSize={fontSize} style={activeStyle} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'studio' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <StyleStudio 
                currentStyle={activeStyle} 
                onSaveStyle={(newStyle) => {
                  setStyles(prev => {
                    const idx = prev.findIndex(s => s.id === newStyle.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = newStyle;
                      return updated;
                    }
                    return [...prev, newStyle];
                  });
                  setSelectedStyleId(newStyle.id);
                }} 
                availableStyles={styles}
                onDeleteStyle={(id) => {
                  setStyles(prev => prev.filter(s => s.id !== id));
                  if (selectedStyleId === id) {
                    setSelectedStyleId('elegant-cursive');
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === 'telegram' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <TelegramSimulator 
                onApplyTelegramTheme={handleApplyTelegramTheme}
                mockUser={{
                  id: 10492850,
                  first_name: 'Александр',
                  last_name: 'Климов',
                  username: 'alex_klim'
                }}
                textInput={textInput}
                setTextInput={setTextInput}
                selectedStyleId={selectedStyleId}
                setSelectedStyleId={setSelectedStyleId}
                config={config}
                setConfig={setConfig}
                fontSize={fontSize}
                setFontSize={setFontSize}
                activeStyle={activeStyle}
                availableStyles={styles}
                onOpenGeneratorWithText={(text) => {
                  setTextInput(text);
                  setActiveTab('generate');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Font Details Info Modal Dynamic Overlay */}
      {fontsInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] px-4 animate-fade-in" id="fonts-info-modal">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 transform scale-100 transition-transform flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-purple-600 mb-4">
                <span className="text-3xl">ℹ️</span>
                <h3 className="text-lg font-black text-slate-800 leading-tight">Подробнее о системных шрифтах</h3>
              </div>
              
              <div className="text-xs text-slate-600 space-y-3 mb-6 leading-relaxed font-sans">
                <p className="font-bold">
                  Система поддерживает три основных типа почерка:
                </p>
                <ul className="list-disc pl-4 space-y-1.5 font-semibold text-slate-600">
                  <li><strong className="text-purple-600">Каллиграфические (#03)</strong> — идеальный плавный курсив с выраженными связями и наклоном.</li>
                  <li><strong className="text-purple-600">Школьные аккуратные (#02 + KZ)</strong> — повседневный округлый вид конспектов для быстрой конвертации писем.</li>
                  <li><strong className="text-purple-600">Свободные полупечатные (#05)</strong> — разборчивый студенческий лекционный стиль.</li>
                </ul>
                <p className="font-semibold text-slate-500">
                  Все встроенные шрифты имеют встроенную поддержку мультиязычных символов, знаков препинания, формул LaTeX и специальных локализованных литер стран СНГ.
                </p>
              </div>
            </div>

            <button
              onClick={() => setFontsInfoModal(false)}
              className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
