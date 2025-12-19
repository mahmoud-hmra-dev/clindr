<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    public function doctorServices()
    {
        return $this->hasMany(DoctorService::class);
    }
    public function services()
    {
        return $this->doctorServices();
    }
}
