<template>
  <div
    class="drag-and-drop-list"
    ref="listElement"
    @dragover.prevent
    @dragenter.prevent
    @drop.prevent="onDrop"
    @contextmenu.prevent
  >
    <div
      v-for="(item, index) in items"
      :key="getItemKey(item, index)"
      class="draggable-item"
      :class="{
        'dragging': draggingId === getItemId(item),
        'drag-over-before': isDragOver && dragOverTargetId === getItemId(item) && dragPosition === 'before',
        'drag-over-after': isDragOver && dragOverTargetId === getItemId(item) && dragPosition === 'after',
        'drag-over-same': isDragOver && dragOverTargetId === getItemId(item) && dragPosition === 'same'
      }"
      draggable="true"
      :data-item-id="getItemId(item)"
      @dragstart="dragStart(getItemId(item))"
      @dragend="dragEnd"
      @touchstart="touchStart(getItemId(item), $event)"
      @touchmove="touchMove($event)"
      @touchend="touchEnd($event)"
      @touchcancel="touchCancel($event)"
      @click="handleItemClick(getItemId(item), $event)"
      @mousedown.prevent="handleMouseDown($event)"
    >
      <!-- Верхняя линия-индикатор -->
      <div v-if="isDragOver && dragOverTargetId === getItemId(item) && dragPosition === 'before'" 
           class="drop-indicator drop-indicator-top"></div>
      
      <slot :item="item" :index="index" :isDragging="isMobileDragActive">
        {{ item }}
      </slot>
      
      <!-- Нижняя линия-индикатор -->
      <div v-if="isDragOver && dragOverTargetId === getItemId(item) && dragPosition === 'after'" 
           class="drop-indicator drop-indicator-bottom"></div>
      
      <!-- Индикатор замещения -->
      <div v-if="isDragOver && dragOverTargetId === getItemId(item) && dragPosition === 'same'" 
           class="drop-indicator drop-indicator-same"></div>
    </div>
    
    <!-- Индикатор в конце списка -->
    <div v-if="isDragOver && dragPosition === 'end'" 
         class="drop-indicator drop-indicator-end"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const emit = defineEmits<{
  'item-drop': [dragId: string, dropId: string]
  'item-click': [id: string]
}>()

interface Props {
  items: any[]
  itemIdGetter?: (item: any) => string
  itemKeyGetter?: (item: any, index: number) => string | number
  enableMobileDrag?: boolean
  longPressThreshold?: number
  touchMoveThreshold?: number
  showDropIndicators?: boolean
  allowReplace?: boolean
  scrollDuringDrag?: boolean // Новая опция - разрешить скролл во время перетаскивания
}

const props = withDefaults(defineProps<Props>(), {
  itemIdGetter: (item: any) => item.id || item.toString(),
  itemKeyGetter: (item: any, index: number) => index,
  enableMobileDrag: true,
  longPressThreshold: 400,
  touchMoveThreshold: 8,   // Немного увеличил для лучшего различения скролла и начала драга
  showDropIndicators: true,
  allowReplace: true,
  scrollDuringDrag: true   // По умолчанию разрешаем скролл
})

// Refs
const listElement = ref<HTMLElement | null>(null)

// Drag & Drop состояния
const draggingId = ref<string | null>(null)
const isDragOver = ref<boolean>(false)
const dragOverTargetId = ref<string | null>(null)
const dragPosition = ref<'before' | 'after' | 'same' | 'end' | null>(null)

// Mobile drag состояния
const isMobileDragActive = ref<boolean>(false)
const touchStartTime = ref<number>(0)
const touchStartY = ref<number>(0)
const touchStartX = ref<number>(0)
const lastTouchId = ref<string | null>(null)
const hasMoved = ref<boolean>(false)
const isScrolling = ref<boolean>(false)
let touchTimeout: ReturnType<typeof setTimeout> | null = null
let scrollInterval: ReturnType<typeof setInterval> | null = null
let preventClick = ref<boolean>(false)

const getItemId = (item: any): string => {
  return props.itemIdGetter(item)
}

const getItemKey = (item: any, index: number): string | number => {
  return props.itemKeyGetter(item, index)
}

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
}

function dragStart(id: string) {
  draggingId.value = id
}

function dragEnd() {
  resetDragState()
}

function onDrop(e: DragEvent) {
  if (!draggingId.value) return

  const targetElement = e.target as HTMLElement
  const targetItem = targetElement.closest('.draggable-item')
  
  if (!targetItem) {
    resetDragState()
    return
  }

  const targetId = targetItem.getAttribute('data-item-id')
  if (targetId && targetId !== draggingId.value) {
    emit('item-drop', draggingId.value, targetId)
  }
  
  resetDragState()
}

function touchStart(id: string, e: TouchEvent) {
  if (!props.enableMobileDrag) return
  
  // Сбрасываем состояние скролла
  isScrolling.value = false
  
  // Запоминаем начальные параметры
  lastTouchId.value = id
  touchStartTime.value = Date.now()
  touchStartY.value = e.touches[0].clientY
  touchStartX.value = e.touches[0].clientX
  hasMoved.value = false
  preventClick.value = false
  
  // НЕ ПРЕДОТВРАЩАЕМ стандартное поведение здесь - это важно для скролла!
  // e.preventDefault() - УБРАНО!
  
  // Стартуем таймер для долгого нажатия
  touchTimeout = setTimeout(() => {
    // Активируем перетаскивание после долгого нажатия
    if (!hasMoved.value && !isMobileDragActive.value && !isScrolling.value) {
      startDrag(id, e)
    }
  }, props.longPressThreshold)
}

function startDrag(id: string, e?: TouchEvent) {
  if (e && e.cancelable) {
    e.preventDefault() // Только теперь предотвращаем, когда точно начинаем драг
  }
  
  isMobileDragActive.value = true
  draggingId.value = id
  preventClick.value = true
  
  // Принудительно предотвращаем выделение
  disableTextSelection(true)
  
  // Запускаем автоматический скролл если нужно
  if (props.scrollDuringDrag) {
    startAutoScroll()
  }
}

function disableTextSelection(disable: boolean) {
  if (disable) {
    document.body.classList.add('no-selection')
  } else {
    document.body.classList.remove('no-selection')
  }
}

function touchMove(e: TouchEvent) {
  if (!props.enableMobileDrag) return
  const touch = e.touches[0]
  const currentY = touch.clientY
  const currentX = touch.clientX
  
  // Проверяем движение пальца
  const deltaY = Math.abs(currentY - touchStartY.value)
  const deltaX = Math.abs(currentX - touchStartX.value)
  
  // Если палец сдвинулся достаточно
  if (deltaY > props.touchMoveThreshold || deltaX > props.touchMoveThreshold) {
    hasMoved.value = true
    
    // Определяем, скроллим ли мы (вертикальное движение преобладает)
    const isVerticalScroll = deltaY > deltaX * 1.5
    
    // Если это похоже на скролл и перетаскивание еще не активно
    if (isVerticalScroll && !isMobileDragActive.value) {
      isScrolling.value = true
      
      // Отменяем таймер долгого нажатия если скроллим
      if (touchTimeout) {
        clearTimeout(touchTimeout)
        touchTimeout = null
      }
      return // Позволяем скроллить
    }
    
    // Если перетаскивание еще не активно, отменяем таймер долгого нажатия
    if (touchTimeout && !isMobileDragActive.value) {
      clearTimeout(touchTimeout)
      touchTimeout = null
    }
    
    // Если уже начали перетаскивание
    if (isMobileDragActive.value) {
      // Предотвращаем скролл при активном перетаскивании
      if (e.cancelable) {
        e.preventDefault()
      }
      updateDragPosition(currentX, currentY)
    } 
    // Или если сдвинулись достаточно для активации драга (горизонтальное движение или небольшое)
    else if (!isScrolling.value && (deltaX > deltaY || deltaY < 30)) {
      startDrag(lastTouchId.value!, e)
    }
  }
}

function startAutoScroll() {
  if (!props.scrollDuringDrag) return
  
  stopAutoScroll() // Останавливаем предыдущий интервал
  
  scrollInterval = setInterval(() => {
    if (!isMobileDragActive.value || !listElement.value) {
      stopAutoScroll()
      return
    }
    
    const element = document.elementFromPoint(touchStartX.value, touchStartY.value)
    if (!element) return
    
    const listRect = listElement.value.getBoundingClientRect()
    const touchY = touchStartY.value // Используем последнюю позицию
    
    // Автоматический скролл при приближении к границам
    const scrollMargin = 80
    const scrollSpeed = 10
    
    if (touchY < listRect.top + scrollMargin) {
      // Скроллим вверх
      listElement.value.scrollTop -= scrollSpeed
      touchStartY.value -= scrollSpeed // Корректируем позицию для визуальной обратной связи
    } else if (touchY > listRect.bottom - scrollMargin) {
      // Скроллим вниз
      listElement.value.scrollTop += scrollSpeed
      touchStartY.value += scrollSpeed // Корректируем позицию
    }
  }, 50)
}

function stopAutoScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
}

function updateDragPosition(clientX: number, clientY: number) {
  const element = document.elementFromPoint(clientX, clientY)
  const targetItem = element?.closest('.draggable-item')
  
  // Сбрасываем все drag-over классы
  document.querySelectorAll('.draggable-item').forEach(el => {
    el.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-same')
  })
  
  if (targetItem) {
    const targetId = targetItem.getAttribute('data-item-id')
    if (targetId) {
      const targetRect = targetItem.getBoundingClientRect()
      const relativeY = clientY - targetRect.top
      const heightThird = targetRect.height / 3
      
      isDragOver.value = true
      dragOverTargetId.value = targetId
      
      if (props.allowReplace && relativeY > heightThird && relativeY < heightThird * 2) {
        dragPosition.value = 'same'
      } else if (relativeY <= heightThird) {
        dragPosition.value = 'before'
      } else {
        dragPosition.value = 'after'
      }
    } else {
      resetDragOver()
    }
  } else {
    checkEndOfList(clientY)
  }
}

function checkEndOfList(clientY: number) {
  if (!listElement.value) {
    resetDragOver()
    return
  }
  
  const listRect = listElement.value.getBoundingClientRect()
  if (clientY > listRect.bottom - 50) {
    isDragOver.value = true
    dragOverTargetId.value = null
    dragPosition.value = 'end'
  } else {
    resetDragOver()
  }
}

function resetDragOver() {
  isDragOver.value = false
  dragOverTargetId.value = null
  dragPosition.value = null
}

function touchEnd(e: TouchEvent) {
  // Очищаем таймер
  if (touchTimeout) {
    clearTimeout(touchTimeout)
    touchTimeout = null
  }
  
  // Останавливаем автокскролл
  stopAutoScroll()
  
  // Восстанавливаем выделение текста
  disableTextSelection(false)
  
  const touchDuration = Date.now() - touchStartTime.value
  
  // Если это было перетаскивание
  if (isMobileDragActive.value && draggingId.value) {
    // Если была цель для дропа
    if (dragOverTargetId.value && dragOverTargetId.value !== draggingId.value) {
      emit('item-drop', draggingId.value, dragOverTargetId.value)
    }
    resetDragState()
    return
  }
  
  // Если это был короткий тап без движения (клик)
  if (touchDuration < props.longPressThreshold && !hasMoved.value && !preventClick.value && !isScrolling.value && lastTouchId.value) {
    // Задержка для предотвращения случайных кликов при скролле
    setTimeout(() => {
      if (!hasMoved.value && !isScrolling.value) {
        emit('item-click', lastTouchId.value)
      }
    }, 100)
  }
  
  resetDragState()
}

function touchCancel(e: TouchEvent) {
  // Очищаем таймер
  if (touchTimeout) {
    clearTimeout(touchTimeout)
    touchTimeout = null
  }
  
  // Останавливаем автокскролл
  stopAutoScroll()
  
  // Восстанавливаем выделение текста
  disableTextSelection(false)
  
  resetDragState()
}

function handleItemClick(id: string, event: MouseEvent) {
  // Для десктопных кликов
  if (!isMobileDragActive.value && !preventClick.value) {
    emit('item-click', id)
  }
}

function resetDragState() {
  isMobileDragActive.value = false
  draggingId.value = null
  isDragOver.value = false
  dragOverTargetId.value = null
  dragPosition.value = null
  lastTouchId.value = null
  hasMoved.value = false
  isScrolling.value = false
  preventClick.value = false
  
  // Останавливаем автокскролл
  stopAutoScroll()
  
  // Убираем все drag-over классы
  document.querySelectorAll('.draggable-item').forEach(el => {
    el.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-same')
  })
}

onUnmounted(() => {
  if (touchTimeout) {
    clearTimeout(touchTimeout)
  }
  stopAutoScroll()
  disableTextSelection(false)
})
</script>

<style scoped>
.drag-and-drop-list {
  position: relative;
  min-height: 100px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  -webkit-touch-callout: none;
  user-select: none;
}

.draggable-item {
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  transition: all 0.2s;
  position: relative;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
  tap-highlight-color: transparent;
}

.draggable-item.dragging {
  opacity: 0.6;
  transform: scale(0.95);
  z-index: 10;
  touch-action: none;
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

.draggable-item.drag-over-before {
  border-top: 2px solid #d68900;
}

.draggable-item.drag-over-after {
  border-bottom: 2px solid #d68900;
}

.draggable-item.drag-over-same {
  background-color: rgba(214, 137, 0, 0.15);
  box-shadow: inset 0 0 0 2px #d68900;
}

.drop-indicator {
  position: absolute;
  background-color: #d68900;
  z-index: 20;
}

.drop-indicator-top {
  top: -2px;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 2px;
}

.drop-indicator-bottom {
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 2px;
}

.drop-indicator-same {
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 4px;
  pointer-events: none;
}

.drop-indicator-end {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #d68900;
  border-radius: 2px;
}

/* Для лучшей видимости на мобильных */
@media (max-width: 768px) {
  .draggable-item.drag-over-before {
    border-top: 3px solid #d68900;
  }
  
  .draggable-item.drag-over-after {
    border-bottom: 3px solid #d68900;
  }
  
  .drop-indicator {
    height: 4px;
  }
}

/* Стили для лучшего UX при перетаскивании */
@media (hover: none) and (pointer: coarse) {
  .drag-and-drop-list {
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
  }
}
</style>

<style>
/* Глобальные стили для предотвращения выделения */
.no-selection {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}

.no-selection * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
}
</style>