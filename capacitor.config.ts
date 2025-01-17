import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'camera',
  webDir: 'dist',
  "plugins": {
    "Camera": {
      "requestPermissions": true
    }
  }
};

export default config;
