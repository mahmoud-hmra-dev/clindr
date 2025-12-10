<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FallbackRoleOrPermissionMiddleware
{
    public function handle(Request $request, Closure $next, ...$params): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $roles = [];
        $permissions = [];
        foreach ($params as $param) {
            if (str_starts_with($param, 'role:')) {
                $roles[] = substr($param, 5);
            } else {
                $permissions[] = $param;
            }
        }

        $userRoles = [];
        if (method_exists($user, 'getRoleNames')) {
            $userRoles = $user->getRoleNames()->toArray();
        } elseif (!empty($user->role)) {
            $userRoles = [$user->role];
        }

        $userRolesLower = array_map('strtolower', $userRoles);
        $rolesLower = array_map('strtolower', $roles);

        $hasRole = $roles ? (bool) array_intersect($rolesLower, $userRolesLower) : false;
        $hasPermission = method_exists($user, 'hasAnyPermission') ? $user->hasAnyPermission($permissions) : false;

        if ($hasRole || $hasPermission) {
            return $next($request);
        }

        abort(403, 'Forbidden');
    }
}
