<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;

class InvoiceController extends Controller
{
    public function index()
    {
        return InvoiceResource::collection(Invoice::paginate(25));
    }

    public function show(Invoice $invoice)
    {
        return new InvoiceResource($invoice);
    }
}
