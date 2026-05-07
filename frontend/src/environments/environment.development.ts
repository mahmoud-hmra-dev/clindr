const globalEnv: any = (window as any).__env || {};

const env = <T>(key: string, fallback: T): T => {
  const val = globalEnv[key];
  if (typeof fallback === 'boolean') {
    if (val === 'true' || val === true) return true as T;
    if (val === 'false' || val === false) return false as T;
  }
  return (val ?? fallback) as T;
};

export const environment = {
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
