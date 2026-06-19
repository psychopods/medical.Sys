import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'mysql2/promise';
import { requirePermission } from '../middleware/auth.ts';
import { HttpError, toHttpError } from '../utils/httpError.ts';
import * as rbacService from '../services/rbacService.ts';
import type {
    CreateRoleRequestBody,
    UpdateRoleRequestBody,
    CreatePermissionRequestBody,
    UpdatePermissionRequestBody,
    AssignPermissionRequestBody
} from '../types/rbac.ts';

// Helper validations
function requireString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `${fieldName} is required and must be a non-empty string.`);
    }
    return value;
}

function optionalString(value: unknown): string | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new HttpError(400, 'Description field must be a string if provided.');
    }
    return value.trim();
}

export function createRbacRouter(pool: Pool): Router {
    const router = Router();

    // CREATE Role
    router.post(
        '/roles',
        requirePermission(pool, 'rbac:write'),
        async (
            request: Request<unknown, unknown, CreateRoleRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const name = requireString(request.body.name, 'name');
                const description = optionalString(request.body.description);

                const role = await rbacService.createRole(pool, id, name, description);

                response.status(201).json({
                    message: 'Role created successfully.',
                    role
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // LIST all Roles
    router.get(
        '/roles',
        requirePermission(pool, 'rbac:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const roles = await rbacService.listRoles(pool);
                response.status(200).json(roles);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // GET single Role (with its linked permissions)
    router.get(
        '/roles/:id',
        requirePermission(pool, 'rbac:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const role = await rbacService.getRoleWithPermissions(pool, id);

                response.status(200).json(role);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // GET permissions linked to a Role (direct array of permission IDs)
    router.get(
        '/roles/:id/permissions',
        requirePermission(pool, 'rbac:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const role = await rbacService.getRoleWithPermissions(pool, id);
                const permissionIds = role.permissions.map((p) => p.id);
                response.status(200).json(permissionIds);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // UPDATE Role
    router.put(
        '/roles/:id',
        requirePermission(pool, 'rbac:write'),
        async (
            request: Request<{ id: string }, unknown, UpdateRoleRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const name = requireString(request.body.name, 'name');
                const description = optionalString(request.body.description);

                const role = await rbacService.updateRole(pool, id, name, description);

                response.status(200).json({
                    message: 'Role updated successfully.',
                    role
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // DELETE Role
    router.delete(
        '/roles/:id',
        requirePermission(pool, 'rbac:write'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await rbacService.deleteRole(pool, id);

                response.status(200).json({
                    message: 'Role deleted successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // CREATE Permission
    router.post(
        '/permissions',
        requirePermission(pool, 'rbac:write'),
        async (
            request: Request<unknown, unknown, CreatePermissionRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.body.id, 'id');
                const slug = requireString(request.body.slug, 'slug');
                const description = optionalString(request.body.description);
                const categoryId = request.body.categoryId !== undefined && request.body.categoryId !== null
                    ? Number(request.body.categoryId)
                    : null;

                const permission = await rbacService.createPermission(pool, id, slug, description, categoryId);

                response.status(201).json({
                    message: 'Permission created successfully.',
                    permission
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // LIST all Permissions
    router.get(
        '/permissions',
        requirePermission(pool, 'rbac:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const permissions = await rbacService.listPermissions(pool);
                response.status(200).json(permissions);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // GET single Permission
    router.get(
        '/permissions/:id',
        requirePermission(pool, 'rbac:read'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const permission = await rbacService.getPermission(pool, id);

                response.status(200).json(permission);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // UPDATE Permission
    router.put(
        '/permissions/:id',
        requirePermission(pool, 'rbac:write'),
        async (
            request: Request<{ id: string }, unknown, UpdatePermissionRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                const slug = requireString(request.body.slug, 'slug');
                const description = optionalString(request.body.description);
                const categoryId = request.body.categoryId !== undefined && request.body.categoryId !== null
                    ? Number(request.body.categoryId)
                    : null;

                const permission = await rbacService.updatePermission(pool, id, slug, description, categoryId);

                response.status(200).json({
                    message: 'Permission updated successfully.',
                    permission
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // DELETE Permission
    router.delete(
        '/permissions/:id',
        requirePermission(pool, 'rbac:write'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = requireString(request.params.id, 'id');
                await rbacService.deletePermission(pool, id);

                response.status(200).json({
                    message: 'Permission deleted successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );
    
    // LIST all Permission Categories
    router.get(
        '/permission_categories',
        requirePermission(pool, 'rbac:read'),
        async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const categories = await rbacService.listPermissionCategories(pool);
                response.status(200).json(categories);
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // CREATE Permission Category
    router.post(
        '/permission_categories',
        requirePermission(pool, 'rbac:write'),
        async (request: Request, response: Response, next: NextFunction): Promise<void> => {
            try {
                const name = requireString(request.body.name, 'name');
                const description = optionalString(request.body.description);

                const category = await rbacService.createPermissionCategory(pool, name, description);

                response.status(201).json({
                    message: 'Permission category created successfully.',
                    category
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // UPDATE Permission Category
    router.put(
        '/permission_categories/:id',
        requirePermission(pool, 'rbac:write'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = Number(requireString(request.params.id, 'id'));
                if (isNaN(id)) {
                    throw new HttpError(400, 'Category ID must be a valid number.');
                }
                const name = requireString(request.body.name, 'name');
                const description = optionalString(request.body.description);

                const category = await rbacService.updatePermissionCategory(pool, id, name, description);

                response.status(200).json({
                    message: 'Permission category updated successfully.',
                    category
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // DELETE Permission Category
    router.delete(
        '/permission_categories/:id',
        requirePermission(pool, 'rbac:write'),
        async (request: Request<{ id: string }>, response: Response, next: NextFunction): Promise<void> => {
            try {
                const id = Number(requireString(request.params.id, 'id'));
                if (isNaN(id)) {
                    throw new HttpError(400, 'Category ID must be a valid number.');
                }
                await rbacService.deletePermissionCategory(pool, id);

                response.status(200).json({
                    message: 'Permission category deleted successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // ASSIGN Permission to Role
    router.post(
        '/roles/:id/permissions',
        requirePermission(pool, 'rbac:write'),
        async (
            request: Request<{ id: string }, unknown, AssignPermissionRequestBody>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const roleId = requireString(request.params.id, 'roleId');
                const permissionId = requireString(request.body.permissionId, 'permissionId');

                await rbacService.assignPermissionToRole(pool, roleId, permissionId);

                response.status(200).json({
                    message: 'Permission assigned to role successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    // UNASSIGN Permission from Role
    router.delete(
        '/roles/:id/permissions/:permissionId',
        requirePermission(pool, 'rbac:write'),
        async (
            request: Request<{ id: string; permissionId: string }>,
            response: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                const roleId = requireString(request.params.id, 'roleId');
                const permissionId = requireString(request.params.permissionId, 'permissionId');

                await rbacService.removePermissionFromRole(pool, roleId, permissionId);

                response.status(200).json({
                    message: 'Permission removed from role successfully.'
                });
            } catch (error) {
                next(toHttpError(error));
            }
        }
    );

    return router;
}
