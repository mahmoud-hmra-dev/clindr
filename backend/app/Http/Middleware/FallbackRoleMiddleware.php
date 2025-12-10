<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FallbackRoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $userRoles = [];
        if (method_exists($user, 'getRoleNames')) {
            $userRoles = $user->getRoleNames()->toArray();
        } elseif (!empty($user->role)) {
            $userRoles = [$user->role];
        }

        $roles = array_map('strtolower', $roles);
        $userRoles = array_map('strtolower', $userRoles);

        if (!array_intersect($roles, $userRoles)) {
            abort(403, 'Forbidden');
        }

        return $next($request);
    }
}
