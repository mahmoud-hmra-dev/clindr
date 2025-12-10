<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doctor_id' => $this->doctor_id,
            'patient_id' => $this->patient_id,
            'last_message_at' => optional($this->last_message_at)->toIso8601String(),
            'pinned_by' => $this->pinned_by,
            'unread_doctor' => $this->unread_doctor,
            'unread_patient' => $this->unread_patient,
        ];
    }
}
