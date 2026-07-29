// Server-rendered HTML pages for the Kindle 5.16 experimental browser.
// Plain HTML + inline CSS, no external assets, works with JS disabled.
// Layout uses basic block elements and floats only (old WebKit safe).

import type { Todo } from './db';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STYLES = `
  * { margin: 0; padding: 0; }
  body {
    font-family: Georgia, serif;
    background: #ffffff;
    color: #000000;
    font-size: 18px;
    line-height: 1.5;
  }
  .wrap {
    max-width: 600px;
    margin: 0 auto;
    padding: 16px;
  }
  h1 {
    font-size: 26px;
    padding: 12px 0;
    border-bottom: 3px solid #000000;
    margin-bottom: 16px;
  }
  .error {
    border: 2px solid #000000;
    padding: 12px;
    margin-bottom: 16px;
    font-weight: bold;
  }
  label {
    display: block;
    font-weight: bold;
    margin-bottom: 6px;
  }
  input[type="text"], input[type="password"] {
    display: block;
    width: 95%;
    font-size: 18px;
    padding: 10px;
    border: 2px solid #000000;
    background: #ffffff;
    color: #000000;
    margin-bottom: 16px;
  }
  button, input[type="submit"] {
    font-size: 18px;
    font-weight: bold;
    padding: 10px 18px;
    min-height: 44px;
    border: 2px solid #000000;
    background: #ffffff;
    color: #000000;
  }
  .btn-block {
    display: block;
    width: 100%;
  }
  .todo {
    border: 2px solid #000000;
    padding: 10px;
    margin-bottom: 10px;
    overflow: hidden;
  }
  .todo-title {
    display: block;
    padding: 8px 4px;
    font-size: 18px;
    word-wrap: break-word;
  }
  .todo-done .todo-title {
    text-decoration: line-through;
    color: #555555;
  }
  .todo-actions {
    margin-top: 8px;
    border-top: 1px solid #999999;
    padding-top: 8px;
  }
  .inline-form {
    display: inline;
  }
  .inline-form button {
    margin-right: 8px;
  }
  .topbar {
    overflow: hidden;
    margin-bottom: 16px;
  }
  .topbar form {
    float: right;
  }
  .add-form {
    border: 2px solid #000000;
    padding: 12px;
    margin-bottom: 20px;
  }
  .add-form input[type="text"] {
    margin-bottom: 10px;
  }
  .empty {
    padding: 20px 0;
    text-align: center;
    font-style: italic;
  }
  .count {
    margin-bottom: 12px;
    font-size: 16px;
    color: #333333;
  }
`;

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>`;
}

export function loginPage(showError: boolean): string {
  const error = showError
    ? '<div class="error">Wrong username or password. Please try again.</div>'
    : '';
  return layout(
    'Login - Kindle Todo',
    `<h1>Kindle Todo</h1>
${error}
<form method="POST" action="/login">
  <label for="username">Username</label>
  <input type="text" id="username" name="username" autocapitalize="off" autocorrect="off">
  <label for="password">Password</label>
  <input type="password" id="password" name="password">
  <button type="submit" class="btn-block">Log in</button>
</form>`
  );
}

export function todosPage(todos: Todo[]): string {
  const remaining = todos.filter((t) => !t.completed).length;
  const items = todos.length
    ? todos
        .map((t) => {
          const done = t.completed ? ' todo-done' : '';
          const toggleLabel = t.completed ? 'Undo' : 'Done';
          return `<div class="todo${done}">
  <span class="todo-title">${escapeHtml(t.title)}</span>
  <div class="todo-actions">
    <form method="POST" action="/todos/${t.id}/toggle" class="inline-form">
      <button type="submit">${toggleLabel}</button>
    </form>
    <form method="POST" action="/todos/${t.id}/delete" class="inline-form">
      <button type="submit">Delete</button>
    </form>
  </div>
</div>`;
        })
        .join('\n')
    : '<div class="empty">No todos yet. Add one above.</div>';

  return layout(
    'Todos - Kindle Todo',
    `<div class="topbar">
  <form method="POST" action="/logout">
    <button type="submit">Log out</button>
  </form>
</div>
<h1>My Todos</h1>
<form method="POST" action="/todos" class="add-form">
  <label for="title">New todo</label>
  <input type="text" id="title" name="title" maxlength="200">
  <button type="submit" class="btn-block">Add</button>
</form>
<div class="count">${remaining} of ${todos.length} remaining</div>
${items}`
  );
}
