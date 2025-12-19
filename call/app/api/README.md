![restAPI](restAPI.png)

## Create a Visit

To initiate a doctor–patient visit, send an HTTP request to the Clindoctor Call server with your API key. Replace the default secret key in `.env` with your own.

```bash
API_KEY_SECRET=mirotalkp2p_default_secret
```

Use the following examples to make API calls:

```bash
# Node.js
node meeting.js
node join.js
node token.js

# PHP
php meeting.php
php join.php
php token.php

# Python
python3 meeting.py
python3 join.py
python3 token.py # rename token in something else

# Bash
./meeting.sh
./join.sh
./token.sh
```

The server response will contain a meeting URL that can be embedded in your client using an iframe.

---

## Embed a Visit

To embed a visit in your service or app, use an iframe with the source attribute set to the visit URL obtained from the HTTP response.

```html
<iframe
    allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; web-share; autoplay"
    src="https://your-clindoctor-call-domain/join/test"
    style="height: 100vh; width: 100vw; border: 0px;"
></iframe>
```

---

## Fast Integration

Integrate video visits into your website or application quickly by incorporating the following iframe code:

```html
<iframe
    allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; web-share; autoplay"
    src="https://your-clindoctor-call-domain/newcall"
    style="height: 100vh; width: 100vw; border: 0px;"
></iframe>
```
