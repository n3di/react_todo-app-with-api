import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { UserWarning } from './UserWarning';
import {
  USER_ID,
  getTodos,
  createTodo,
  deleteTodo,
  updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';
import { ErrorType } from './types/ErrorTypes';
import { Filter } from './types/Filter';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { ErrorNotification } from './components/ErrorNotification';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  const [isError, setIsError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [processingIds, setProcessingIds] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const todosFromServer = await getTodos();
        setTodos(todosFromServer);
      } catch {
        setIsError(ErrorType.LOAD_TODOS);
      }
    })();
  }, []);

  useEffect(() => {
    if (isError) {
      timerRef.current = setTimeout(() => setIsError(null), 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isError]);

  const activeTodosCount = useMemo(
    () => todos.filter(t => !t.completed).length,
    [todos],
  );

  const completedCount = useMemo(
    () => todos.filter(t => t.completed).length,
    [todos],
  );

  const allCompleted = useMemo(
    () => todos.length > 0 && todos.every(t => t.completed),
    [todos],
  );

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const handleSetFilter = useCallback((newFilter: Filter) => {
    setFilter(newFilter);
  }, []);

  const handleSetIsError = useCallback((error: string | null) => {
    setIsError(error);
  }, []);

  const handleAdd = useCallback(async () => {
    const trimmed = title.trim();

    if (!trimmed) {
      setIsError(ErrorType.EMPTY_TITLE);
      return;
    }

    try {
      setIsAdding(true);
      setTempTodo({ id: 0, title: trimmed, completed: false, userId: USER_ID });
      const created = await createTodo(trimmed);
      setTodos(prev => [...prev, created]);
      setTempTodo(null);
      setTitle('');
    } catch {
      setTempTodo(null);
      setIsError(ErrorType.ADD_TODO);
    } finally {
      setIsAdding(false);
      requestAnimationFrame(() => {
        (
          document.getElementById('newTodoField') as HTMLInputElement | null
        )?.focus();
      });
    }
  }, [title]);

  const deleteOne = useCallback(async (id: number): Promise<boolean> => {
    try {
      setProcessingIds(prev => [...prev, id]);
      await deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      return true;
    } catch {
      setIsError(ErrorType.DELETE_TODO);
      return false;
    } finally {
      setProcessingIds(prev => prev.filter(x => x !== id));
    }
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      const ok = await deleteOne(id);
      if (ok) {
        requestAnimationFrame(() => {
          (
            document.getElementById('newTodoField') as HTMLInputElement | null
          )?.focus();
        });
      }
    },
    [deleteOne],
  );

  const handleClearCompleted = useCallback(async () => {
    const completed = todos.filter(t => t.completed);
    if (completed.length === 0) return;

    setProcessingIds(prev => [
      ...prev,
      ...completed.map(t => t.id).filter(id => !prev.includes(id)),
    ]);

    const results = await Promise.allSettled(
      completed.map(t => deleteTodo(t.id)),
    );

    const succeededIds: number[] = [];
    let hadError = false;

    results.forEach((res, idx) => {
      const id = completed[idx].id;
      if (res.status === 'fulfilled') {
        succeededIds.push(id);
      } else {
        hadError = true;
      }
    });

    if (succeededIds.length) {
      setTodos(prev => prev.filter(t => !succeededIds.includes(t.id)));
    }

    setProcessingIds(prev =>
      prev.filter(id => !completed.some(t => t.id === id)),
    );

    if (hadError) {
      setIsError(ErrorType.DELETE_TODO);
    } else {
      requestAnimationFrame(() => {
        (
          document.getElementById('newTodoField') as HTMLInputElement | null
        )?.focus();
      });
    }
  }, [todos]);

  const handleToggle = useCallback(
    async (id: number) => {
      const target = todos.find(t => t.id === id);
      if (!target) return;

      try {
        setProcessingIds(prev => [...prev, id]);
        const updated = await updateTodo(id, { completed: !target.completed });
        setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
      } catch {
        setIsError(ErrorType.UPDATE_TODO); // "Unable to update a todo"
      } finally {
        setProcessingIds(prev => prev.filter(x => x !== id));
      }
    },
    [todos],
  );

  const handleToggleAll = useCallback(async () => {
    if (todos.length === 0) return;

    const nextCompleted = !allCompleted;
    const toChange = todos.filter(t => t.completed !== nextCompleted);
    if (toChange.length === 0) return;

    setProcessingIds(prev => [
      ...prev,
      ...toChange.map(t => t.id).filter(id => !prev.includes(id)),
    ]);

    const results = await Promise.allSettled(
      toChange.map(t => updateTodo(t.id, { completed: nextCompleted })),
    );

    const succeeded: Todo[] = [];
    let hadError = false;

    results.forEach(res => {
      if (res.status === 'fulfilled') {
        succeeded.push(res.value);
      } else {
        hadError = true;
      }
    });

    if (succeeded.length) {
      setTodos(prev =>
        prev.map(t => {
          const found = succeeded.find(s => s.id === t.id);
          return found ? found : t;
        }),
      );
    }

    setProcessingIds(prev =>
      prev.filter(id => !toChange.some(t => t.id === id)),
    );

    if (hadError) {
      setIsError(ErrorType.UPDATE_TODO);
    }
  }, [todos, allCompleted]);

  const handleRename = useCallback(
    async (id: number, newTitle: string): Promise<boolean> => {
      const trimmed = newTitle.trim();
      const current = todos.find(t => t.id === id);
      if (!current) return false;

      if (trimmed === current.title.trim()) {
        return true;
      }

      if (trimmed.length === 0) {
        return await deleteOne(id);
      }

      try {
        setProcessingIds(prev => [...prev, id]);
        const updated = await updateTodo(id, { title: trimmed });
        setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
        return true;
      } catch {
        setIsError(ErrorType.UPDATE_TODO);
        return false;
      } finally {
        setProcessingIds(prev => prev.filter(x => x !== id));
      }
    },
    [todos, deleteOne],
  );

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className={`todoapp ${isError ? 'has-error' : ''}`}>
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <Header
          title={title}
          onTitleChange={setTitle}
          onAdd={handleAdd}
          disabled={isAdding}
          allCompleted={allCompleted}
          onToggleAll={handleToggleAll}
          showToggleAll={todos.length > 0}
        />

        <TodoList
          todos={filteredTodos}
          tempTodo={tempTodo}
          processingIds={processingIds}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onRename={handleRename}
        />

        {todos.length > 0 && (
          <Footer
            activeTodosCount={activeTodosCount}
            completedCount={completedCount}
            filter={filter}
            onFilterChange={handleSetFilter}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      <ErrorNotification isError={isError} onSetError={handleSetIsError} />
    </div>
  );
};
