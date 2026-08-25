import { memo, useState, useCallback } from 'react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

function SortableWidget({ id, children }) {
  const { dark } = useTheme()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} className={clsx('relative group', isDragging && 'scale-[1.01]')}>
      <button {...attributes} {...listeners} className={clsx(
        'absolute top-2 right-2 z-10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
        dark ? 'bg-[#252837] text-[#5a6180] hover:text-[#a0a8c8]' : 'bg-gray-100 text-gray-400 hover:text-gray-600'
      )} aria-label="Drag to reorder">
        <GripVertical size={14} />
      </button>
      {children}
    </div>
  )
}

export default memo(function DragDropDashboard({ widgets, onReorder, children }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = widgets.indexOf(active.id)
    const newIndex = widgets.indexOf(over.id)
    onReorder(arrayMove(widgets, oldIndex, newIndex))
  }, [widgets, onReorder])

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {widgets.map(id => (
            <SortableWidget key={id} id={id}>
              {children(id)}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
})
