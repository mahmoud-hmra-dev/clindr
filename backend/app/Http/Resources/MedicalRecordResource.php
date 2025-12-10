<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicalRecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'dependent_id' => $this->dependent_id,
            'doctor_id' => $this->doctor_id,
            'appointment_id' => $this->appointment_id,
            'record_type' => $this->record_type,
            'title' => $this->title,
            'recorded_at' => optional($this->recorded_at)->toIso8601String(),
            'comments' => $this->comments,
            'file_url' => $this->file_url,
        ];
    }
}
