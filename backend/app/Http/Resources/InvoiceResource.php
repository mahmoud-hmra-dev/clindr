<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'doctor_id' => $this->doctor_id,
            'patient_id' => $this->patient_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'booked_on' => optional($this->booked_on)->toIso8601String(),
            'status' => $this->status,
            'due_date' => optional($this->due_date)->toDateString(),
            'pdf_url' => $this->pdf_url,
            'payment_status' => $this->payment_status,
            'payment_id' => $this->payment_id,
            'doctor' => $this->whenLoaded('doctor', function () {
                return [
                    'id' => $this->doctor->id,
                    'first_name' => $this->doctor->first_name,
                    'last_name' => $this->doctor->last_name,
                    'display_name' => $this->doctor->display_name,
                    'email' => $this->doctor->email,
                    'phone' => $this->doctor->phone,
                ];
            }),
            'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'first_name' => $this->patient->first_name,
                    'last_name' => $this->patient->last_name,
                    'email' => $this->patient->email,
                    'phone' => $this->patient->phone,
                ];
            }),
        ];
    }
}
