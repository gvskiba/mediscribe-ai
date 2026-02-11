import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, GripVertical, Check } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function StructuredListEditor({ items = [], onSave, placeholder = "Add item..." }) {
  const [editing, setEditing] = useState(false);
  const [listItems, setListItems] = useState(
    Array.isArray(items) && items.length > 0 
      ? items 
      : typeof items === 'string' && items.trim()
        ? items.split('\n').filter(line => line.trim()).map(line => line.replace(/^[•\-*]\s*/, ''))
        : []
  );
  const [newItem, setNewItem] = useState("");

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    setListItems([...listItems, newItem.trim()]);
    setNewItem("");
  };

  const handleRemoveItem = (index) => {
    setListItems(listItems.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(listItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setListItems(items);
  };

  const handleSave = () => {
    const formattedText = listItems.map(item => `• ${item}`).join('\n');
    onSave(formattedText);
    setEditing(false);
  };

  const handleCancel = () => {
    setListItems(
      Array.isArray(items) && items.length > 0 
        ? items 
        : typeof items === 'string' && items.trim()
          ? items.split('\n').filter(line => line.trim()).map(line => line.replace(/^[•\-*]\s*/, ''))
          : []
    );
    setNewItem("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <div>
        {listItems.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setEditing(true)}
          className="h-8 text-xs"
        >
          {listItems.length > 0 ? "Edit List" : "Create Structured List"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="list-items">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {listItems.map((item, index) => (
                <Draggable key={index} draggableId={`item-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-2 p-2 bg-white rounded-lg border ${
                        snapshot.isDragging ? 'border-blue-400 shadow-lg' : 'border-slate-200'
                      }`}
                    >
                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-blue-600">•</span>
                      <span className="flex-1 text-sm text-slate-700">{item}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder={placeholder}
          className="flex-1 h-9 text-sm"
        />
        <Button size="sm" onClick={handleAddItem} className="h-9 px-3">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} className="gap-1.5">
          <Check className="w-3.5 h-3.5" />
          Save List
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}