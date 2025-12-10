<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'body' => $this->body,
            'message_type' => $this->message_type,
            'attachment_url' => $this->attachment_url,
            'sent_at' => optional($this->sent_at)->toIso8601String(),
            'status' => $this->status,
            'reply_to_id' => $this->reply_to_id,
            'metadata_json' => $this->metadata_json,
        ];
    }
}
