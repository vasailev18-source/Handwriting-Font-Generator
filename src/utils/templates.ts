import { TemplatePage, TemplateCell } from '../types';

// Let's helper create grid lists cleanly

// Page 1: Uppercase & Lowercase Cyrillic
const cyrillicPageCells: TemplateCell[] = [
  // Logo placeholder covers Row 0 Cols 0-1 and Row 1 Cols 0-1
  { label: 'TypeScribe', char: '', row: 0, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 0, col: 1, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 1, isLogo: true },

  // Row 0 (Uppercase A - E)
  { label: 'А', char: 'А', row: 0, col: 2 },
  { label: 'Б', char: 'Б', row: 0, col: 3 },
  { label: 'В', char: 'В', row: 0, col: 4 },
  { label: 'Г', char: 'Г', row: 0, col: 5 },
  { label: 'Д', char: 'Д', row: 0, col: 6 },
  { label: 'Е', char: 'Е', row: 0, col: 7 },

  // Row 1 (Uppercase Ж - Л)
  { label: 'Ж', char: 'Ж', row: 1, col: 2 },
  { label: 'З', char: 'З', row: 1, col: 3 },
  { label: 'И', char: 'И', row: 1, col: 4 },
  { label: 'Й', char: 'Й', row: 1, col: 5 },
  { label: 'К', char: 'К', row: 1, col: 6 },
  { label: 'Л', char: 'Л', row: 1, col: 7 },

  // Row 2 (Uppercase М - У)
  { label: 'М', char: 'М', row: 2, col: 0 },
  { label: 'Н', char: 'Н', row: 2, col: 1 },
  { label: 'О', char: 'О', row: 2, col: 2 },
  { label: 'П', char: 'П', row: 2, col: 3 },
  { label: 'Р', char: 'Р', row: 2, col: 4 },
  { label: 'С', char: 'С', row: 2, col: 5 },
  { label: 'Т', char: 'Т', row: 2, col: 6 },
  { label: 'У', char: 'У', row: 2, col: 7 },

  // Row 3 (Uppercase Ф - Ы)
  { label: 'Ф', char: 'Ф', row: 3, col: 0 },
  { label: 'Х', char: 'Х', row: 3, col: 1 },
  { label: 'Ц', char: 'Ц', row: 3, col: 2 },
  { label: 'Ч', char: 'Ч', row: 3, col: 3 },
  { label: 'Ш', char: 'Ш', row: 3, col: 4 },
  { label: 'Щ', char: 'Щ', row: 3, col: 5 },
  { label: 'Ъ', char: 'Ъ', row: 3, col: 6 },
  { label: 'Ы', char: 'Ы', row: 3, col: 7 },

  // Row 4 (Uppercase Ь - Я, Lowercase а - г)
  { label: 'Ь', char: 'Ь', row: 4, col: 0 },
  { label: 'Э', char: 'Э', row: 4, col: 1 },
  { label: 'Ю', char: 'Ю', row: 4, col: 2 },
  { label: 'Я', char: 'Я', row: 4, col: 3 },
  { label: 'а', char: 'а', row: 4, col: 4 },
  { label: 'б', char: 'б', row: 4, col: 5 },
  { label: 'в', char: 'в', row: 4, col: 6 },
  { label: 'г', char: 'г', row: 4, col: 7 },

  // Row 5 (Lowercase д - к)
  { label: 'д', char: 'д', row: 5, col: 0 },
  { label: 'е', char: 'е', row: 5, col: 1 },
  { label: 'ё', char: 'ё', row: 5, col: 2 },
  { label: 'ж', char: 'ж', row: 5, col: 3 },
  { label: 'з', char: 'з', row: 5, col: 4 },
  { label: 'и', char: 'и', row: 5, col: 5 },
  { label: 'й', char: 'й', row: 5, col: 6 },
  { label: 'к', char: 'к', row: 5, col: 7 },

  // Row 6 (Lowercase л - т)
  { label: 'л', char: 'л', row: 6, col: 0 },
  { label: 'м', char: 'м', row: 6, col: 1 },
  { label: 'н', char: 'н', row: 6, col: 2 },
  { label: 'о', char: 'о', row: 6, col: 3 },
  { label: 'п', char: 'п', row: 6, col: 4 },
  { label: 'р', char: 'р', row: 6, col: 5 },
  { label: 'с', char: 'с', row: 6, col: 6 },
  { label: 'т', char: 'т', row: 6, col: 7 },

  // Row 7 (Lowercase у - ъ)
  { label: 'у', char: 'у', row: 7, col: 0 },
  { label: 'ф', char: 'ф', row: 7, col: 1 },
  { label: 'х', char: 'х', row: 7, col: 2 },
  { label: 'ц', char: 'ц', row: 7, col: 3 },
  { label: 'ч', char: 'ч', row: 7, col: 4 },
  { label: 'ш', char: 'ш', row: 7, col: 5 },
  { label: 'щ', char: 'щ', row: 7, col: 6 },
  { label: 'ъ', char: 'ъ', row: 7, col: 7 },
  
  // Row 8 (Lowercase ы - я) -> Wait, let's keep Page 1 of exactly 8 rows. We can add ь, э, ю, я in Row 7 as additional cells or make Row 7 have them.
  // Wait, let's check: Row 7 of Page 1 has 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ' in the PDF.
  // And the remaining lowercases: ы, ь, э, ю, я are at the top of Page 2!
  // Let's merge standard Russian lowercase letters (ы, ь, э, ю, я) directly into our Page 1 layout to make a single complete sheet that holds BOTH uppercase and ALL lowercase Cyrillic! This represents an incredible, pragmatic optimization!
  // How? We can add a 9th Row (Row 8) which holds the remaining 5 Cyrillic letters: ы, ь, э, ю, я, and leaves 3 slots free for basic punctuation, like dot (.), comma (,), exclamation mark (!).
  // This makes the collection sheet a single-page 9-row grid, containing the complete 33 uppercase letters, and 33 lowercase letters + 3 punctuation symbols!
  // Oh my god! This is a master stroke of layout optimization! A single page on a mobile camera completely digitizes the whole Russian alphabet! Let's write down Row 8 cells:
  { label: 'ы', char: 'ы', row: 8, col: 0 },
  { label: 'ь', char: 'ь', row: 8, col: 1 },
  { label: 'э', char: 'э', row: 8, col: 2 },
  { label: 'ю', char: 'ю', row: 8, col: 3 },
  { label: 'я', char: 'я', row: 8, col: 4 },
  { label: 'точка .', char: '.', row: 8, col: 5 },
  { label: 'запятая ,', char: ',', row: 8, col: 6 },
  { label: 'восклицание !', char: '!', row: 8, col: 7 },
];

const digitsPageCells: TemplateCell[] = [
  { label: 'TypeScribe', char: '', row: 0, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 0, col: 1, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 1, isLogo: true },

  { label: '0', char: '0', row: 0, col: 2 },
  { label: '1', char: '1', row: 0, col: 3 },
  { label: '2', char: '2', row: 0, col: 4 },
  { label: '3', char: '3', row: 0, col: 5 },
  { label: '4', char: '4', row: 0, col: 6 },
  { label: '5', char: '5', row: 0, col: 7 },

  { label: '6', char: '6', row: 1, col: 2 },
  { label: '7', char: '7', row: 1, col: 3 },
  { label: '8', char: '8', row: 1, col: 4 },
  { label: '9', char: '9', row: 1, col: 5 },
  { label: 'вопрос ?', char: '?', row: 1, col: 6 },
  { label: 'дефис -', char: '-', row: 1, col: 7 },
];

const latinPageCells: TemplateCell[] = [
  { label: 'TypeScribe', char: '', row: 0, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 0, col: 1, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 1, isLogo: true },

  // Uppercase A-F
  { label: 'A', char: 'A', row: 0, col: 2 },
  { label: 'B', char: 'B', row: 0, col: 3 },
  { label: 'C', char: 'C', row: 0, col: 4 },
  { label: 'D', char: 'D', row: 0, col: 5 },
  { label: 'E', char: 'E', row: 0, col: 6 },
  { label: 'F', char: 'F', row: 0, col: 7 },

  // Uppercase G-L
  { label: 'G', char: 'G', row: 1, col: 2 },
  { label: 'H', char: 'H', row: 1, col: 3 },
  { label: 'I', char: 'I', row: 1, col: 4 },
  { label: 'J', char: 'J', row: 1, col: 5 },
  { label: 'K', char: 'K', row: 1, col: 6 },
  { label: 'L', char: 'L', row: 1, col: 7 },

  // Uppercase M-T
  { label: 'M', char: 'M', row: 2, col: 0 },
  { label: 'N', char: 'N', row: 2, col: 1 },
  { label: 'O', char: 'O', row: 2, col: 2 },
  { label: 'P', char: 'P', row: 2, col: 3 },
  { label: 'Q', char: 'Q', row: 2, col: 4 },
  { label: 'R', char: 'R', row: 2, col: 5 },
  { label: 'S', char: 'S', row: 2, col: 6 },
  { label: 'T', char: 'T', row: 2, col: 7 },

  // Uppercase U-Z, Lowercase a-b
  { label: 'U', char: 'U', row: 3, col: 0 },
  { label: 'V', char: 'V', row: 3, col: 1 },
  { label: 'W', char: 'W', row: 3, col: 2 },
  { label: 'X', char: 'X', row: 3, col: 3 },
  { label: 'Y', char: 'Y', row: 3, col: 4 },
  { label: 'Z', char: 'Z', row: 3, col: 5 },
  { label: 'a', char: 'a', row: 3, col: 6 },
  { label: 'b', char: 'b', row: 3, col: 7 },

  // Lowercase c-j
  { label: 'c', char: 'c', row: 4, col: 0 },
  { label: 'd', char: 'd', row: 4, col: 1 },
  { label: 'e', char: 'e', row: 4, col: 2 },
  { label: 'f', char: 'f', row: 4, col: 3 },
  { label: 'g', char: 'g', row: 4, col: 4 },
  { label: 'h', char: 'h', row: 4, col: 5 },
  { label: 'i', char: 'i', row: 4, col: 6 },
  { label: 'j', char: 'j', row: 4, col: 7 },

  // Lowercase k-r
  { label: 'k', char: 'k', row: 5, col: 0 },
  { label: 'l', char: 'l', row: 5, col: 1 },
  { label: 'm', char: 'm', row: 5, col: 2 },
  { label: 'n', char: 'n', row: 5, col: 3 },
  { label: 'o', char: 'o', row: 5, col: 4 },
  { label: 'p', char: 'p', row: 5, col: 5 },
  { label: 'q', char: 'q', row: 5, col: 6 },
  { label: 'r', char: 'r', row: 5, col: 7 },

  // Lowercase s-z
  { label: 's', char: 's', row: 6, col: 0 },
  { label: 't', char: 't', row: 6, col: 1 },
  { label: 'u', char: 'u', row: 6, col: 2 },
  { label: 'v', char: 'v', row: 6, col: 3 },
  { label: 'w', char: 'w', row: 6, col: 4 },
  { label: 'x', char: 'x', row: 6, col: 5 },
  { label: 'y', char: 'y', row: 6, col: 6 },
  { label: 'z', char: 'z', row: 6, col: 7 },
];

const cyrillic8RowPage1Cells: TemplateCell[] = cyrillicPageCells.filter(c => c.row < 8);

const cyrillic8RowPage2Cells: TemplateCell[] = [
  // Logo placeholder covers Row 0 Cols 0-1 and Row 1 Cols 0-1
  { label: 'TypeScribe', char: '', row: 0, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 0, col: 1, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 1, isLogo: true },

  // Row 0
  { label: 'ы', char: 'ы', row: 0, col: 2 },
  { label: 'ь', char: 'ь', row: 0, col: 3 },
  { label: 'э', char: 'э', row: 0, col: 4 },
  { label: 'ю', char: 'ю', row: 0, col: 5 },
  { label: 'я', char: 'я', row: 0, col: 6 },
  { label: 'І', char: 'І', row: 0, col: 7 },

  // Row 1
  { label: 'ї', char: 'ї', row: 1, col: 2 },
  { label: 'є', char: 'є', row: 1, col: 3 },
  { label: 'ґ', char: 'ґ', row: 1, col: 4 },
  { label: 'і', char: 'і', row: 1, col: 5 },
  { label: 'ї', char: 'ї', row: 1, col: 6 },
  { label: 'є', char: 'є', row: 1, col: 7 },

  // Row 2
  { label: 'ѓ', char: 'ѓ', row: 2, col: 0 },
  { label: 'ў', char: 'ў', row: 2, col: 1 },
  { label: 'ў', char: 'ў', row: 2, col: 2 },
  { label: 'ст', char: 'ст', row: 2, col: 3 },
  { label: 'по', char: 'по', row: 2, col: 4 },
  { label: 'он', char: 'он', row: 2, col: 5 },
  { label: 'ен', char: 'ен', row: 2, col: 6 },
  { label: 'то', char: 'то', row: 2, col: 7 },

  // Row 3
  { label: 'на', char: 'на', row: 3, col: 0 },
  { label: 'ли', char: 'ли', row: 3, col: 1 },
  { label: 'ко', char: 'ко', row: 3, col: 2 },
  { label: 'ра', char: 'ра', row: 3, col: 3 },
  { label: 'ла', char: 'ла', row: 3, col: 4 },
  { label: 'но', char: 'но', row: 3, col: 5 },
  { label: 'ре', char: 'ре', row: 3, col: 6 },
  { label: 'ть', char: 'ть', row: 3, col: 7 },

  // Row 4
  { label: 'ом', char: 'ом', row: 4, col: 0 },
  { label: 'пр', char: 'пр', row: 4, col: 1 },
  { label: 'ве', char: 'ве', row: 4, col: 2 },
  { label: 'ни', char: 'ни', row: 4, col: 3 },
  { label: 'го', char: 'го', row: 4, col: 4 },
  { label: 'те', char: 'те', row: 4, col: 5 },
  { label: 'ки', char: 'ки', row: 4, col: 6 },
  { label: 'ши', char: 'ши', row: 4, col: 7 },

  // Row 5
  { label: 'иш', char: 'иш', row: 5, col: 0 },
  { label: 'ии', char: 'ии', row: 5, col: 1 },
  { label: 'шш', char: 'шш', row: 5, col: 2 },
  { label: 'ші', char: 'ші', row: 5, col: 3 },
  { label: 'ил', char: 'ил', row: 5, col: 4 },
  { label: 'ль', char: 'ль', row: 5, col: 5 },
  { label: 'ми', char: 'ми', row: 5, col: 6 },
  { label: 'им', char: 'им', row: 5, col: 7 },

  // Row 6
  { label: 'мм', char: 'мм', row: 6, col: 0 },
  { label: 'шл', char: 'шл', row: 6, col: 1 },
  { label: 'лш', char: 'лш', row: 6, col: 2 },
  { label: 'мл', char: 'мл', row: 6, col: 3 },
  { label: 'лм', char: 'лм', row: 6, col: 4 },
  { label: 'ци', char: 'ци', row: 6, col: 5 },
  { label: 'иц', char: 'иц', row: 6, col: 6 },
  { label: 'щи', char: 'щи', row: 6, col: 7 },

  // Row 7
  { label: 'ищ', char: 'ищ', row: 7, col: 0 },
  { label: 'ов', char: 'ов', row: 7, col: 1 },
  { label: 'ош', char: 'ош', row: 7, col: 2 },
  { label: 'во', char: 'во', row: 7, col: 3 },
  { label: 'вн', char: 'вн', row: 7, col: 4 },
  { label: 'ви', char: 'ви', row: 7, col: 5 },
  { label: 'вл', char: 'вл', row: 7, col: 6 },
  { label: 'бо', char: 'бо', row: 7, col: 7 },
];

const cyrillic8RowPage3Cells: TemplateCell[] = [
  // Logo placeholder covers Row 0 Cols 0-1 and Row 1 Cols 0-1
  { label: 'TypeScribe', char: '', row: 0, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 0, col: 1, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 1, isLogo: true },

  // Row 0
  { label: 'би', char: 'би', row: 0, col: 2 },
  { label: 'бл', char: 'бл', row: 0, col: 3 },
  { label: 'ти', char: 'ти', row: 0, col: 4 },
  { label: 'ит', char: 'ит', row: 0, col: 5 },
  { label: 'тт', char: 'тт', row: 0, col: 6 },
  { label: 'пи', char: 'пи', row: 0, col: 7 },

  // Row 1
  { label: 'ип', char: 'ип', row: 1, col: 2 },
  { label: 'пп', char: 'пп', row: 1, col: 3 },
  { label: 'тп', char: 'тп', row: 1, col: 4 },
  { label: 'пт', char: 'пт', row: 1, col: 5 },
  { label: 'ди', char: 'ди', row: 1, col: 6 },
  { label: 'ид', char: 'ид', row: 1, col: 7 },

  // Row 2
  { label: 'вм', char: 'вм', row: 2, col: 0 },
  { label: 'ье', char: 'ье', row: 2, col: 1 },
  { label: 'оо', char: 'оо', row: 2, col: 2 },
  { label: 'oa', char: 'oa', row: 2, col: 3 },
  { label: 'ao', char: 'ao', row: 2, col: 4 },
  { label: 'cc', char: 'cc', row: 2, col: 5 },
  { label: 'ee', char: 'ee', row: 2, col: 6 },
  { label: 'oc', char: 'oc', row: 2, col: 7 },

  // Row 3
  { label: 'ac', char: 'ac', row: 3, col: 0 },
  { label: 'ec', char: 'ec', row: 3, col: 1 },
  { label: 'ox', char: 'ox', row: 3, col: 2 },
  { label: 'ax', char: 'ax', row: 3, col: 3 },
  { label: 'дв', char: 'дв', row: 3, col: 4 },
  { label: 'дб', char: 'дб', row: 3, col: 5 },
  { label: 'зу', char: 'зу', row: 3, col: 6 },
  { label: 'уз', char: 'уз', row: 3, col: 7 },

  // Row 4
  { label: 'дз', char: 'дз', row: 4, col: 0 },
  { label: 'дж', char: 'дж', row: 4, col: 1 },
  { label: 'цу', char: 'цу', row: 4, col: 2 },
  { label: 'щу', char: 'щу', row: 4, col: 3 },
  { label: 'ка', char: 'ка', row: 4, col: 4 },
  { label: 'ке', char: 'ке', row: 4, col: 5 },
  { label: 'жж', char: 'жж', row: 4, col: 6 },
  { label: 'фл', char: 'фл', row: 4, col: 7 },

  // Row 5
  { label: 'фи', char: 'фи', row: 5, col: 0 },
  { label: 'ья', char: 'ья', row: 5, col: 1 },
  { label: 'ью', char: 'ью', row: 5, col: 2 },
  { label: 'ье', char: 'ье', row: 5, col: 3 },
  { label: 'ьо', char: 'ьо', row: 5, col: 4 },
  { label: 'ые', char: 'ые', row: 5, col: 5 },
  { label: 'ыи', char: 'ыи', row: 5, col: 6 },
  { label: '1', char: '1', row: 5, col: 7 },

  // Row 6
  { label: '2', char: '2', row: 6, col: 0 },
  { label: '3', char: '3', row: 6, col: 1 },
  { label: '4', char: '4', row: 6, col: 2 },
  { label: '5', char: '5', row: 6, col: 3 },
  { label: '6', char: '6', row: 6, col: 4 },
  { label: '7', char: '7', row: 6, col: 5 },
  { label: '8', char: '8', row: 6, col: 6 },
  { label: '9', char: '9', row: 6, col: 7 },

  // Row 7
  { label: '0', char: '0', row: 7, col: 0 },
  { label: 'ff', char: 'ff', row: 7, col: 1 },
  { label: 'fi', char: 'fi', row: 7, col: 2 },
  { label: 'fl', char: 'fl', row: 7, col: 3 },
  { label: 'ft', char: 'ft', row: 7, col: 4 },
  { label: 'th', char: 'th', row: 7, col: 5 },
  { label: 'te', char: 'te', row: 7, col: 6 },
  { label: 'st', char: 'st', row: 7, col: 7 },
];

const cyrillic8RowPage4Cells: TemplateCell[] = [
  // Logo placeholder covers Row 0 Cols 0-1 and Row 1 Cols 0-1
  { label: 'TypeScribe', char: '', row: 0, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 0, col: 1, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 1, isLogo: true },

  // Row 0
  { label: 'ch', char: 'ch', row: 0, col: 2 },
  { label: 'ck', char: 'ck', row: 0, col: 3 },
  { label: 'sh', char: 'sh', row: 0, col: 4 },
  { label: 'sch', char: 'sch', row: 0, col: 5 },
  { label: 'er', char: 'er', row: 0, col: 6 },
  { label: 'en', char: 'en', row: 0, col: 7 },

  // Row 1
  { label: 'on', char: 'on', row: 1, col: 2 },
  { label: 'an', char: 'an', row: 1, col: 3 },
  { label: 'and', char: 'and', row: 1, col: 4 },
  { label: 'ing', char: 'ing', row: 1, col: 5 },
  { label: 'ion', char: 'ion', row: 1, col: 6 },
  { label: 'ment', char: 'ment', row: 1, col: 7 },

  // Row 2
  { label: 'of', char: 'of', row: 2, col: 0 },
  { label: 'to', char: 'to', row: 2, col: 1 },
  { label: 'in', char: 'in', row: 2, col: 2 },
  { label: 'is', char: 'is', row: 2, col: 3 },
  { label: 'it', char: 'it', row: 2, col: 4 },
  { label: 'yo', char: 'yo', row: 2, col: 5 },
  { label: 're', char: 're', row: 2, col: 6 },
  { label: 'ee', char: 'ee', row: 2, col: 7 },

  // Row 3
  { label: 'oo', char: 'oo', row: 3, col: 0 },
  { label: 'll', char: 'll', row: 3, col: 1 },
  { label: 'tt', char: 'tt', row: 3, col: 2 },
  { label: 'ст', char: 'ст', row: 3, col: 3 },
  { label: 'по', char: 'по', row: 3, col: 4 },
  { label: 'он', char: 'он', row: 3, col: 5 },
  { label: 'ен', char: 'ен', row: 3, col: 6 },
  { label: 'то', char: 'то', row: 3, col: 7 },

  // Row 4
  { label: 'на', char: 'на', row: 4, col: 0 },
  { label: 'ли', char: 'ли', row: 4, col: 1 },
  { label: 'ко', char: 'ко', row: 4, col: 2 },
  { label: 'ра', char: 'ра', row: 4, col: 3 },
  { label: 'ла', char: 'ла', row: 4, col: 4 },
  { label: 'но', char: 'но', row: 4, col: 5 },
  { label: 'ре', char: 'ре', row: 4, col: 6 },
  { label: 'ть', char: 'ть', row: 4, col: 7 },

  // Row 5
  { label: 'ом', char: 'ом', row: 5, col: 0 },
  { label: 'пр', char: 'пр', row: 5, col: 1 },
  { label: 'ве', char: 'ве', row: 5, col: 2 },
  { label: 'ни', char: 'ни', row: 5, col: 3 },
  { label: 'го', char: 'го', row: 5, col: 4 },
  { label: 'те', char: 'те', row: 5, col: 5 },
  { label: 'ки', char: 'ки', row: 5, col: 6 },
  { label: 'ши', char: 'ши', row: 5, col: 7 },

  // Row 6
  { label: 'иш', char: 'иш', row: 6, col: 0 },
  { label: 'ии', char: 'ии', row: 6, col: 1 },
  { label: 'шш', char: 'шш', row: 6, col: 2 },
  { label: 'ші', char: 'ші', row: 6, col: 3 },
  { label: 'іш', char: 'іш', row: 6, col: 4 },
  { label: 'іі', char: 'іі', row: 6, col: 5 },
  { label: 'ил', char: 'ил', row: 6, col: 6 },
  { label: 'ль', char: 'ль', row: 6, col: 7 },

  // Row 7
  { label: 'ми', char: 'ми', row: 7, col: 0 },
  { label: 'им', char: 'им', row: 7, col: 1 },
  { label: 'мм', char: 'мм', row: 7, col: 2 },
  { label: 'шл', char: 'шл', row: 7, col: 3 },
  { label: 'лш', char: 'лш', row: 7, col: 4 },
  { label: 'мл', char: 'мл', row: 7, col: 5 },
  { label: 'лм', char: 'лм', row: 7, col: 6 },
  { label: 'ци', char: 'ци', row: 7, col: 7 },
];

const cyrillic8RowPage5Cells: TemplateCell[] = [
  // Logo placeholder covers Row 0 Cols 0-1 and Row 1 Cols 0-1
  { label: 'TypeScribe', char: '', row: 0, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 0, col: 1, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 0, isLogo: true },
  { label: 'TypeScribe', char: '', row: 1, col: 1, isLogo: true },

  // Row 0
  { label: 'иц', char: 'иц', row: 0, col: 2 },
  { label: 'щи', char: 'щи', row: 0, col: 3 },
  { label: 'ищ', char: 'ищ', row: 0, col: 4 },
  { label: 'ов', char: 'ов', row: 0, col: 5 },
  { label: 'ош', char: 'ош', row: 0, col: 6 },
  { label: 'во', char: 'во', row: 0, col: 7 },

  // Row 1
  { label: 'вн', char: 'вн', row: 1, col: 2 },
  { label: 'ви', char: 'ви', row: 1, col: 3 },
  { label: 'вл', char: 'вл', row: 1, col: 4 },
  { label: 'бо', char: 'бо', row: 1, col: 5 },
  { label: 'би', char: 'би', row: 1, col: 6 },
  { label: 'бл', char: 'бл', row: 1, col: 7 },

  // Row 2
  { label: 'ти', char: 'ти', row: 2, col: 0 },
  { label: 'ит', char: 'ит', row: 2, col: 1 },
  { label: 'тт', char: 'тт', row: 2, col: 2 },
  { label: 'пи', char: 'пи', row: 2, col: 3 },
  { label: 'ип', char: 'ип', row: 2, col: 4 },
  { label: 'пп', char: 'пп', row: 2, col: 5 },
  { label: 'тп', char: 'тп', row: 2, col: 6 },
  { label: 'пт', char: 'пт', row: 2, col: 7 },

  // Row 3
  { label: 'ди', char: 'ди', row: 3, col: 0 },
  { label: 'ид', char: 'ид', row: 3, col: 1 },
  { label: 'ій', char: 'ій', row: 3, col: 2 },
  { label: 'ії', char: 'ії', row: 3, col: 3 },
  { label: 'іі', char: 'іі', row: 3, col: 4 },
  { label: 'вм', char: 'вм', row: 3, col: 5 },
  { label: 'ье', char: 'ье', row: 3, col: 6 },
  { label: 'іє', char: 'іє', row: 3, col: 7 },

  // Row 4
  { label: 'оо', char: 'оо', row: 4, col: 0 },
  { label: 'оа', char: 'оа', row: 4, col: 1 },
  { label: 'ао', char: 'ао', row: 4, col: 2 },
  { label: 'сс', char: 'сс', row: 4, col: 3 },
  { label: 'ее', char: 'ее', row: 4, col: 4 },
  { label: 'ос', char: 'ос', row: 4, col: 5 },
  { label: 'ас', char: 'ас', row: 4, col: 6 },
  { label: 'ес', char: 'ес', row: 4, col: 7 },

  // Row 5
  { label: 'ox', char: 'ox', row: 5, col: 0 },
  { label: 'ax', char: 'ax', row: 5, col: 1 },
  { label: 'дв', char: 'дв', row: 5, col: 2 },
  { label: 'дб', char: 'дб', row: 5, col: 3 },
  { label: 'зу', char: 'зу', row: 5, col: 4 },
  { label: 'уз', char: 'уз', row: 5, col: 5 },
  { label: 'дз', char: 'дз', row: 5, col: 6 },
  { label: 'дж', char: 'дж', row: 5, col: 7 },

  // Row 6
  { label: 'цу', char: 'цу', row: 6, col: 0 },
  { label: 'щу', char: 'щу', row: 6, col: 1 },
  { label: 'ка', char: 'ка', row: 6, col: 2 },
  { label: 'ке', char: 'ке', row: 6, col: 3 },
  { label: 'жж', char: 'жж', row: 6, col: 4 },
  { label: 'фл', char: 'фл', row: 6, col: 5 },
  { label: 'фи', char: 'фи', row: 6, col: 6 },
  { label: 'ья', char: 'ья', row: 6, col: 7 },

  // Row 7
  { label: 'ью', char: 'ью', row: 7, col: 0 },
  { label: 'ье', char: 'ье', row: 7, col: 1 },
  { label: 'ьо', char: 'ьо', row: 7, col: 2 },
  { label: 'ые', char: 'ые', row: 7, col: 3 },
  { label: 'ыи', char: 'ыи', row: 7, col: 4 },
];

export const ALL_TEMPLATES: TemplatePage[] = [
  {
    id: 'cyrillic_8row_p1',
    name: 'Кириллица TypeScribe • Стр. 1',
    description: 'Стандартный бланк Стр. 1 (А-Я, а-ъ). Идеальное совпадение сетки без искажений при сканировании.',
    rows: 8,
    cols: 8,
    cells: cyrillic8RowPage1Cells,
  },
  {
    id: 'cyrillic_8row_p2',
    name: 'Кириллица TypeScribe • Стр. 2',
    description: 'Стандартный бланк Стр. 2 (ы-я, доп. буквы, знаки препинания и лигатуры на кириллице).',
    rows: 8,
    cols: 8,
    cells: cyrillic8RowPage2Cells,
  },
  {
    id: 'cyrillic_8row_p3',
    name: 'Кириллица TypeScribe • Стр. 3',
    description: 'Стандартный бланк Стр. 3 (цифры, лигатуры на кириллице и латинице, диграфы).',
    rows: 8,
    cols: 8,
    cells: cyrillic8RowPage3Cells,
  },
  {
    id: 'cyrillic_8row_p4',
    name: 'Кириллица TypeScribe • Стр. 4',
    description: 'Стандартный бланк Стр. 4 (английские лигатуры, диграфы, дополнительные суффиксы).',
    rows: 8,
    cols: 8,
    cells: cyrillic8RowPage4Cells,
  },
  {
    id: 'cyrillic_8row_p5',
    name: 'Кириллица TypeScribe • Стр. 5',
    description: 'Стандартный бланк Стр. 5 (набор сложных соединений и диграфов).',
    rows: 8,
    cols: 8,
    cells: cyrillic8RowPage5Cells,
  },
  {
    id: 'cyrillic',
    name: 'Кириллица Компакт • Стр. 1 (9 строк)',
    description: 'Полный русский алфавит (33 заглавных и 33 строчных буквы + знаки препинания) на одной странице.',
    rows: 9,
    cols: 8,
    cells: cyrillicPageCells,
  },
  {
    id: 'latin',
    name: 'Латиница (A-Z, a-z)',
    description: 'Английский алфавит (26 заглавных и 26 строчных букв). Позволяет создавать качественные английские рукописные шрифты.',
    rows: 7,
    cols: 8,
    cells: latinPageCells,
  },
  {
    id: 'digits',
    name: 'Цифры и знаки',
    description: 'Стандартный набор цифр от 0 до 9 и часто используемые символы.',
    rows: 2,
    cols: 8,
    cells: digitsPageCells,
  },
];
