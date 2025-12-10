<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Paymet Gateway</title>
    <script src="{{ asset('js/manifest.js') }}" ></script>
    <script @isset($is_react) @if($is_react) defer @endif @endisset src="{{ asset('js/vendor.js') }}" ></script>
    <script src="{{ asset('js/app.js') }}" ></script>

    <script src="https://www.gstatic.com/firebasejs/5.5.9/firebase.js"></script>
    <script src="https://www.gstatic.com/firebasejs/5.5.9/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/5.5.9/firebase-messaging.js"></script>
    <script src="https://www.gstatic.com/firebasejs/5.5.9/firebase.js"></script>

    <script>
        const _token = '{{csrf_token()}}';
        const BASE_URL = '{{url('')}}' + '/';
    </script>
    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.gstatic.com">

    <link href="{{asset('font/Fredoka-Regular.ttf')}}" rel="stylesheet">

    <!-- Styles -->
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <link href="{{ asset('css/main.css') }}" rel="stylesheet">
    <link href="{{ asset('css/dashboard.css') }}" rel="stylesheet">
    <link href="{{ asset('css/register.css') }}" rel="stylesheet">
    <link href="{{ asset('css/doctors.css') }}" rel="stylesheet">
    <link href="{{ asset('css/contact.css') }}" rel="stylesheet">
    @stack('extra_styles')
</head>
<body class="bg-body" style="background-image: url('{{ asset('images/bg.jpg')}}'); background-attachment: fixed, scroll ; background-size:cover; ">
    <div id="app" >


        <main class="pt-5 mt-2 pb-5" >
            @yield('content')
        </main>

    </div>
    @stack('extra_scripts')
</body>

</html>
