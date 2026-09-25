import type { Plan, Rol, Usuario } from '../store/authStore'

// Catálogo de planes que ve el usuario (nombres, precios, beneficios).
// Los límites que se hacen cumplir de verdad están en el backend
// (src/modules/planes/planes.config.js): si cambiás un límite, cambialo en los dos lados.

export type Periodo = 'MENSUAL' | 'ANUAL'

export type InfoPlan = {
  id:            Plan
  nombre:        string
  precioMensual: number   // en US$
  lema:          string
  ico:           string
  beneficios:    string[]
  destacado?:    boolean  // se muestra como "Más elegido"
}

export const PLANES: Record<Rol, InfoPlan[]> = {
  PROVEEDOR: [
    {
      id: 'GRATIS', nombre: 'Gratis', precioMensual: 0, ico: '🌱',
      lema: 'Para empezar a recibir pedidos',
      beneficios: [
        'Hasta 3 servicios publicados, con fotos',
        'Aparecés en la búsqueda y el mapa',
        'Pedidos, cobros protegidos, chat y reseñas',
      ],
    },
    {
      id: 'PRO', nombre: 'Pro', precioMensual: 5, ico: '🚀',
      lema: 'Para el que trabaja solo y quiere más clientes',
      beneficios: [
        'Hasta 10 servicios publicados',
        'Insignia "Pro" en tu perfil y tarjetas',
        'Aparecés antes que los perfiles Gratis en la búsqueda',
        'Estadísticas del mes: visitas a tu perfil y pedidos',
      ],
    },
    {
      id: 'PREMIUM', nombre: 'Premium', precioMensual: 12, ico: '👑', destacado: true,
      lema: 'Para el profesional que quiere destacarse',
      beneficios: [
        'Todo lo del plan Pro',
        'Servicios ilimitados',
        'Insignia dorada "Premium"',
        'Primero en la búsqueda, en "Recomendados" y pin dorado en el mapa',
        'Estadísticas de 6 meses: pedidos, tiempo de respuesta y calificación',
        'Respuestas rápidas propias en el chat',
        'Soporte prioritario',
      ],
    },
  ],
  CLIENTE: [
    {
      id: 'GRATIS', nombre: 'Gratis', precioMensual: 0, ico: '🏠',
      lema: 'Todo lo básico, sin límites',
      beneficios: [
        'Buscar con filtros y contratar servicios',
        'Favoritos, chat y reseñas',
        'Pago protegido hasta que confirmás el trabajo',
      ],
    },
    {
      id: 'PLUS', nombre: 'Vecino Plus', precioMensual: 2, ico: '✨',
      lema: 'Tus proveedores de confianza, a un toque',
      beneficios: [
        'Repetir un pedido con un toque',
        'Aviso cuando un favorito vuelve a estar disponible',
        'Insignia "Plus" visible para los proveedores',
      ],
    },
    {
      id: 'PREMIUM', nombre: 'Vecino Premium', precioMensual: 5, ico: '💎', destacado: true,
      lema: 'Para cuando no podés esperar',
      beneficios: [
        'Todo lo de Vecino Plus',
        'Pedidos urgentes ⚡ resaltados para el proveedor',
        'Tus pedidos aparecen primero en el panel del proveedor',
        'Pedí presupuesto a hasta 3 proveedores a la vez',
        'Soporte prioritario',
      ],
    },
  ],
}

// Mismos límites que el backend (solo para mostrarlos en la app)
export const MAX_SERVICIOS: Record<string, number> = { GRATIS: 3, PRO: 10, PREMIUM: Infinity }

export const MAX_PRESUPUESTOS_EXTRA = 2

// Pagando por año se lleva 2 meses gratis
export function precioPlan(info: InfoPlan, periodo: Periodo) {
  return periodo === 'ANUAL' ? info.precioMensual * 10 : info.precioMensual
}

// El plan guardado solo cuenta mientras no venció (el backend aplica la misma regla)
export function planVigente(usuario?: Pick<Usuario, 'plan' | 'planVenceEn'> | null): Plan {
  const plan = usuario?.plan ?? 'GRATIS'
  if (plan === 'GRATIS') return 'GRATIS'
  // Si no vino la fecha (perfil de otro usuario), el backend ya mandó el plan vigente
  if (usuario?.planVenceEn === undefined) return plan
  if (!usuario.planVenceEn || new Date(usuario.planVenceEn) <= new Date()) return 'GRATIS'
  return plan
}

// 0 = Gratis, 1 = Pro / Plus, 2 = Premium
export function nivelPlan(plan?: Plan | null) {
  if (plan === 'PREMIUM') return 2
  if (plan === 'PRO' || plan === 'PLUS') return 1
  return 0
}

export function infoPlan(rol: Rol, plan: Plan): InfoPlan {
  return PLANES[rol].find(p => p.id === plan) ?? PLANES[rol][0]
}

export function formatearPrecio(usd: number) {
  return `US$ ${usd.toLocaleString('es-AR')}`
}
