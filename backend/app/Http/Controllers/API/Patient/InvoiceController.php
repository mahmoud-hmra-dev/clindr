<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::query()
            ->where('patient_id', $request->user()->patient?->id)
            ->latest()
            ->paginate(15);

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, Invoice $invoice)
    {
        abort_unless($invoice->patient_id === $request->user()->patient?->id, 403);

        return new InvoiceResource($invoice);
    }
}
