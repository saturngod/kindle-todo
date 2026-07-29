import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import {
  type Env,
  SESSION_COOKIE,
  checkCredentials,
  createSessionCookie,
  clearSessionCookie,
  verifySessionCookie,
} from './auth';
import { listTodos, addTodo, toggleTodo, deleteTodo } from './db';
import { loginPage, todosPage } from './pages';

const app = new Hono<{ Bindings: Env }>();

// --- Public routes ---

app.get('/login', async (c) => {
  // Already logged in? Go straight to the list.
  if (await verifySessionCookie(c.env, getCookie(c, SESSION_COOKIE))) {
    return c.redirect('/', 303);
  }
  return c.html(loginPage(c.req.query('error') === '1'));
});

app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (username && password && (await checkCredentials(c.env, username, password))) {
    c.header('Set-Cookie', await createSessionCookie(c.env, username));
    return c.redirect('/', 303);
  }
  return c.redirect('/login?error=1', 303);
});

app.post('/logout', (c) => {
  c.header('Set-Cookie', clearSessionCookie());
  return c.redirect('/login', 303);
});

// --- Auth middleware for everything below ---

app.use('*', async (c, next) => {
  if (await verifySessionCookie(c.env, getCookie(c, SESSION_COOKIE))) {
    return next();
  }
  return c.redirect('/login', 303);
});

// --- Todo routes (auth required) ---

app.get('/', async (c) => {
  const todos = await listTodos(c.env.DB);
  return c.html(todosPage(todos));
});

app.post('/todos', async (c) => {
  const body = await c.req.parseBody();
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  if (title) {
    await addTodo(c.env.DB, title);
  }
  return c.redirect('/', 303);
});

app.post('/todos/:id/toggle', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (Number.isFinite(id)) {
    await toggleTodo(c.env.DB, id);
  }
  return c.redirect('/', 303);
});

app.post('/todos/:id/delete', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (Number.isFinite(id)) {
    await deleteTodo(c.env.DB, id);
  }
  return c.redirect('/', 303);
});

export default app;
