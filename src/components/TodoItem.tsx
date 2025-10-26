import React, { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/Todo';

type Props = {
  todo: Todo;
  isProcessed?: boolean;
  onDelete?: () => void;
  onToggle?: () => void;
  onRename?: (newTitle: string) => Promise<boolean>;
};

export const TodoItem: React.FC<Props> = ({
  todo,
  isProcessed,
  onDelete,
  onToggle,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setTitle(todo.title);
    }
  }, [todo.title, isEditing]);

  const startEdit = () => {
    setTitle(todo.title);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setTitle(todo.title);
    setIsEditing(false);
  };

  // TodoItem.tsx
  const submitEdit = async () => {
    if (!onRename) {
      setIsEditing(false);
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;

    const trimmed = title.trim();

    if (trimmed === todo.title.trim()) {
      setIsEditing(false);
      submittingRef.current = false;
      return;
    }

    if (trimmed.length === 0) {
      const ok = await onRename(trimmed);
      if (ok) setIsEditing(false);
      submittingRef.current = false;
      return;
    }

    const ok = await onRename(trimmed);
    if (ok) setIsEditing(false);

    submittingRef.current = false;
  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div
      data-cy="Todo"
      className={`todo ${todo.completed ? 'completed' : ''} ${isProcessed ? 'is-disabled' : ''}`}
    >
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label htmlFor={`todo-${todo.id}`} className="todo__status-label">
        <input
          id={`todo-${todo.id}`}
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          onChange={onToggle}
          disabled={isProcessed}
        />
      </label>

      {!isEditing ? (
        <>
          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={onRename ? startEdit : undefined}
          >
            {todo.title}
          </span>

          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            onClick={onDelete}
            disabled={isProcessed}
            aria-label="Delete todo"
          >
            ×
          </button>
        </>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault();
            void submitEdit();
          }}
        >
          <input
            data-cy="TodoTitleField"
            className="todo__title-field"
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => {
              if (!submittingRef.current) {
                void submitEdit();
              }
            }}
            onKeyUp={onKeyUp}
            placeholder="Empty title will delete"
            disabled={isProcessed}
          />
        </form>
      )}

      <div
        data-cy="TodoLoader"
        className={`modal overlay ${isProcessed ? 'is-active' : ''}`}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
