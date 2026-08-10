const googleMapsApiKeyAndroid = process.env.GOOGLE_MAPS_API_KEY_ANDROID

if (!googleMapsApiKeyAndroid) {
  console.warn(
    '⚠️  Falta GOOGLE_MAPS_API_KEY_ANDROID en tu .env — el mapa no va a renderizar en Android.\n' +
    '   Copiá .env.example a .env y completá la key (ver README / Google Cloud Console).'
  )
}

export default {
  expo: {
    name: 'ayudavecino-app',
    slug: 'ayudavecino-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKeyAndroid ?? '',
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'AyudaVecino usa tu ubicación para mostrarte proveedores y servicios cercanos.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'AyudaVecino usa tus fotos para que elijas una imagen de perfil.',
          cameraPermission: 'AyudaVecino usa la cámara para sacarte una foto de perfil.',
        },
      ],
    ],
  },
}
