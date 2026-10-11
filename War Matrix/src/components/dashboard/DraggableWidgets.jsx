import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { GripVertical, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function DraggableWidgets({ widgets, widgetOrder, enabledWidgets, onReorder, editMode }) {
  const [orderedWidgets, setOrderedWidgets] = useState([]);

  useEffect(() => {
    // Filter widgets based on enabled list, then order by widgetOrder
    const filtered = widgets.filter(w => enabledWidgets.includes(w.id));
    
    // Sort by widgetOrder if available
    if (widgetOrder && widgetOrder.length > 0) {
      filtered.sort((a, b) => {
        const indexA = widgetOrder.indexOf(a.id);
        const indexB = widgetOrder.indexOf(b.id);
        // Put items not in order at the end
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    
    setOrderedWidgets(filtered);
  }, [widgets, enabledWidgets, widgetOrder]);

  const handleDragEnd = (result) => {
    if (!result.destination || !editMode) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(orderedWidgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedWidgets(items);
    onReorder(items.map(w => w.id));
  };

  if (!editMode) {
    return (
      <div className="space-y-6">
        {orderedWidgets.map((widget) => (
          <div key={widget.id}>
            {widget.component}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-widgets">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-6"
          >
            {orderedWidgets.map((widget, index) => (
              <Draggable key={widget.id} draggableId={widget.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`relative ${snapshot.isDragging ? 'z-50' : ''}`}
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="absolute top-2 left-2 z-10 cursor-move"
                    >
                      <div className="bg-cyan-500/20 border border-cyan-500/50 rounded p-2 hover:bg-cyan-500/30 transition-colors">
                        <GripVertical className="w-5 h-5 text-cyan-400" />
                      </div>
                    </div>
                    <div className={snapshot.isDragging ? 'opacity-70' : ''}>
                      {widget.component}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {orderedWidgets.length === 0 && (
              <Card className="bg-slate-950/80 backdrop-blur-xl cyber-border p-12 text-center">
                <Settings className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-mono mb-2">No widgets enabled</p>
                <p className="text-slate-500 font-mono text-sm mb-4">
                  Enable widgets from your profile settings
                </p>
                <Link to={createPageUrl('UserProfile')}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono">
                    GO TO SETTINGS
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}