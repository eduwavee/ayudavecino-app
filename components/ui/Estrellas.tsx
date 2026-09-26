import { View, StyleSheet } from 'react-native'
import { Icono } from './Icono'

// Calificación de 0 a 5 con medias estrellas. Las vacías quedan en contorno para que
// "3 de 5" se lea de un vistazo (antes se repetía el emoji ⭐ y no había escala).
export function Estrellas({ valor, tamano = 14, color = '#F5B301' }: { valor: number; tamano?: number; color?: string }) {
  const redondeado = Math.round(valor * 2) / 2
  return (
    <View style={styles.fila} accessible accessibilityLabel={`${redondeado} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icono
          key={i}
          nombre={redondeado >= i ? 'star' : redondeado >= i - 0.5 ? 'star-half' : 'star-outline'}
          tamano={tamano}
          color={color}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 1 },
})
