<?php

namespace App\Http\Controllers\API\Payment;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\AreebaPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AreebaPaymentController extends Controller
{
    public function __construct(private readonly AreebaPaymentService $areeba)
    {
    }

    public function create(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $validated = $request->validate([
            'appointment_id' => ['required_without:invoice_id', 'nullable', 'exists:appointments,id'],
            'invoice_id' => ['required_without:appointment_id', 'nullable', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.1'],
            'currency' => ['required', 'string', 'size:3'],
        ]);

        $appointment = null;
        $invoice = null;

        if (! empty($validated['appointment_id'])) {
            $appointment = Appointment::where('patient_id', $patient->id)->findOrFail($validated['appointment_id']);
        }

        if (! empty($validated['invoice_id'])) {
            $invoice = Invoice::where('patient_id', $patient->id)->findOrFail($validated['invoice_id']);
        }

        try {
            $result = $this->areeba->createPaymentSession([
                'amount' => $validated['amount'],
                'currency' => strtoupper($validated['currency']),
                'appointment_id' => $appointment?->id,
                'invoice_id' => $invoice?->id,
                'customer_email' => $patient->email,
            ]);
        } catch (\Throwable $e) {
            Log::error('Areeba create payment failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Unable to start payment. Please try again.',
            ], 422);
        }

        $payment = DB::transaction(function () use ($validated, $appointment, $invoice, $result) {
            $payment = Payment::create([
                'appointment_id' => $appointment?->id,
                'invoice_id' => $invoice?->id,
                'amount' => $validated['amount'],
                'currency' => strtoupper($validated['currency']),
                'areeba_transaction_id' => $result['transaction_id'] ?? null,
                'status' => 'pending',
                'redirect_url' => $result['redirect_url'] ?? null,
                'raw_response_json' => $result['raw'] ?? null,
            ]);

            if ($appointment) {
                $appointment->update([
                    'areeba_transaction_id' => $payment->areeba_transaction_id,
                    'areeba_payment_status' => 'pending',
                    'status' => $appointment->status === 'pending' ? 'waiting_payment' : $appointment->status,
                ]);
            }

            return $payment;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'redirect_url' => $payment->redirect_url,
                'transaction_id' => $payment->areeba_transaction_id,
            ],
        ]);
    }

    public function callback(Request $request)
    {
        $transactionId = $request->get('transaction_id') ?? $request->get('id');
        $status = strtolower($request->get('status', ''));

        if (! $transactionId) {
            return response()->json(['success' => false, 'message' => 'Missing transaction id'], 400);
        }

        $payment = Payment::where('areeba_transaction_id', $transactionId)->first();

        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        $successStatuses = ['success', 'paid', 'authorized', 'approved'];
        $isSuccess = in_array($status, $successStatuses, true);

        DB::transaction(function () use ($payment, $status, $isSuccess, $request) {
            $payment->status = $status ?: ($isSuccess ? 'paid' : 'failed');
            $payment->raw_response_json = array_merge($payment->raw_response_json ?? [], $request->all());
            $payment->save();

            if ($payment->appointment_id) {
                $appointment = $payment->appointment;
                if ($appointment) {
                    $appointment->areeba_payment_status = $isSuccess ? 'paid' : 'failed';
                    if ($isSuccess && $appointment->status === 'waiting_payment') {
                        $appointment->status = 'confirmed';
                    }
                    $appointment->save();
                }
            }

            if ($payment->invoice_id && $payment->invoice) {
                $payment->invoice->update([
                    'payment_status' => $isSuccess ? 'paid' : 'failed',
                    'status' => $isSuccess ? 'paid' : 'pending',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => $isSuccess ? 'Payment successful' : 'Payment status updated',
        ]);
    }
}
