import { useEffect, useState } from 'react'
import { Text, TextProps } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { DURACION } from '../../constants/diseno'

// power3.out aplicado al conteo: sube rápido y se asienta despacio en el valor final
const power3Out = (t: number) => 1 - Math.pow(1 - t, 3)

// Número que cuenta desde 0 hasta `valor` (ej. estadísticas de Inicio).
// Con "reducir movimiento" muestra el valor final directamente.
export function ContadorAnimado({
  valor,
  prefijo = '',
  sufijo = '',
  duracion = DURACION.lenta + 300,
  ...props
}: TextProps & { valor: number | null | undefined; prefijo?: string; sufijo?: string; duracion?: number }) {
  const reducirMovimiento = useReducedMotion()
  const [mostrado, setMostrado] = useState(0)

  useEffect(() => {
    if (valor == null) return
    if (reducirMovimiento || valor === 0) { setMostrado(valor); return }

    let frame: number
    const inicio = Date.now()
    const tick = () => {
      const t = Math.min((Date.now() - inicio) / duracion, 1)
      setMostrado(Math.round(valor * power3Out(t)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [valor, reducirMovimiento])

  return (
    <Text {...props}>
      {valor == null ? '—' : prefijo + mostrado.toLocaleString('es-AR') + sufijo}
    </Text>
  )
}
