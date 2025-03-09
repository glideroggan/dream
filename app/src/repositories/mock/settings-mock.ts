import { UserSettings } from "../settings-repository";

export const defaultSettings: UserSettings = {
  id: "default-settings",
  theme: "light",
  language: "en",
  enableNotifications: true,
  paymentContacts: [],
  widgetLayout: {},
  autoAddedProducts: {}
};
