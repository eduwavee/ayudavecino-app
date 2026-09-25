import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import { planVigente, nivelPlan, infoPlan } from '../constants/planes'

// Plan vigente del usuario logueado + helpers para ofrecer "Mejorar plan"
// cuando toca algo que su plan no incluye.
export function usePlan() {
  const usuario = useAuthStore(s => s.usuario)
  const router  = useRouter()
  const plan    = planVigente(usuario)
  const rol     = usuario?.rol ?? 'CLIENTE'

  function pedirMejora(mensaje: string) {
    Alert.alert('Mejorá tu plan', mensaje, [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Ver planes', onPress: () => router.push('/planes') },
    ])
  }

  // Si el backend rechazó algo por el plan (codigo PLAN_REQUERIDO) ofrece mejorar;
  // si no, muestra el error normal. Devuelve true si era un error de plan.
  function manejarError(err: any, mensajePorDefecto: string) {
    const data = err?.response?.data
    if (data?.codigo === 'PLAN_REQUERIDO') {
      pedirMejora(data.mensaje)
      return true
    }
    Alert.alert('Error', data?.mensaje || mensajePorDefecto)
    return false
  }

  return {
    plan,
    rol,
    nivel:      nivelPlan(plan),
    esPremium:  plan === 'PREMIUM',
    info:       infoPlan(rol, plan),
    venceEn:    plan !== 'GRATIS' && usuario?.planVenceEn ? new Date(usuario.planVenceEn) : null,
    pedirMejora,
    manejarError,
  }
}
