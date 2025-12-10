<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\AreebaPaymentService;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\Crypt;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Redirect;


class PaymentController extends Controller
{


    private $payment_service;

    public function __construct(AreebaPaymentService $payment_service)
    {
        $this->payment_service = $payment_service;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $payments = Payment::all();
        return response()->json($payments);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }


    // make hash for payment
public function makeHash(Request $request){
    $payment_details = $request->all();
    $project_id = $payment_details['project_id'];

    if(!Project::where('uuid', $project_id)->exists()){
        return response()->json(['error' => 'project id is not valid'], 400);
    }

    $jsonEncodedData = json_encode($payment_details, JSON_UNESCAPED_SLASHES);
    $base64EncodedData = base64_encode($jsonEncodedData);

    $app_url = URL::to('/');
    $paymentUrl = $app_url . '/payment?p='.$base64EncodedData;

    $paymentUrl = str_replace(['\/', '\\/'], '/', $paymentUrl);

    return response($paymentUrl, 200)
        ->header('Content-Type', 'text/plain');
}






    public function makePayment(Request $request)
    {
        // $data = [
        //     "project_id" => "0da51640-f357-46aa-83cb-a1c8aa59f1fb",
        //     "project_name" => "test",
        //     "prodact_id" => "123",
        //     "user_id" => "123",
        //     "firstName" => "mahmoud",
        //     "lastName" => "ahmed",
        //     "email" => "bqXnT@example.com",
        //     "price" => "100",
        //     "currency" => "USD",
        //     "errorCallback" => "https://example.com",
        //     "successCallback" => "https://example.com",
        //     "cancelCallback" => "https://example.com",
        // ];
        //  $jsonEncodedData = json_encode($data);
        //  $base64EncodedData = base64_encode($jsonEncodedData);
		$payment_details = $request->input('p');
        $order= base64_decode($request->input('p'));
        $decodedData = json_decode($order);
        $price = $decodedData->price;
        $call_id = Str::uuid()->toString();
        $data = $this->payment_service->generateSessionId($call_id,$price);
        if($data){
            $session_id = $data['session_id'];
            $call_id = $data['order_id'];
            $price = $data['price'];
            return view('pages.booking.payment', compact(['session_id' ,'call_id','price', 'decodedData','payment_details']));
        } else {
            return  view('pages.booking.payment_failed');
        }
    }

    public function cancelCallback(Request $request) {
        $input = $request->all();
        $order_id = $input['amp;order_id'];
        $data = $input['data'];
        $order= base64_decode($data);
        $decodedData = json_decode($order);
        $payment = Payment::create([
            'project_id' => $decodedData->project_id,
            'project_name' => $decodedData->project_name,
            'prodact_id' => $decodedData->prodact_id,
            'user_id' => $decodedData->user_id,
            'firstName' => $decodedData->firstName,
            'lastName' => $decodedData->lastName,
            'email' => $decodedData->email,
            'price' => $decodedData->price,
            'currency' => $decodedData->currency,
            'errorCallback' => $decodedData->errorCallback,
            'successCallback' => $decodedData->successCallback,
            'cancelCallback' => $decodedData->cancelCallback,
            'order_id' => $order_id,
            'status' => 'cancelled'
        ]);
        $additionalParameters = [
            'order_id' => $order_id,
            'status' => 'cancelled',
        ];

        // Inject parameters directly into the URL
        $redirectUrl = $this->buildRedirectUrl($decodedData->cancelCallback, $additionalParameters);

        return Redirect::to($redirectUrl);

    }
    public function errorCallback(Request $request) {
        $input = $request->all();
        $order_id = $input['amp;order_id'];
        $data = $input['data'];
        $order= base64_decode($data);
        $decodedData = json_decode($order);
        $payment = Payment::create([
            'project_id' => $decodedData->project_id,
            'project_name' => $decodedData->project_name,
            'prodact_id' => $decodedData->prodact_id,
            'user_id' => $decodedData->user_id,
            'firstName' => $decodedData->firstName,
            'lastName' => $decodedData->lastName,
            'email' => $decodedData->email,
            'price' => $decodedData->price,
            'currency' => $decodedData->currency,
            'errorCallback' => $decodedData->errorCallback,
            'successCallback' => $decodedData->successCallback,
            'cancelCallback' => $decodedData->cancelCallback,
            'order_id' => $order_id,
            'status' => 'failed'
        ]);
        $additionalParameters = [
            'order_id' => $order_id,
            'status' => 'failed',
        ];

        // Inject parameters directly into the URL
        $redirectUrl = $this->buildRedirectUrl($decodedData->errorCallback, $additionalParameters);

        return Redirect::to($redirectUrl);
    }

    public function successCallback(Request $request) {
        $input = $request->all();
        $order_id = $input['order_id'];
        $data = $input['data'];
        $order= base64_decode($data);
        $decodedData = json_decode($order);
        $payment = Payment::create([
            'project_id' => $decodedData->project_id,
            'project_name' => $decodedData->project_name,
            'prodact_id' => $decodedData->prodact_id,
            'user_id' => $decodedData->user_id,
            'firstName' => $decodedData->firstName,
            'lastName' => $decodedData->lastName,
            'email' => $decodedData->email,
            'price' => $decodedData->price,
            'currency' => $decodedData->currency,
            'errorCallback' => $decodedData->errorCallback,
            'successCallback' => $decodedData->successCallback,
            'cancelCallback' => $decodedData->cancelCallback,
            'order_id' => $order_id,
            'status' => "paid"
        ]);

        $additionalParameters = [
            'order_id' => $order_id,
            'status' => 'paid',
        ];

        // Inject parameters directly into the URL
        $redirectUrl = $this->buildRedirectUrl($decodedData->successCallback, $additionalParameters);

        return Redirect::to($redirectUrl);

    }

    public function paymentComplete(Request $request)
    {
        $call_id = $request->order_id;
        $data = $this->payment_service->getPaymentResult($call_id);
        if($data){
            // return redirect()->route('patient_appointments');
        } else {
            return  view('pages.booking.payment_failed');
        }
    }


    private function buildRedirectUrl($baseUrl, $parameters)
    {
        if (strpos($baseUrl, '?') !== false) {
            return $baseUrl . '&' . http_build_query($parameters);
        } else {
            return $baseUrl . '?' . http_build_query($parameters);
        }
    }
}
