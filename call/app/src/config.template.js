'use strict';

/**
 * ==============================================
 * ClindoctorCall v.1.6.88 - Configuration File
 * ==============================================
 *
 * Branding and customizations require a license:
 * https://codecanyon.net/item/mirotalk-p2p-webrtc-realtime-video-conferences/38376661
 */

const packageJson = require('../../package.json');

module.exports = {
    brand: {
        htmlInjection: true,
        app: {
            language: 'en', // https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
            name: 'ClindoctorCall',
            title: '<h1>ClindoctorCall</h1>Free browser based Real-time video calls.<br />Simple, Secure, Fast.',
            description:
                'Start your next video call with a single click. No download, plug-in, or login is required. Just get straight to talking, messaging, and sharing your screen.',
            joinDescription: 'Pick a room name.<br />How about this one?',
            joinButtonLabel: 'JOIN ROOM',
            joinLastLabel: 'Your recent room:',
        },
        og: {
            type: 'app-webrtc',
            siteName: 'ClindoctorCall',
            title: 'Click the link to make a call.',
            description:
                'ClindoctorCall provides real-time HD quality and latency simply not available with traditional technology.',
            image: 'https://clindoctor.call/assets/preview.png',
            url: 'https://clindoctor.call',
        },
        site: {
            shortcutIcon: '../images/clindoctor-logo.png',
            appleTouchIcon: '../images/clindoctor-logo.png',
            landingTitle: 'ClindoctorCall a Free Secure Video Calls, Chat & Screen Sharing.',
            newCallTitle: 'ClindoctorCall a Free Secure Video Calls, Chat & Screen Sharing.',
            newCallRoomTitle: 'Pick name. <br />Share URL. <br />Start conference.',
            newCallRoomDescription:
                "Each room has its disposable URL. Just pick a room name and share your custom URL. It's that easy.",
            loginTitle: 'ClindoctorCall - Host Protected login required.',
            clientTitle: 'ClindoctorCall WebRTC Video call, Chat Room & Screen Sharing.',
            privacyPolicyTitle: 'ClindoctorCall - privacy and policy.',
            stunTurnTitle: 'Test Stun/Turn Servers.',
            notFoundTitle: 'ClindoctorCall - 404 Page not found.',
        },
        html: {
            topSponsors: false,
            features: false,
            browsers: false,
            teams: false, // please keep me always true ;)
            tryEasier: false,
            poweredBy: false,
            sponsors: false,
            advertisers: false,
            supportUs: false,
            footer: false,
        },
        about: {
            imageUrl: '../images/clindoctor-logo.png',
            title: `WebRTC P2P v${packageJson.version}`,
            html: `
                <button 
                    id="support-button" 
                    data-umami-event="Support button" 
                    onclick="window.open('https://clindoctor.call')">
                    <i class="fas fa-heart" ></i>&nbsp;Support
                </button>
                <br /><br /><br />
                Author:<a 
                    id="linkedin-button" 
                    data-umami-event="Linkedin button" 
                    href="https://clindoctor.call" target="_blank"> 
                    Clindoctor Team
                </a>
                <br />
                Email:<a 
                    id="email-button" 
                    data-umami-event="Email button" 
                    href="mailto:support@clindoctor.call?subject=ClindoctorCall info"> 
                    support@clindoctor.call
                </a>
                <br /><br />
                <hr />
                <span>&copy; 2025 ClindoctorCall, all rights reserved</span>
                <hr />
            `,
        },
        // https://docs.mirotalk.com/mirotalk-p2p/integration/#widgets-integration
        widget: {
            enabled: false,
            roomId: 'support-room',
            theme: 'dark',
            widgetState: 'minimized',
            widgetType: 'support',
            supportWidget: {
                position: 'top-right',
                expertImages: [
                    'https://photo.cloudron.pocketsolution.net/uploads/original/95/7d/a5f7f7a2c89a5fee7affda5f013c.jpeg',
                ],
                buttons: {
                    audio: true,
                    video: true,
                    screen: true,
                    chat: true,
                    join: true,
                },
                checkOnlineStatus: false,
                isOnline: true,
                customMessages: {
                    heading: 'Need Help?',
                    subheading: 'Get instant support from our expert team!',
                    connectText: 'connect in < 5 seconds',
                    onlineText: 'We are online',
                    offlineText: 'We are offline',
                    poweredBy: 'Powered by ClindoctorCall',
                },
            },
        },
        //...
    },
    /**
     * Configuration for controlling the visibility of buttons in the ClindoctorCall client.
     * Set properties to true to show the corresponding buttons, or false to hide them.
     * captionBtn, showSwapCameraBtn, showScreenShareBtn, showFullScreenBtn, showVideoPipBtn, showDocumentPipBtn -> (auto-detected).
     */
    buttons: {
        main: {
            showShareQr: true,
            showShareRoomBtn: true, // For guests
            showHideMeBtn: true,
            showFullScreenBtn: true,
            showAudioBtn: true,
            showVideoBtn: true,
            showScreenBtn: true, // autodetected
            showRecordStreamBtn: true,
            showChatRoomBtn: true,
            showParticipantsBtn: true,
            showCaptionRoomBtn: true,
            showRoomEmojiPickerBtn: true,
            showMyHandBtn: true,
            showWhiteboardBtn: true,
            showSnapshotRoomBtn: true,
            showFileShareBtn: true,
            showDocumentPipBtn: true,
            showMySettingsBtn: true,
            showAboutBtn: true, // Please keep me always true, Thank you!
            showExtraBtn: true,
        },
        chat: {
            showTogglePinBtn: true,
            showMaxBtn: true,
            showSaveMessageBtn: true,
            showMarkDownBtn: true,
            showChatGPTBtn: false,
            showFileShareBtn: true,
            showShareVideoAudioBtn: true,
            showParticipantsBtn: true,
        },
        caption: {
            showTogglePinBtn: true,
            showMaxBtn: true,
        },
        settings: {
            showActiveRoomsBtn: true,
            showMicOptionsBtn: true,
            showTabRoomPeerName: true,
            showTabRoomParticipants: true,
            showTabRoomSecurity: true,
            showTabEmailInvitation: true,
            showCaptionEveryoneBtn: true,
            showMuteEveryoneBtn: true,
            showHideEveryoneBtn: true,
            showEjectEveryoneBtn: true,
            showLockRoomBtn: true,
            showUnlockRoomBtn: true,
            showShortcutsBtn: true,
            customNoiseSuppression: true,
        },
        remote: {
            showAudioVolume: true,
            audioBtnClickAllowed: true,
            videoBtnClickAllowed: true,
            showVideoPipBtn: true,
            showKickOutBtn: true,
            showSnapShotBtn: true,
            showFileShareBtn: true,
            showShareVideoAudioBtn: true,
            showGeoLocationBtn: true,
            showPrivateMessageBtn: true,
            showZoomInOutBtn: true,
            showVideoFocusBtn: true,
        },
        local: {
            showVideoPipBtn: true,
            showSnapShotBtn: true,
            showVideoCircleBtn: true,
            showZoomInOutBtn: true,
            showVideoFocusBtn: true,
        },
        whiteboard: {
            whiteboardLockBtn: false,
        },
    },
    webhook: {
        enabled: false, // Enable webhook functionality
        url: 'http://localhost:8888/webhook-endpoint', // Webhook server URL
    },
};

