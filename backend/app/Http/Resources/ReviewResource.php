<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
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
            'rating' => $this->rating,
            'comment' => $this->comment,
            'reply_user_id' => $this->reply_user_id,
            'reply_text' => $this->reply_text,
            'reply_at' => optional($this->reply_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'doctor_name' => $this->doctor?->display_name ?? trim(($this->doctor?->first_name ?? '') . ' ' . ($this->doctor?->last_name ?? '')),
            'patient_name' => $this->patient?->user?->name ?? '',
        ];
    }
}
