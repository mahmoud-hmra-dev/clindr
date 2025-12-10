<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FallbackPermissionMiddleware
{
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        if (method_exists($user, 'hasAnyPermission')) {
            if (!$user->hasAnyPermission($permissions)) {
                abort(403, 'Forbidden');
            }
        }

        return $next($request);
    }
}
