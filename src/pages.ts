// Server-rendered HTML pages for the Kindle 5.16 experimental browser.
// Plain HTML + inline CSS, no external assets, works with JS disabled.
// Layout uses basic block elements only, full-width fluid (old WebKit safe).

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
  * {
    margin: 0;
    padding: 0;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
  }
  html, body {
    width: 100%;
  }
  body {
    font-family: Georgia, serif;
    background: #ffffff;
    color: #000000;
    font-size: 16px;
    line-height: 1.4;
  }
  .wrap {
    width: 100%;
    padding: 8px;
  }
  h1 {
    font-size: 20px;
    padding: 6px 0;
    border-bottom: 2px solid #000000;
    margin-bottom: 10px;
  }
  .error {
    border: 2px solid #000000;
    padding: 8px;
    margin-bottom: 10px;
    font-weight: bold;
  }
  label {
    display: block;
    font-weight: bold;
    margin-bottom: 4px;
  }
  input[type="text"], input[type="password"] {
    display: block;
    width: 100%;
    font-size: 16px;
    padding: 8px;
    border: 2px solid #000000;
    background: #ffffff;
    color: #000000;
    margin-bottom: 10px;
  }
  button, input[type="submit"] {
    font-size: 16px;
    font-weight: bold;
    padding: 8px 14px;
    min-height: 40px;
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
    padding: 8px;
    margin-bottom: 8px;
  }
  .todo-title {
    display: block;
    padding: 4px 2px;
    font-size: 16px;
    word-wrap: break-word;
  }
  .todo-done .todo-title {
    text-decoration: line-through;
    color: #555555;
  }
  .todo-actions {
    margin-top: 6px;
    border-top: 1px solid #999999;
    padding-top: 6px;
  }
  .inline-form {
    display: inline;
  }
  .inline-form button {
    margin-right: 6px;
  }
  .topbar {
    margin-bottom: 10px;
    text-align: right;
  }
  .topbar form {
    display: inline;
  }
  .add-form {
    border: 2px solid #000000;
    padding: 8px;
    margin-bottom: 12px;
  }
  .add-form input[type="text"] {
    margin-bottom: 8px;
  }
  .empty {
    padding: 14px 0;
    text-align: center;
    font-style: italic;
  }
  .count {
    margin-bottom: 8px;
    font-size: 14px;
    color: #333333;
  }
`;

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
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
