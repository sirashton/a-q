/// <reference types="@capacitor/cli" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.a_q',
  appName: 'Advices and Queries',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#B33062",
      sound: "beep.wav"
    }
  }
};

export default config;
