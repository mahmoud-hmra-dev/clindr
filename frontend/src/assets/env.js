// Runtime environment variables for the Angular app.
// Copy your values from .env or .env.example here. This file is loaded before Angular boots.
// get env variables from env file in root folder
function env(key, defaultValue) {
  return window && window.__env && window.__env[key] ? window.__env[key] : defaultValue;
}
window.__env = {
  production: false,
  apiBaseUrl: env('apiBaseUrl', 'https://clindr-api.hdf.usj.edu.lb/api'),
  baseurl: env('baseurl', 'https://clindrv2.hdf.usj.edu.lb'),
  hopePaymentUrl: env('hopePaymentUrl', 'https://clindr-payment.hdf.usj.edu.lb/api/makeHash'),
  paymenturl:  env('paymenturl', 'https://clindr-payment.hdf.usj.edu.lb'),
  hopePaymentProjectId: env('hopePaymentProjectId', '4d2ff084-1afd-4c6a-b2e7-6e8de34bd6c8'),
  hopePaymentProjectName: env('hopePaymentProjectName', 'clindoctor_test'),
  hopePaymentCurrency: env('hopePaymentCurrency', 'USD'),
  websocketUrl: env('websocketUrl', 'ws://localhost:6001'),
  websocketPort: env('websocketPort', 6001),
  onlineMeetingApiUrl: env('onlineMeetingApiUrl', 'https://clindr-call.hdf.usj.edu.lb')
};
