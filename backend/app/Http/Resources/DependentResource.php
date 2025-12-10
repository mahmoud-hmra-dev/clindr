<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DependentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'name' => $this->name,
            'gender' => $this->gender,
            'relationship' => $this->relationship,
            'phone' => $this->phone,
            'email' => $this->email,
            'blood_group' => $this->blood_group,
            'dob' => optional($this->dob)->toDateString(),
            'is_active' => $this->is_active,
        ];
    }
}
