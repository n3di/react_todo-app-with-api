import React from 'react';
import { Filter } from '../types/Filter';
import { FilterLink } from './FilterLink';

type Props = {
  activeTodosCount: number;
  completedCount: number;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  onClearCompleted: () => void;
};

export const Footer: React.FC<Props> = ({
  activeTodosCount,
  completedCount,
  filter,
  onFilterChange,
  onClearCompleted,
}) => (
  <footer className="todoapp__footer" data-cy="Footer">
    <span className="todo-count" data-cy="TodosCounter">
      {activeTodosCount} items left
    </span>

    <nav className="filter" data-cy="Filter">
      <FilterLink
        filter="all"
        currentFilter={filter}
        setFilter={onFilterChange}
        label="All"
        dataCy="FilterLinkAll"
      />
      <FilterLink
        filter="active"
        currentFilter={filter}
        setFilter={onFilterChange}
        label="Active"
        dataCy="FilterLinkActive"
      />
      <FilterLink
        filter="completed"
        currentFilter={filter}
        setFilter={onFilterChange}
        label="Completed"
        dataCy="FilterLinkCompleted"
      />
    </nav>

    <button
      type="button"
      className="todoapp__clear-completed"
      data-cy="ClearCompletedButton"
      onClick={onClearCompleted}
      disabled={completedCount === 0}
    >
      Clear completed
    </button>
  </footer>
);
