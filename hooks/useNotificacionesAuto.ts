import { useEffect, useRef } from 'react'
import { notificacionesService } from '../services/notificaciones.service'
import { pedidosService } from '../services/pedidos.service'

export function useNotificacionesAuto(usuarioId: string | undefined) {
  const prevEstados = useRef<Record<string, string>>({})
  const intervalo   = useRef<any>(null)

  useEffect(() => {
    if (!usuarioId) return

    console.log('🔔 Iniciando polling...')

    intervalo.current = setInterval(async () => {
      try {
        const pedidos = await pedidosService.misPedidos()

        for (const pedido of pedidos) {
          const anterior = prevEstados.current[pedido.id]
          const actual   = pedido.estado

          if (!anterior) {
            prevEstados.current[pedido.id] = actual
            continue
          }

          if (anterior !== actual) {
            console.log('🚨 Cambio:', anterior, '→', actual)
            const msgs: Record<string, { titulo: string; cuerpo: string }> = {
              ACEPTADO:   { titulo:'✅ Pedido aceptado',    cuerpo:'El proveedor aceptó tu pedido' },
              EN_CURSO:   { titulo:'🔧 Trabajo en curso',   cuerpo:'El trabajo está en curso' },
              COMPLETADO: { titulo:'🎉 Trabajo completado', cuerpo:'Confirmá para liberar el pago' },
              CANCELADO:  { titulo:'❌ Pedido cancelado',   cuerpo:'El pedido fue cancelado' },
            }
            const msg = msgs[actual]
            if (msg) {
              await notificacionesService.mostrarLocal(msg.titulo, msg.cuerpo)
            }
            prevEstados.current[pedido.id] = actual
          }
        }
      } catch (e) {
        console.log('Error polling:', e)
      }
    }, 5000)

    return () => clearInterval(intervalo.current)
  }, [usuarioId])
}
