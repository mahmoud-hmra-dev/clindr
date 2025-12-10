<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $reviews = Review::query()
            ->where('doctor_id', $request->user()->doctor?->id)
            ->latest()
            ->paginate(15);

        return ReviewResource::collection($reviews);
    }
}
