
import React, { useState } from 'react';
import { Tag } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getContrastColor } from '../utils/colorUtils';

interface TagDropzoneProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

const TagDropzone: React.FC<TagDropzoneProps> = ({
  availableTags,
  selectedTagIds,
  onTagsChange
}) => {
  const [dragOver, setDragOver] = useState(false);

  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));
  const unselectedTags = availableTags.filter(tag => !selectedTagIds.includes(tag.id));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const tagId = e.dataTransfer.getData('text/plain');
    if (tagId && !selectedTagIds.includes(tagId)) {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleTagDragStart = (e: React.DragEvent, tagId: string) => {
    e.dataTransfer.setData('text/plain', tagId);
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  const addTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-4 min-h-24 transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50/10' : 'border-slate-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-sm text-slate-400 mb-2">Selected tags (drag tags here):</div>
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag.id}
              style={{ 
                backgroundColor: tag.color,
                color: getContrastColor(tag.color)
              }}
              className="font-medium whitespace-normal break-words cursor-pointer"
            >
              <span className="break-words">{tag.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-1 p-0 h-4 w-4 hover:bg-white/20"
                onClick={() => removeTag(tag.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
          {selectedTags.length === 0 && (
            <span className="text-slate-500 text-sm">Drop tags here or click from available tags below</span>
          )}
        </div>
      </div>

      <div>
        <div className="text-sm text-slate-400 mb-2">Available tags:</div>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {unselectedTags.map(tag => (
            <Badge
              key={tag.id}
              style={{ 
                backgroundColor: tag.color,
                color: getContrastColor(tag.color)
              }}
              className="font-medium whitespace-normal break-words cursor-pointer hover:opacity-80"
              draggable
              onDragStart={(e) => handleTagDragStart(e, tag.id)}
              onClick={() => addTag(tag.id)}
            >
              <span className="break-words">{tag.name}</span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagDropzone;
