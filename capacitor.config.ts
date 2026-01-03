import { CapacitorConfig } from '@capacitor/cli';
import { LIVE_UPDATE_ENABLED } from './config/live-update';

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
    },
    ...(LIVE_UPDATE_ENABLED && {
      LiveUpdate: {
        appId: '58f13a06-ae85-4441-a884-6852ae61bec3',
      }
    })
  }
};

export default config;
