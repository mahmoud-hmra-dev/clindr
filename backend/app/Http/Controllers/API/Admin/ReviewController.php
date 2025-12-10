<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $reviews = Review::with(['doctor.user', 'patient.user'])
            ->latest()
            ->paginate($request->get('per_page', 15));

        return ReviewResource::collection($reviews);
    }
}
