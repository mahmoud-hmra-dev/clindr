<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\FallbackRoleMiddleware;
use App\Http\Middleware\FallbackPermissionMiddleware;
use App\Http\Middleware\FallbackRoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => class_exists(\Spatie\Permission\Middlewares\RoleMiddleware::class)
                ? \Spatie\Permission\Middlewares\RoleMiddleware::class
                : FallbackRoleMiddleware::class,
            'permission' => class_exists(\Spatie\Permission\Middlewares\PermissionMiddleware::class)
                ? \Spatie\Permission\Middlewares\PermissionMiddleware::class
                : FallbackPermissionMiddleware::class,
            'role_or_permission' => class_exists(\Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class)
                ? \Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class
                : FallbackRoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
