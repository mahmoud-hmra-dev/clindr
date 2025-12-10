@extends('layouts.app')

@section('content')



<script>
    $(window).on('load', function() {
        let desc = localStorage.getItem('describe_status')
        if(desc) {
            $('#patient_before_call_message').val(desc);
            localStorage.removeItem('describe_status');
        }
        if(window.innerWidth < 1340){
            $('#card').removeClass('w-50');
        }
    })
</script>
@endsection

@push('extra_scripts')
    <script src="https://epayment.areeba.com/checkout/version/60/checkout.js"
            data-error="errorCallback"
            data-cancel="cancelCallback"
            data-complete="{{route("successCallback",['data'=>$payment_details ,'order_id'=>$call_id,])}}">
    </script>

    <script type="text/javascript">
        function errorCallback(error) {
            location.href = "{{route("errorCallback",['data'=>$payment_details ,'order_id'=>$call_id])}}";
        }
        function cancelCallback() {
            location.href = "{{route("cancelCallback",['data'=>$payment_details ,'order_id'=>$call_id])}}";
        }
        $(function () {
            let configs = {
                merchant:"TEST222206160001",
                session: {
                    id: "{{$session_id}}"
                },
                order: {
                    description: 'pay call #{{$call_id}}',
                    id: '{{$call_id}}',
                    amount: "{{$price}}",
                    currency: 'USD',
                },
                interaction: {
                    operation: "PURCHASE",
                    merchant: {
                        name: '{{$decodedData->project_name}}',
                        address: {
                            line1: 'HIDE',
                            line2: 'HIDE'
                        }
                    }
                    ,
                    displayControl: {
                        billingAddress: 'HIDE',
                        customerEmail: 'HIDE',
                        shipping: 'HIDE'
                    }
                }
            }
            Checkout.configure(configs);
            Checkout.showLightbox();
        })
    </script>
@endpush
