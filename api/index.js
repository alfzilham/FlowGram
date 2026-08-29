import { Hono } from 'hono';
import { createCors } from './middleware/cors.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { enforceRequestLimit } from './middleware/request-limit.middleware.js';
import { requireAuth } from './middleware/auth.middleware.js';
import * as authController from './controllers/auth.controller.js';
import * as projectController from './controllers/project.controller.js';
import * as folderController from './controllers/folder.controller.js';

const app = new Hono();

app.use('/*', createCors());
app.use('/api/*', enforceRequestLimit);
app.onError(errorHandler);

/* ---------- Auth ---------- */
app.post('/api/auth/google', (c) => authController.handleGoogleLogin(c));

app.get('/api/auth/me', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return authController.handleGetMe(c, payload);
});

app.post('/api/auth/name', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return authController.handleUpdateName(c, payload);
});

app.delete('/api/auth/account', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return authController.handleDeleteAccount(c, payload);
});

/* ---------- Projects ---------- */
app.get('/api/projects', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleListProjects(c, payload);
});

app.post('/api/projects', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleCreateProject(c, payload);
});

app.get('/api/projects/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleGetProject(c, payload);
});

app.put('/api/projects/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleUpdateProject(c, payload);
});

app.delete('/api/projects/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleDeleteProject(c, payload);
});

/* ---------- Folders ---------- */
app.get('/api/folders', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return folderController.handleListFolders(c, payload);
});

app.post('/api/folders', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return folderController.handleCreateFolder(c, payload);
});

app.put('/api/folders/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return folderController.handleRenameFolder(c, payload);
});

app.delete('/api/folders/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return folderController.handleDeleteFolder(c, payload);
});

export default app;
