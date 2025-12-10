<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AreebaPaymentService
{
    public function createPaymentSession(array $payload): array
    {
        $apiUrl = rtrim(config('services.areeba.api_url', env('AREEBA_API_URL', '')), '/');
        $merchantId = config('services.areeba.merchant_id', env('AREEBA_MERCHANT_ID'));
        $merchantPassword = config('services.areeba.merchant_password', env('AREEBA_MERCHANT_PASSWORD'));

        if (empty($apiUrl) || empty($merchantId) || empty($merchantPassword)) {
            throw new \RuntimeException('Areeba credentials are not configured.');
        }

        $body = array_merge([
            'merchant_id' => $merchantId,
        ], $payload);

        $response = Http::asJson()
            ->withBasicAuth($merchantId, $merchantPassword)
            ->post($apiUrl.'/payments', $body);

        if ($response->failed()) {
            Log::error('Areeba payment create failed', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new \RuntimeException('Failed to create Areeba payment session.');
        }

        $data = $response->json();

        return [
            'transaction_id' => $data['transaction_id'] ?? null,
            'redirect_url' => $data['redirect_url'] ?? null,
            'raw' => $data,
        ];
    }
}
