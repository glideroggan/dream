import { UserSettings } from '../settings-repository';

export const defaultSettings: UserSettings = {
  id: 'user-settings',
  theme: 'system',
  language: 'en',
  enableNotifications: true,
  dashboardLayout: [],
  savingsWidgets: [],
  investmentsWidgets: [],
  kycData: undefined,
  paymentContacts: [],
  widgetLayout: {},
};
