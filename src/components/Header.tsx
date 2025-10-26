import React, { useEffect, useRef } from 'react';

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  onAdd: () => void;
  disabled: boolean;

  allCompleted: boolean;
  onToggleAll: () => void;

  // ✅ nowy prop
  showToggleAll: boolean;
};

export const Header: React.FC<Props> = ({
  title,
  onTitleChange,
  onAdd,
  disabled,
  allCompleted,
  onToggleAll,
  showToggleAll,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <header className="todoapp__header">
      {showToggleAll && (
        <button
          type="button"
          className={`todoapp__toggle-all ${allCompleted ? 'active' : ''}`}
          data-cy="ToggleAllButton"
          onClick={onToggleAll}
          aria-pressed={allCompleted}
        />
      )}

      <form onSubmit={onSubmit}>
        <input
          ref={inputRef}
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          id="newTodoField"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          disabled={disabled}
        />
      </form>
    </header>
  );
};
