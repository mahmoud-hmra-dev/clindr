<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\AreebaPaymentService;
use Illuminate\Support\Facades\URL;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private $payment_service;

    // Allowed redirect URL base domains (whitelist)
    private array $allowedRedirectDomains = [];

    public function __construct(AreebaPaymentService $payment_service)
    {
        $this->payment_service = $payment_service;

        // Load allowed domains from config; fallback to APP_URL domain
        $allowedDomains = env('PAYMENT_ALLOWED_REDIRECT_DOMAINS', parse_url(env('APP_URL', ''), PHP_URL_HOST) ?? '');
        $this->allowedRedirectDomains = array_filter(array_map('trim', explode(',', $allowedDomains)));
    }

    public function index()
    {
        $payments = Payment::all();
        return response()->json($payments);
    }

    // make hash for payment
    public function makeHash(Request $request)
    {
        $validated = $request->validate([
            'project_id'      => ['required', 'string', 'uuid'],
            'price'           => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'currency'        => ['required', 'string', 'size:3'],
            'user_id'         => ['nullable', 'integer'],
            'firstName'       => ['nullable', 'string', 'max:100'],
            'lastName'        => ['nullable', 'string', 'max:100'],
            'email'           => ['nullable', 'email', 'max:255'],
            'successCallback' => ['required', 'url', 'max:500'],
            'errorCallback'   => ['required', 'url', 'max:500'],
            'cancelCallback'  => ['required', 'url', 'max:500'],
        ]);

        if (!Project::where('uuid', $validated['project_id'])->exists()) {
            return response()->json(['error' => 'project id is not valid'], 400);
        }

        $jsonEncodedData = json_encode($validated, JSON_UNESCAPED_SLASHES);
        $base64EncodedData = base64_encode($jsonEncodedData);

        $app_url = URL::to('/');
        $paymentUrl = $app_url . '/payment?p=' . $base64EncodedData;
        $paymentUrl = str_replace(['\/', '\\/'], '/', $paymentUrl);

        return response($paymentUrl, 200)->header('Content-Type', 'text/plain');
    }

    public function makePayment(Request $request)
    {
        $payment_details = $request->input('p');
        $order = base64_decode($payment_details);
        $decodedData = json_decode($order);

        $price = $decodedData->price ?? null;
        if ($price === null || !is_numeric($price) || $price <= 0) {
            return view('pages.booking.payment_failed');
        }

        $call_id = Str::uuid()->toString();
        $data = $this->payment_service->generateSessionId($call_id, $price);

        if ($data) {
            $session_id = $data['session_id'];
            $call_id    = $data['order_id'];
            $price      = $data['price'];

            return view('pages.booking.payment', compact(
                'session_id',
                'call_id',
                'price',
                'decodedData',
                'payment_details'
            ));
        }

        return view('pages.booking.payment_failed');
    }

    public function successCallback(Request $request)
    {
        return $this->handleCallback($request, 'paid', 'successCallback');
    }

    public function cancelCallback(Request $request)
    {
        return $this->handleCallback($request, 'cancelled', 'cancelCallback');
    }

    public function errorCallback(Request $request)
    {
        return $this->handleCallback($request, 'failed', 'errorCallback');
    }

    private function handleCallback(Request $request, string $status, string $callbackField)
    {
        $order_id = $request->query('order_id') ?? $request->query('amp;order_id');
        $data     = $request->query('data');

        if (!$order_id || !$data) {
            Log::warning('Payment callback missing required params', [
                'order_id' => $order_id,
                'has_data' => !empty($data),
                'status' => $status,
                'ip' => $request->ip(),
            ]);
            return response('Missing order_id or data', 400);
        }

        // Idempotency: if order already processed successfully, skip re-processing
        $existing = Payment::where('order_id', $order_id)->where('status', 'paid')->first();
        if ($existing) {
            Log::info('Payment callback duplicate — skipping', ['order_id' => $order_id]);
            $baseUrl = (string) (json_decode(base64_decode($data))->{$callbackField} ?? '');
            if ($baseUrl !== '' && $this->isAllowedRedirectUrl($baseUrl)) {
                return $this->buildRedirectResponse($baseUrl, ['order_id' => $order_id, 'status' => $status]);
            }
            return response('Already processed', 200);
        }

        $decodedData = json_decode(base64_decode($data));

        // Validate redirect URL before storing or redirecting
        $baseUrl = (string) ($decodedData->{$callbackField} ?? '');
        if ($baseUrl === '') {
            return response('Callback URL missing in payload', 400);
        }

        if (!$this->isAllowedRedirectUrl($baseUrl)) {
            Log::warning('Payment callback redirect to disallowed domain blocked', [
                'url' => $baseUrl,
                'order_id' => $order_id,
                'ip' => $request->ip(),
            ]);
            return response('Invalid redirect URL', 400);
        }

        Payment::create([
            'project_id'      => $decodedData->project_id ?? null,
            'project_name'    => $decodedData->project_name ?? null,
            'prodact_id'      => $decodedData->prodact_id ?? null,
            'user_id'         => $decodedData->user_id ?? null,
            'firstName'       => $decodedData->firstName ?? null,
            'lastName'        => $decodedData->lastName ?? null,
            'email'           => $decodedData->email ?? null,
            'price'           => $decodedData->price ?? null,
            'currency'        => $decodedData->currency ?? null,
            'errorCallback'   => $decodedData->errorCallback ?? null,
            'successCallback' => $decodedData->successCallback ?? null,
            'cancelCallback'  => $decodedData->cancelCallback ?? null,
            'order_id'        => $order_id,
            'status'          => $status,
        ]);

        Log::info('Payment callback processed', [
            'order_id' => $order_id,
            'status' => $status,
        ]);

        return $this->buildRedirectResponse($baseUrl, ['order_id' => $order_id, 'status' => $status]);
    }

    private function isAllowedRedirectUrl(string $url): bool
    {
        $parsed = parse_url($url);
        if (!$parsed || empty($parsed['host'])) {
            return false;
        }

        // Only allow https in production
        if (app()->isProduction() && ($parsed['scheme'] ?? '') !== 'https') {
            return false;
        }

        if (empty($this->allowedRedirectDomains)) {
            return false; // No domains configured — deny all redirects for safety
        }

        $host = strtolower($parsed['host']);
        foreach ($this->allowedRedirectDomains as $allowed) {
            $allowed = strtolower($allowed);
            if ($host === $allowed || str_ends_with($host, '.' . $allowed)) {
                return true;
            }
        }

        return false;
    }

    private function buildRedirectResponse(string $baseUrl, array $parameters): \Illuminate\Http\Response
    {
        $redirectUrl = $this->buildRedirectUrl($baseUrl, $parameters);

        return response(
            '<!doctype html><html><head><meta charset="utf-8"></head><body>
            <script>
              window.location.replace(' . json_encode($redirectUrl) . ');
            </script>
            </body></html>',
            200
        )->header('Content-Type', 'text/html; charset=utf-8');
    }

    private function buildRedirectUrl(string $baseUrl, array $parameters): string
    {
        if (empty($parameters)) return $baseUrl;

        $pairs = [];
        foreach ($parameters as $k => $v) {
            $pairs[] = rawurlencode($k) . '=' . rawurlencode((string) $v);
        }

        $sep = str_contains($baseUrl, '?') ? '&' : '?';
        return $baseUrl . $sep . implode('&', $pairs);
    }
}
