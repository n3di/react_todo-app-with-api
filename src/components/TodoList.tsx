import React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Todo } from '../types/Todo';
import { TodoItem } from './TodoItem';

type Props = {
  todos: Todo[];
  tempTodo: Todo | null;
  processingIds: number[];
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onRename: (id: number, newTitle: string) => Promise<boolean>;
};

export const TodoList: React.FC<Props> = ({
  todos,
  tempTodo,
  processingIds,
  onDelete,
  onToggle,
  onRename,
}) => (
  <section className="todoapp__main" data-cy="TodoList">
    <TransitionGroup>
      {todos.map(todo => (
        <CSSTransition key={todo.id} timeout={300} classNames="item">
          <TodoItem
            todo={todo}
            isProcessed={processingIds.includes(todo.id)}
            onDelete={() => onDelete(todo.id)}
            onToggle={() => onToggle(todo.id)}
            onRename={title => onRename(todo.id, title)}
          />
        </CSSTransition>
      ))}

      {tempTodo && (
        <CSSTransition key={0} timeout={300} classNames="temp-item">
          <TodoItem todo={tempTodo} isProcessed />
        </CSSTransition>
      )}
    </TransitionGroup>
  </section>
);
