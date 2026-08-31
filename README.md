# AyudaVecino — App (React Native / Expo)

App movil de AyudaVecino, un marketplace que conecta vecinos con oficios y servicios locales (plomeros, electricistas, gasistas, etc.). Este repo es el frontend mobile; el backend (Node/Express/PostgreSQL/Prisma) vive en un repo aparte: [ayudavecino-backend](https://github.com/eduwavee/ayudavecino-backend).

## Funcionalidades

• Registro/login y onboarding en el primer arranque, con restauracion de sesion
• Navegacion por tabs
• Perfiles de proveedor con resenas y calificaciones
• Sistema de pedidos entre vecinos y prestadores de servicios
• Chat en tiempo real (Socket.io) con mensajes leidos (read receipts), envio de fotos y notificaciones globales de chat
• Notificaciones push
• Subida y visualizacion de foto de perfil (avatar)
• Modo oscuro persistente (Zustand)
• Pantallas de ajustes, cambio de contrasena y edicion de perfil

## Stack

• React Native + Expo (Expo Router)
• TypeScript
• NativeWind (Tailwind para React Native)
• Zustand (estado global)
• Socket.io-client (tiempo real)
• Axios
• React Navigation

## Como correrlo

npm install
cp .env.example .env
completar API_URL y SOCKET_URL apuntando a tu instancia de ayudavecino-backend
npx expo start

Necesita el backend corriendo (ver ayudavecino-backend: https://github.com/eduwavee/ayudavecino-backend) o las variables de entorno apuntando a una instancia ya desplegada.

Se puede abrir en un emulador Android/iOS o escaneando el QR con la app Expo Go.

## Notas

Proyecto personal desarrollado en solitario, full-stack junto con el backend. En desarrollo activo.
