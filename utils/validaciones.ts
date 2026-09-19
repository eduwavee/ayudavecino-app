// Reglas de credenciales, las mismas que valida el backend
// (src/modules/auth/reglas.js) — mantener en sync.
export const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^[a-z0-9_.]{6,20}$/
export const PASSWORD_REGEX = /^(?=.*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ])(?=.*\d).{8,}$/

export const MENSAJE_USERNAME = 'El usuario debe tener entre 6 y 20 caracteres: letras, números, punto o guion bajo'
export const MENSAJE_PASSWORD = 'La contraseña debe tener al menos 8 caracteres, con al menos una letra y un número'
