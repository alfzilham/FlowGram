import { Hono } from 'hono';
import { createCors } from './middleware/cors.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { enforceRequestLimit } from './middleware/request-limit.middleware.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { loginRateLimit, projectRateLimit, folderRateLimit } from './middleware/rate-limit.middleware.js';
import { requestLogger } from './middleware/logging.middleware.js';
import * as authController from './controllers/auth.controller.js';
import * as projectController from './controllers/project.controller.js';
import * as folderController from './controllers/folder.controller.js';
import * as versionController from './controllers/version.controller.js';
import * as templateController from './controllers/template.controller.js';
import * as searchController from './controllers/search.controller.js';
import * as trashController from './controllers/trash.controller.js';
import * as workspaceController from './controllers/workspace.controller.js';
import config from './config/index.js';

const app = new Hono();

app.use('/*', createCors());
app.use('/api/*', enforceRequestLimit);
app.use('/*', requestLogger());
app.onError(errorHandler);

// The OAuth client ID is public configuration. Secrets are never exposed here.
app.get('/api/config', (c) => c.json({ googleClientId: config.googleClientId || null }));

/* ---------- Auth ---------- */
app.post('/api/auth/google', loginRateLimit, (c) => authController.handleGoogleLogin(c));

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

/* ---------- Workflow Validation (diagnostic) ---------- */
app.post('/api/workflows/validate', (c) => projectController.handleValidateWorkflow(c));

/* ---------- Projects ---------- */
app.get('/api/projects', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleListProjects(c, payload);
});

app.post('/api/projects', projectRateLimit, (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleCreateProject(c, payload);
});

app.post('/api/projects/import', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleImport(c, payload);
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

app.put('/api/projects/:id/autosave', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleAutosave(c, payload);
});

app.delete('/api/projects/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return projectController.handleDeleteProject(c, payload);
});

/* ---------- Workflow Versions ---------- */
app.get('/api/projects/:id/versions', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return versionController.handleListVersions(c, payload);
});

app.post('/api/projects/:id/versions', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return versionController.handleCreateVersion(c, payload);
});

app.get('/api/projects/:id/versions/:vid', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return versionController.handleGetVersion(c, payload);
});

app.delete('/api/projects/:id/versions/:vid', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return versionController.handleDeleteVersion(c, payload);
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

/* ---------- Templates ---------- */
app.get('/api/templates', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return templateController.handleListTemplates(c, payload);
});

app.post('/api/templates', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return templateController.handleCreateTemplate(c, payload);
});

app.get('/api/templates/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return templateController.handleGetTemplate(c, payload);
});

app.put('/api/templates/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return templateController.handleUpdateTemplate(c, payload);
});

app.delete('/api/templates/:id', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return templateController.handleDeleteTemplate(c, payload);
});

app.post('/api/templates/:id/instantiate', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return templateController.handleInstantiateTemplate(c, payload);
});

/* ---------- Search & Tags ---------- */
app.get('/api/search', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return searchController.handleSearch(c, payload);
});

app.get('/api/tags', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return searchController.handleListAllTags(c, payload);
});

app.get('/api/projects/:id/tags', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return searchController.handleGetProjectTags(c, payload);
});

app.post('/api/projects/:id/tags', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return searchController.handleAddTag(c, payload);
});

app.delete('/api/projects/:id/tags/:tag', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return searchController.handleRemoveTag(c, payload);
});

/* ---------- Trash & Restore ---------- */
app.get('/api/trash', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return trashController.handleListTrash(c, payload);
});

app.post('/api/projects/:id/trash', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return trashController.handleTrashProject(c, payload);
});

app.post('/api/projects/:id/restore', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return trashController.handleRestoreProject(c, payload);
});

app.post('/api/projects/:id/duplicate', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return trashController.handleDuplicateProject(c, payload);
});

app.post('/api/folders/:id/trash', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return trashController.handleTrashFolder(c, payload);
});

app.post('/api/folders/:id/restore', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return trashController.handleRestoreFolder(c, payload);
});

app.post('/api/folders/:id/duplicate', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return trashController.handleDuplicateFolder(c, payload);
});

/* ---------- Workspace Export/Import ---------- */
app.get('/api/workspace/export', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return workspaceController.handleExport(c, payload);
});

app.post('/api/workspace/import', (c) => {
    const { payload, error } = requireAuth(c);
    if (error) return error;
    return workspaceController.handleImport(c, payload);
});

export default app;
