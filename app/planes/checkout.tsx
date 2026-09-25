import { useState } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { PLANES, Periodo, precioPlan, formatearPrecio } from '../../constants/planes'
import { useAuthStore, Plan } from '../../store/authStore'
import { useTema, TemaTokens } from '../../store/temaStore'
import { planesService } from '../../services/planes.service'
import { usePlan } from '../../hooks/usePlan'
import { FUENTES as F, HIT_SLOP } from '../../constants/diseno'
import { PressScale } from '../../components/ui/PressScale'
import { haptica } from '../../utils/haptica'

// Checkout de prueba: los datos de la tarjeta solo se validan en pantalla, nunca se
// guardan ni se mandan. El cobro lo hace el backend con la pasarela de pagos, que hoy
// es la simulada (la misma de los pedidos).

function formatearTarjeta(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}
function formatearVencimiento(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export default function CheckoutScreen() {
  const router = useRouter()
  const tema = useTema()
  const styles = getStyles(tema)
  const { token, setUsuario } = useAuthStore()
  const { rol, manejarError } = usePlan()
  const params = useLocalSearchParams<{ plan: Plan; periodo: Periodo }>()
  const periodo: Periodo = params.periodo === 'ANUAL' ? 'ANUAL' : 'MENSUAL'
  const info = PLANES[rol].find(p => p.id === params.plan)

  const [titular, setTitular]       = useState('')
  const [numero, setNumero]         = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [cvv, setCvv]               = useState('')
  const [pagando, setPagando]       = useState(false)
  const [listo, setListo]           = useState(false)

  if (!info || info.id === 'GRATIS') {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={styles.errorText}>Ese plan no está disponible para tu cuenta.</Text>
        <TouchableOpacity style={[styles.pagarBtn, { alignSelf: 'stretch', marginTop: 20 }]} onPress={() => router.back()}>
          <Text style={styles.pagarText}>Volver</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const precio = precioPlan(info, periodo)
  const vence = new Date()
  if (periodo === 'ANUAL') vence.setFullYear(vence.getFullYear() + 1)
  else vence.setMonth(vence.getMonth() + 1)

  const datosValidos =
    titular.trim().length >= 3 &&
    numero.replace(/\D/g, '').length === 16 &&
    /^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento) &&
    cvv.length >= 3

  async function pagar() {
    if (!datosValidos || !info) return
    setPagando(true)
    try {
      const usuario = await planesService.suscribir(info.id, periodo)
      setUsuario(usuario, token!)
      haptica.exito()
      setListo(true)
    } catch (err: any) {
      manejarError(err, 'No se pudo activar el plan')
    } finally {
      setPagando(false)
    }
  }

  function terminar() {
    // Vuelve a la pantalla desde donde se abrieron los planes (cierra checkout y planes)
    if (router.canDismiss()) router.dismiss(2)
    else router.replace(rol === 'PROVEEDOR' ? '/proveedor-panel' : '/(tabs)')
  }

  if (listo) {
    return (
      <View style={[styles.container, styles.exito]}>
        <View style={styles.exitoIcoWrap}><Text style={styles.exitoIco}>{info.ico}</Text></View>
        <Text style={styles.exitoTitulo}>¡Ya sos {info.nombre}!</Text>
        <Text style={styles.exitoSub}>
          Tu plan está activo hasta el {vence.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </Text>
        <View style={styles.exitoBeneficios}>
          {info.beneficios.slice(0, 4).map(b => (
            <Text key={b} style={styles.exitoBeneficio}>✓  {b}</Text>
          ))}
        </View>
        <TouchableOpacity style={[styles.pagarBtn, { alignSelf: 'stretch' }]} onPress={terminar}>
          <Text style={styles.pagarText}>Empezar a usarlo →</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { paddingTop: 56 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Confirmar plan</Text>
        </View>

        {/* Resumen */}
        <View style={styles.resumen}>
          <View style={styles.resumenTop}>
            <Text style={{ fontFamily: F.regular, fontSize: 30 }}>{info.ico}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.resumenNombre}>{info.nombre}</Text>
              <Text style={styles.resumenPeriodo}>
                Pago {periodo === 'ANUAL' ? 'anual (2 meses gratis)' : 'mensual'}
              </Text>
            </View>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Activo hasta</Text>
            <Text style={styles.resumenValor}>{vence.toLocaleDateString('es-AR')}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Total</Text>
            <Text style={styles.resumenTotal}>{formatearPrecio(precio)}</Text>
          </View>
        </View>

        <View style={styles.prueba}>
          <Text style={styles.pruebaIco}>🧪</Text>
          <Text style={styles.pruebaText}>
            Modo de prueba: no se cobra nada y los datos de la tarjeta no se guardan. Podés usar cualquier número de 16 dígitos.
          </Text>
        </View>

        {/* Tarjeta */}
        <View style={styles.form}>
          <Text style={styles.label}>TITULAR DE LA TARJETA</Text>
          <TextInput
            style={styles.input}
            placeholder="Como figura en la tarjeta"
            placeholderTextColor={tema.subTexto}
            value={titular}
            onChangeText={setTitular}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>NÚMERO</Text>
          <TextInput
            style={styles.input}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={tema.subTexto}
            value={numero}
            onChangeText={v => setNumero(formatearTarjeta(v))}
            keyboardType="number-pad"
            maxLength={19}
          />

          <View style={styles.fila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>VENCIMIENTO</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                placeholderTextColor={tema.subTexto}
                value={vencimiento}
                onChangeText={v => setVencimiento(formatearVencimiento(v))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>CÓDIGO</Text>
              <TextInput
                style={styles.input}
                placeholder="CVV"
                placeholderTextColor={tema.subTexto}
                value={cvv}
                onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
            </View>
          </View>
        </View>

        <PressScale
          haptico
          style={[styles.pagarBtn, styles.pagarBtnFlotante, (!datosValidos || pagando) && { opacity: .5 }]}
          onPress={pagar}
          disabled={!datosValidos || pagando}
          accessibilityLabel={`Pagar ${formatearPrecio(precio)}`}
        >
          {pagando
            ? <ActivityIndicator color="white" />
            : <Text style={styles.pagarText}>Pagar {formatearPrecio(precio)}</Text>}
        </PressScale>
        <Text style={styles.legal}>
          {periodo === 'ANUAL' ? 'Se cobra una vez por año.' : 'Se cobra una vez por mes.'} Podés cancelar cuando quieras desde Planes.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const getStyles = (tema: TemaTokens) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: tema.bg },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingBottom: 16 },
  backBtn:         { width: 38, height: 38, borderRadius: 12, backgroundColor: tema.overlay, alignItems: 'center', justifyContent: 'center' },
  backText:        { fontFamily: F.regular, fontSize: 16, color: tema.texto },
  title:           { fontSize: 22, fontFamily: F.extrabold, color: tema.texto },
  errorText:       { fontFamily: F.regular, fontSize: 15, color: tema.texto, textAlign: 'center' },

  resumen:         { backgroundColor: '#1a1a1a', marginHorizontal: 22, borderRadius: 20, padding: 20, marginBottom: 14 },
  resumenTop:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  resumenNombre:   { fontSize: 18, fontFamily: F.extrabold, color: 'white' },
  resumenPeriodo:  { fontFamily: F.regular, fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 },
  resumenDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,.08)', marginVertical: 14 },
  resumenRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  resumenLabel:    { fontFamily: F.regular, fontSize: 13, color: '#888' },
  resumenValor:    { fontSize: 13, color: 'white', fontFamily: F.semibold },
  resumenTotal:    { fontSize: 24, color: 'white', fontFamily: F.extrabold },

  prueba:          { flexDirection: 'row', gap: 10, marginHorizontal: 22, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,210,63,.14)', marginBottom: 20 },
  pruebaIco:       { fontFamily: F.regular, fontSize: 16 },
  pruebaText:      { fontFamily: F.regular, flex: 1, fontSize: 12, color: tema.texto, lineHeight: 18 },

  form:            { paddingHorizontal: 22 },
  label:           { fontSize: 11, fontFamily: F.bold, color: tema.subTexto, letterSpacing: 1.5, marginBottom: 8 },
  input:           { fontFamily: F.regular, backgroundColor: tema.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: tema.texto, marginBottom: 16, borderWidth: 1.5, borderColor: tema.border },
  fila:            { flexDirection: 'row', gap: 12 },

  pagarBtn:        { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  pagarBtnFlotante:{ marginHorizontal: 22, marginTop: 8 },
  pagarText:       { color: 'white', fontSize: 15, fontFamily: F.extrabold },
  legal:           { fontFamily: F.regular, fontSize: 11, color: tema.subTexto, textAlign: 'center', marginTop: 10, paddingHorizontal: 32 },

  exito:           { alignItems: 'center', justifyContent: 'center', padding: 28 },
  exitoIcoWrap:    { width: 96, height: 96, borderRadius: 30, backgroundColor: 'rgba(255,210,63,.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  exitoIco:        { fontFamily: F.regular, fontSize: 48 },
  exitoTitulo:     { fontSize: 26, fontFamily: F.extrabold, color: tema.texto, textAlign: 'center', marginBottom: 8 },
  exitoSub:        { fontFamily: F.regular, fontSize: 14, color: tema.subTexto, textAlign: 'center', marginBottom: 22 },
  exitoBeneficios: { alignSelf: 'stretch', backgroundColor: tema.card, borderRadius: 18, padding: 18, gap: 10, marginBottom: 24 },
  exitoBeneficio:  { fontFamily: F.regular, fontSize: 13, color: tema.texto, lineHeight: 18 },
})
