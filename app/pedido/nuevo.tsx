import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { pedidosService } from '../../services/pedidos.service'

const HORARIOS = ['8:00','9:30','11:00','14:00','15:30','17:00']

export default function NuevoPedidoScreen() {
  const router = useRouter()
  const { servicioId, servicioNombre, precio, proveedorNombre } = useLocalSearchParams<any>()
  const [descripcion, setDescripcion] = useState('')
  const [horario, setHorario]         = useState('')
  const [loading, setLoading]         = useState(false)

  async function handleCrearPedido() {
    if (!horario) return Alert.alert('Error', 'Elegí un horario')
    setLoading(true)
    try {
      const [h, m] = horario.split(':')
      const fecha = new Date()
      fecha.setDate(fecha.getDate() + 1)
      fecha.setHours(parseInt(h), parseInt(m), 0, 0)

      await pedidosService.crearPedido({
        servicioId,
        fecha: fecha.toISOString(),
        descripcion,
      })

      // Navegar a pantalla de éxito
      router.replace({
        pathname: '/pedido/exito',
        params: {
          monto:     Math.round(Number(precio) * 1.1),
          servicio:  servicioNombre,
          proveedor: proveedorNombre ?? 'Proveedor',
        }
      })
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nuevo Pedido</Text>
        </View>

        <View style={styles.serviceCard}>
          <View style={styles.serviceIco}><Text style={{fontSize:24}}>🔧</Text></View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{servicioNombre}</Text>
            <Text style={styles.servicePrice}>${Number(precio).toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ELEGÍ EL HORARIO</Text>
        <View style={styles.horariosGrid}>
          {HORARIOS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.horarioBtn, horario === h && styles.horarioBtnActive]}
              onPress={() => setHorario(h)}
            >
              <Text style={[styles.horarioText, horario === h && styles.horarioTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DESCRIPCIÓN (OPCIONAL)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Describí brevemente qué necesitás..."
          placeholderTextColor="#bbb"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Servicio</Text>
            <Text style={styles.resumenValue}>${Number(precio).toLocaleString()}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Comisión (10%)</Text>
            <Text style={styles.resumenValue}>${Math.round(Number(precio) * 0.1).toLocaleString()}</Text>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenRow}>
            <Text style={styles.resumenTotal}>Total</Text>
            <Text style={styles.resumenTotalNum}>${Math.round(Number(precio) * 1.1).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.escrowNote}>
          <Text style={styles.escrowIco}>🔒</Text>
          <Text style={styles.escrowText}>Tu pago queda retenido hasta que confirmés que el trabajo fue completado.</Text>
        </View>

        <View style={{ height:120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmarBtn, loading && { opacity:.7 }]}
          onPress={handleCrearPedido}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.confirmarText}>Confirmar pedido · ${Math.round(Number(precio) * 1.1).toLocaleString()}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:         { flex:1, backgroundColor:Colors.cream },
  header:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:22, paddingTop:56, paddingBottom:16 },
  backBtn:           { width:38, height:38, borderRadius:12, backgroundColor:'rgba(0,0,0,.06)', alignItems:'center', justifyContent:'center' },
  backText:          { fontSize:16, color:Colors.dark },
  title:             { fontSize:20, fontWeight:'900', color:Colors.dark },
  serviceCard:       { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'white', marginHorizontal:22, borderRadius:18, padding:16, marginBottom:24, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.06, shadowRadius:8, elevation:3 },
  serviceIco:        { width:52, height:52, borderRadius:14, backgroundColor:Colors.greenLight, alignItems:'center', justifyContent:'center' },
  serviceInfo:       { flex:1 },
  serviceName:       { fontSize:15, fontWeight:'700', color:Colors.dark, marginBottom:4 },
  servicePrice:      { fontSize:18, fontWeight:'900', color:Colors.dark },
  sectionLabel:      { fontSize:11, fontWeight:'700', color:'#999', letterSpacing:1.5, paddingHorizontal:22, marginBottom:12 },
  horariosGrid:      { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:22, gap:10, marginBottom:24 },
  horarioBtn:        { paddingHorizontal:20, paddingVertical:12, borderRadius:12, backgroundColor:'white', borderWidth:1.5, borderColor:Colors.border },
  horarioBtnActive:  { backgroundColor:Colors.dark, borderColor:Colors.dark },
  horarioText:       { fontSize:13, fontWeight:'600', color:'#555' },
  horarioTextActive: { color:'white' },
  textarea:          { backgroundColor:'white', borderRadius:16, padding:14, marginHorizontal:22, fontSize:13, color:Colors.dark, marginBottom:24, minHeight:100, borderWidth:1.5, borderColor:Colors.border },
  resumenCard:       { backgroundColor:'#1a1a1a', marginHorizontal:22, borderRadius:20, padding:20, marginBottom:14 },
  resumenRow:        { flexDirection:'row', justifyContent:'space-between', paddingVertical:6 },
  resumenLabel:      { fontSize:13, color:'#888' },
  resumenValue:      { fontSize:13, color:'white', fontWeight:'600' },
  resumenDivider:    { height:1, backgroundColor:'rgba(255,255,255,.08)', marginVertical:8 },
  resumenTotal:      { fontSize:14, color:'#888' },
  resumenTotalNum:   { fontSize:26, fontWeight:'900', color:'white' },
  escrowNote:        { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'#F0FDF4', marginHorizontal:22, borderRadius:14, padding:14, borderWidth:1.5, borderColor:Colors.greenLight },
  escrowIco:         { fontSize:18 },
  escrowText:        { flex:1, fontSize:12, color:Colors.primary, lineHeight:18, fontWeight:'500' },
  bottomBar:         { position:'absolute', bottom:0, left:0, right:0, backgroundColor:Colors.cream, padding:16, paddingBottom:32 },
  confirmarBtn:      { backgroundColor:Colors.primary, borderRadius:16, paddingVertical:16, alignItems:'center' },
  confirmarText:     { color:'white', fontSize:15, fontWeight:'700' },
})
