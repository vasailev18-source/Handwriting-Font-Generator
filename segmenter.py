#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Модуль сегментации символов компьютерного зрения
------------------------------------------------
Автор: Старший инженер по компьютерному зрению (OpenCV / NumPy)
Описание: Двухстадийная интеллектуальная сегментация с динамической адаптацией сетки,
          автоматическим удалением печатных подсказок (Smart Padding) и защитой от обрезания 
          хвостиков/чернильных росчерков (Tail Cutting Protection) по границам ячеек.
"""

import cv2
import numpy as np

# Глобальный кэш для предотвращения многократного перерасчета линий разметки одного и того же бланка
_GRID_LINES_CACHE = {
    "image_id": None,
    "detected_x": None,
    "detected_y": None
}


def segment_character_two_pass(warped_img, row, col, total_rows, total_cols, threshold_val=130):
    """
    Выполняет прецизионную сегментацию рукописного символа из ячейки разграфленного бланка.
    
    1. Динамическая адаптация сетки: Поиск линий таблицы по локальным минимумам яркости.
    2. Умный Padding (Локальный поиск печатной буквы): Группировка пикселей в компоненты 
       и удаление изолированных шрифтовых знаков-подсказаок в верхней трети ячейки.
    3. Защита от обрезания хвостиков: Маркировка связных областей и динамическое расширение
       безопасной зоны для сохранения длинных штрихов букв (д, у, б, и др.), выходящих за границы.
       
    Параметры:
    -----------
    warped_img : numpy.ndarray
        Выровненное/устраненное от перекосов изображение бланка (одноканальное серое или BGR).
    row : int
        0-индекс строки ячейки.
    col : int
        0-индекс столбца ячейки.
    total_rows : int
        Общее количество строк в таблице шаблона (например, 8).
    total_cols : int
        Общее количество столбцов в таблице шаблона (например, 8).
    threshold_val : int, optional
        Порог бинаризации темных чернил на светлом фоне (по умолчанию 130).
        
    Возвращает:
    --------
    numpy.ndarray или None:
        Очищенный, прецизионно кадрированный фрагмент изображения ячейки, содержащий
        ТОЛЬКО рукописный символ, либо None для абсолютно пустых ячеек.
    """
    global _GRID_LINES_CACHE
    
    if warped_img is None or warped_img.size == 0:
        return None
        
    h_img, w_img = warped_img.shape[:2]
    
    # ==========================================
    # СТАДИЯ 1: ДИНАМИЧЕСКАЯ АДАПТАЦИЯ СЕТКИ (ADAPTIVE GRID)
    # ==========================================
    
    # Если передан новый холст, выполняем прецизионный поиск физических линий сетки
    if _GRID_LINES_CACHE["image_id"] is not warped_img:
        # Приведение к оттенкам серого для одномерных проекций яркости
        if len(warped_img.shape) == 3:
            gray_full = cv2.cvtColor(warped_img, cv2.COLOR_BGR2GRAY)
        else:
            gray_full = warped_img.copy()
            
        # Настройка шагов статической разметки по умолчанию
        cell_w_est = w_img / total_cols
        cell_h_est = h_img / total_rows
        
        # 1. Поиск горизонтальных линий (центральный вертикальный коридор шириной 200px)
        detected_y = [0] * (total_rows + 1)
        detected_y[total_rows] = h_img
        
        try:
            strip_w = 200
            x_start_strip = int((w_img - strip_w) / 2)
            strip_y_data = gray_full[:, x_start_strip : x_start_strip + strip_w]
            
            for r in range(1, total_rows):
                expected_y = int(r * cell_h_est)
                search_window = int(cell_h_est * 0.09)  # Окно поиска погрешности ±9%
                y_start = max(0, expected_y - search_window)
                y_end = min(h_img - 1, expected_y + search_window)
                
                # Поиск самого темного горизонтального среза
                row_intensities = np.mean(strip_y_data[y_start : y_end + 1, :], axis=1)
                best_offset = np.argmin(row_intensities)
                detected_y[r] = y_start + best_offset
        except Exception:
            # При сбое — мягкий откат к статической равномерной сетке
            for r in range(1, total_rows):
                detected_y[r] = int(r * cell_h_est)
                
        # 2. Поиск вертикальных линий (центральный горизонтальный коридор высотой 200px)
        detected_x = [0] * (total_cols + 1)
        detected_x[total_cols] = w_img
        
        try:
            strip_h = 200
            y_start_strip = int((h_img - strip_h) / 2)
            strip_x_data = gray_full[y_start_strip : y_start_strip + strip_h, :]
            
            for c in range(1, total_cols):
                expected_x = int(c * cell_w_est)
                search_window = int(cell_w_est * 0.09)  # Окно поиска погрешности ±9%
                x_start = max(0, expected_x - search_window)
                x_end = min(w_img - 1, expected_x + search_window)
                
                # Поиск самого темного вертикального среза
                col_intensities = np.mean(strip_x_data[:, x_start : x_end + 1], axis=0)
                best_offset = np.argmin(col_intensities)
                detected_x[c] = x_start + best_offset
        except Exception:
            # Откат к статической сетке при ошибке чтения
            for c in range(1, total_cols):
                detected_x[c] = int(c * cell_w_est)
                
        # Обновление глобального кэша линий разметки
        _GRID_LINES_CACHE["image_id"] = warped_img
        _GRID_LINES_CACHE["detected_x"] = detected_x
        _GRID_LINES_CACHE["detected_y"] = detected_y
        
    # Извлечение точных физических границ ячейки из кэша
    detected_x = _GRID_LINES_CACHE["detected_x"]
    detected_y = _GRID_LINES_CACHE["detected_y"]
    
    x_start = detected_x[col]
    y_start = detected_y[row]
    x_end = detected_x[col + 1]
    y_end = detected_y[row + 1]
    
    # Кадрирование адаптированной ячейки бланка
    cell_img = warped_img[y_start:y_end, x_start:x_end]
    if cell_img.size == 0:
        return None
        
    cH, cW = cell_img.shape[:2]
    
    # ==========================================
    # СТАДИЯ 2: ПОИСК СВЯЗНЫХ КОМПОНЕНТ (SMART PROCESSING)
    # ==========================================
    
    # Перевод локального фрагмента в оттенки серого
    if len(cell_img.shape) == 3:
        gray = cv2.cvtColor(cell_img, cv2.COLOR_BGR2GRAY)
    else:
        gray = cell_img.copy()
        
    # Инверсная бинаризация: чернила становятся 255 (белыми), бумага — 0 (черной)
    _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY_INV)
    
    # Поиск связных областей через алгоритм маркировки компонент OpenCV
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh)
    
    # Расчет координат динамической безопасной зоны черчения внутри нашей ячейки
    # Печатная подсказка лежит в верхних 22% (Smart Padding фильтрует её как отдельную компоненту)
    safe_min_x = int(cW * 0.11)
    safe_max_x = int(cW * 0.89)
    safe_min_y = int(cH * 0.22)
    safe_max_y = int(cH * 0.90)
    
    # Пустая маска результатов
    clean_glyph_mask = np.zeros_like(thresh)
    
    for i in range(1, num_labels):
        comp_x = stats[i, cv2.CC_STAT_LEFT]
        comp_y = stats[i, cv2.CC_STAT_TOP]
        comp_w = stats[i, cv2.CC_STAT_WIDTH]
        comp_h = stats[i, cv2.CC_STAT_HEIGHT]
        comp_area = stats[i, cv2.CC_STAT_AREA]
        
        # Фильтрация остатков просочившихся разделительных линий таблицы
        is_horiz_border = comp_w > cW * 0.94 and comp_h < cH * 0.10
        is_vert_border = comp_h > cH * 0.94 and comp_w < cW * 0.10
        is_border_line = is_horiz_border or is_vert_border
        
        # Фильтрация непредвиденных внешних рамок
        is_leaked_frame = comp_w > cW * 0.97 or comp_h > cH * 0.97
        
        # Проверка пересечения геометрических границ компоненты с Безопасной Зоной черчения
        overlap_x = comp_x <= safe_max_x and (comp_x + comp_w) >= safe_min_x
        overlap_y = comp_y <= safe_max_y and (comp_y + comp_h) >= safe_min_y
        intersects_writing_zone = overlap_x and overlap_y
        
        # Удаление спеклов и шума датчиков (менее 4 пикселей активности)
        is_noise = comp_area < 4
        
        # Если область принадлежит рукописному вводу (пересекает центр и не является шумом/рамой) -
        # мы сохраняем её ЦЕЛИКОМ, включая любые части за пределами безопасной зоны!
        # Это предотвращает обрезание свисающих нижних или верхних элементов рукописных букв.
        if intersects_writing_zone and not is_border_line and not is_leaked_frame and not is_noise:
            clean_glyph_mask[labels == i] = 255
            
    # Локализация точного пиксельного контура очищенных от шумов результатов
    active_ink_coords = np.argwhere(clean_glyph_mask > 0)
    if len(active_ink_coords) == 0:
        return None
        
    y_min, x_min = active_ink_coords.min(axis=0)
    y_max, x_max = active_ink_coords.max(axis=0)
    
    # Добавление сглаживающего защитного зазора в -1/+1 пиксель по краям с валидацией границ ячейки
    crop_top = max(0, y_min - 1)
    crop_bottom = min(cH - 1, y_max + 1)
    crop_left = max(0, x_min - 1)
    crop_right = min(cW - 1, x_max + 1)
    
    if crop_top >= crop_bottom or crop_left >= crop_right:
        return None
        
    # Прецизионное кадрирование фрагмента оригинала с оттенками серого (сохраняя сглаживание)
    final_segmented_glyph = cell_img[crop_top : crop_bottom + 1, crop_left : crop_right + 1]
    
    return final_segmented_glyph


if __name__ == "__main__":
    # Скрипт верификации / проверка работоспособности
    print("[INIT] Высокопроизводительный модуль OpenCV сегментации запущен.")
    
    # Генерация симуляционного листа разметки
    test_canvas = np.ones((1200, 1200), dtype=np.uint8) * 255
    
    # Отрисовка темных горизонтальных и вертикальных линий разметки таблицы
    cv2.line(test_canvas, (0, 600), (1200, 600), 100, 4)     # Горизонтальная линия
    cv2.line(test_canvas, (600, 0), (600, 1200), 100, 4)     # Вертикальная линия
    
    # Имитируем напечатанную букву-подсказку в левом верхнем углу (шум)
    cv2.putText(test_canvas, "A", (80, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.2, 50, 3)
    
    # Имитируем рукописный символ "Б" с длинным хвостиком, заходящим на границы (целевой ввод)
    cv2.circle(test_canvas, (320, 350), 45, 0, -1)          # Округлость
    cv2.line(test_canvas, (320, 305), (320, 180), 0, 12)    # Палочка вверх
    cv2.line(test_canvas, (320, 180), (410, 180), 0, 12)    # Козырек вправо, выходящий высоко в верхнюю треть ячейки
    
    # Тест двухстадийного компьютерного зрения
    print("[TEST] Запуск сегментации ячейки Row=0, Col=0...")
    res = segment_character_two_pass(test_canvas, row=0, col=0, total_rows=2, total_cols=2)
    
    if res is not None:
        print(f"[SUCCESS] Рукописный символ успешно сегментирован! Размеры фрагмента: {res.shape[1]}x{res.shape[0]} px")
    else:
        print("[FAIL] Ошибка выделения рукописной буквы.")
