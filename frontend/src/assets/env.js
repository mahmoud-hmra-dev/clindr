// Runtime environment variables for the Angular app.
// Copy your values from .env or .env.example here. This file is loaded before Angular boots.
// get env variables from env file in root folder
function env(key, defaultValue) {
  return window && window.__env && window.__env[key] ? window.__env[key] : defaultValue;
}
window.__env = {
  production: env('production', false),
  apiBaseUrl: env('apiBaseUrl', 'https://api.clindoctor.net/api'),
  baseurl: env('baseurl', 'https://hospital.clindoctor.net'),
  hopePaymentUrl: env('hopePaymentUrl', 'https://payment.clindoctor.net/api/makeHash'),
  paymenturl: env('paymenturl', 'https://payment.clindoctor.net'),
  hopePaymentProjectId: env('hopePaymentProjectId', '4d2ff084-1afd-4c6a-b2e7-6e8de34bd6c8'),
  hopePaymentProjectName: env('hopePaymentProjectName', 'clindoctor_test'),
  hopePaymentCurrency: env('hopePaymentCurrency', 'USD'),
  websocketUrl: env('websocketUrl', 'ws://localhost:6001'),
  websocketPort: env('websocketPort', 6001),
  onlineMeetingApiUrl: env('onlineMeetingApiUrl', 'https://call.clindoctor.net'),
  onlineMeetingApiSecret: env('onlineMeetingApiSecret', '')
};
