<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;

Broadcast::channel('conversation.{id}', function ($user, $id) {
    $conversation = Conversation::find($id);
    if (! $conversation) {
        return false;
    }
    $doctorId = $user->doctor->id ?? null;
    $patientId = $user->patient->id ?? null;

    return $conversation->doctor_id === $doctorId || $conversation->patient_id === $patientId;
});
