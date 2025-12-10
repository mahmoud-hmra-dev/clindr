<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VitalResource extends JsonResource
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
            'blood_pressure' => $this->blood_pressure,
            'heart_rate' => $this->heart_rate,
            'glucose_level' => $this->glucose_level,
            'body_temperature' => $this->body_temperature,
            'bmi' => $this->bmi,
            'spo2' => $this->spo2,
            'weight' => $this->weight,
            'fbc_status' => $this->fbc_status,
            'recorded_at' => optional($this->recorded_at)->toIso8601String(),
            'recorded_by' => $this->recorded_by,
        ];
    }
}
