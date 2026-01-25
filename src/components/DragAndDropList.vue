<template>
    <div
      class="drag-and-drop-list"
      @dragover.prevent
      @dragenter.prevent
      @drop.prevent="onDrop"
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
        @touchend="touchEnd"
        @click="handleItemClick(getItemId(item), $event)"
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
  }
  
  const props = withDefaults(defineProps<Props>(), {
    itemIdGetter: (item: any) => item.id || item.toString(),
    itemKeyGetter: (item: any, index: number) => index,
    enableMobileDrag: true,
    longPressThreshold: 500, // мс
    touchMoveThreshold: 10,  // пикселей
    showDropIndicators: true,
    allowReplace: true
  })
  
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
  let touchTimeout: ReturnType<typeof setTimeout> | null = null
  
  const getItemId = (item: any): string => {
    return props.itemIdGetter(item)
  }
  
  const getItemKey = (item: any, index: number): string | number => {
    return props.itemKeyGetter(item, index)
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
      // Сброс, если цель не найдена
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
    e.preventDefault()
    
    const touch = e.touches[0]
    touchStartTime.value = Date.now()
    touchStartY.value = touch.clientY
    touchStartX.value = touch.clientX
    
    // Начинаем отсчет долгого нажатия
    if (props.enableMobileDrag) {
      touchTimeout = setTimeout(() => {
        isMobileDragActive.value = true
        draggingId.value = id
      }, props.longPressThreshold)
    }
  }
  
  function touchMove(e: TouchEvent) {
    if (!props.enableMobileDrag) return
    
    if (!isMobileDragActive.value && touchTimeout) {
      const touch = e.touches[0]
      const deltaY = Math.abs(touch.clientY - touchStartY.value)
      const deltaX = Math.abs(touch.clientX - touchStartX.value)
      
      // Если пользователь начал скроллить, отменяем долгое нажатие
      if (deltaY > props.touchMoveThreshold || deltaX > props.touchMoveThreshold) {
        clearTimeout(touchTimeout)
        touchTimeout = null
      }
      return
    }
    
    if (!isMobileDragActive.value || !draggingId.value) return
    
    e.preventDefault()
    
    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const targetItem = element?.closest('.draggable-item')
    
    // Сбрасываем все drag-over классы
    document.querySelectorAll('.draggable-item').forEach(el => {
      el.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-same')
    })
    
    if (targetItem) {
      const targetId = targetItem.getAttribute('data-item-id')
      if (targetId) {
        const targetRect = targetItem.getBoundingClientRect()
        const relativeY = touch.clientY - targetRect.top
        const heightThird = targetRect.height / 3
        
        isDragOver.value = true
        dragOverTargetId.value = targetId
        
        // Определяем позицию относительно элемента
        if (props.allowReplace && relativeY > heightThird && relativeY < heightThird * 2) {
          // Центральная треть - замещение
          dragPosition.value = 'same'
        } else if (relativeY <= heightThird) {
          // Верхняя треть - перед элементом
          dragPosition.value = 'before'
        } else {
          // Нижняя треть - после элемента
          dragPosition.value = 'after'
        }
      } else {
        isDragOver.value = false
        dragOverTargetId.value = null
        dragPosition.value = null
      }
    } else {
      // Проверяем, находимся ли мы в конце списка
      const listElement = document.querySelector('.drag-and-drop-list')
      if (listElement) {
        const listRect = listElement.getBoundingClientRect()
        if (touch.clientY > listRect.bottom - 50) {
          isDragOver.value = true
          dragOverTargetId.value = null
          dragPosition.value = 'end'
        } else {
          isDragOver.value = false
          dragOverTargetId.value = null
          dragPosition.value = null
        }
      } else {
        isDragOver.value = false
        dragOverTargetId.value = null
        dragPosition.value = null
      }
    }
  }
  
  function touchEnd() {
    // Очищаем таймер долгого нажатия
    if (touchTimeout) {
      clearTimeout(touchTimeout)
      touchTimeout = null
    }
    
    // Если перетаскивание активно и есть цель для создания пары
    if (isMobileDragActive.value && draggingId.value && dragOverTargetId.value) {
      emit('item-drop', draggingId.value, dragOverTargetId.value)
    }
    
    resetDragState()
  }
  
  function handleItemClick(id: string, event: MouseEvent) {
    if (isMobileDragActive.value) {
      // Если активно перетаскивание, не генерируем клик
      event.preventDefault()
      event.stopPropagation()
      return
    }
    
    emit('item-click', id)
  }
  
  function resetDragState() {
    isMobileDragActive.value = false
    draggingId.value = null
    isDragOver.value = false
    dragOverTargetId.value = null
    dragPosition.value = null
    
    // Убираем все drag-over классы
    document.querySelectorAll('.draggable-item').forEach(el => {
      el.classList.remove('drag-over-before', 'drag-over-after', 'drag-over-same')
    })
  }
  
  onUnmounted(() => {
    if (touchTimeout) {
      clearTimeout(touchTimeout)
    }
  })
  </script>
  
  <style scoped>
  .drag-and-drop-list {
    position: relative;
    min-height: 100px;
  }
  
  .draggable-item {
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    transition: all 0.2s;
    position: relative;
  }
  
  .draggable-item.dragging {
    opacity: 0.6;
    transform: scale(0.95);
    z-index: 10;
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
  </style>