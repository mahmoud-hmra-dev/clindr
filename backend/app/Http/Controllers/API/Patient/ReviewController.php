<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $patientId = $request->user()->patient?->id;
        abort_unless($patientId, 403);

        $reviews = Review::with(['doctor', 'patient'])
            ->where('patient_id', $patientId)
            ->latest()
            ->paginate($request->get('per_page', 15));

        return ReviewResource::collection($reviews);
    }
}
