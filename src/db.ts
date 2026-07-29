// D1 queries for todos.

export interface Todo {
  id: number;
  title: string;
  completed: number;
  created_at: string;
}

export async function listTodos(db: D1Database): Promise<Todo[]> {
  const { results } = await db
    .prepare('SELECT id, title, completed, created_at FROM todos ORDER BY completed ASC, id DESC')
    .all<Todo>();
  return results;
}

export async function addTodo(db: D1Database, title: string): Promise<void> {
  await db.prepare('INSERT INTO todos (title) VALUES (?)').bind(title).run();
}

export async function toggleTodo(db: D1Database, id: number): Promise<void> {
  await db
    .prepare('UPDATE todos SET completed = CASE completed WHEN 0 THEN 1 ELSE 0 END WHERE id = ?')
    .bind(id)
    .run();
}

export async function deleteTodo(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM todos WHERE id = ?').bind(id).run();
}
