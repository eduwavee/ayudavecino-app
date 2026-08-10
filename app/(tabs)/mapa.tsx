import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Platform
} from 'react-native'
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { usuariosService } from '../../services/usuarios.service'

// Fallback: San Miguel de Tucumán (misma ubicación que se muestra en Inicio)
const REGION_DEFAULT = {
  latitude: -26.8241,
  longitude: -65.2226,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
}

function coordsDe(p: any): { latitude: number; longitude: number } | null {
  if (typeof p?.latitud !== 'number' || typeof p?.longitud !== 'number') return null
  return { latitude: p.latitud, longitude: p.longitud }
}

export default function MapaScreen() {
  const router = useRouter()
  const mapRef = useRef<MapView>(null)

  const [region, setRegion]         = useState(REGION_DEFAULT)
  const [ubicacion, setUbicacion]   = useState<{ latitude: number; longitude: number } | null>(null)
  const [permiso, setPermiso]       = useState<'pendiente' | 'concedido' | 'denegado'>('pendiente')
  const [proveedores, setProveedores] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    pedirUbicacion()
    cargarProveedores()
  }, [])

  async function pedirUbicacion() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setPermiso('denegado')
        return
      }
      setPermiso('concedido')
      const pos = await Location.getCurrentPositionAsync({})
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      setUbicacion(coords)
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 })
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500)
    } catch {
      setPermiso('denegado')
    }
  }

  async function cargarProveedores() {
    try {
      const data = await usuariosService.listarProveedores()
      setProveedores(data ?? [])
    } catch {
      setProveedores([])
    } finally {
      setLoading(false)
    }
  }

  const centrarEnMiUbicacion = useCallback(() => {
    if (!ubicacion) { pedirUbicacion(); return }
    mapRef.current?.animateToRegion({ ...ubicacion, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 400)
  }, [ubicacion])

  const proveedoresConUbicacion = proveedores
    .map(p => ({ p, coords: coordsDe(p) }))
    .filter((x): x is { p: any; coords: { latitude: number; longitude: number } } => x.coords !== null)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mapa</Text>
          <Text style={styles.subtitle}>Proveedores cerca tuyo</Text>
        </View>
        {!loading && (
          <View style={styles.contadorChip}>
            <Text style={styles.contadorText}>{proveedoresConUbicacion.length} cerca</Text>
          </View>
        )}
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          showsUserLocation={permiso === 'concedido'}
          showsMyLocationButton={false}
        >
          {proveedoresConUbicacion.map(({ p, coords }) => (
            <Marker key={p.id} coordinate={coords} pinColor={Colors.primary}>
              <Callout onPress={() => router.push(`/proveedor/${p.id}`)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutNombre}>{p.nombre}</Text>
                  <Text style={styles.calloutRating}>⭐ {p.rating?.toFixed?.(1) ?? '0.0'}</Text>
                  <Text style={styles.calloutLink}>Ver perfil →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        )}

        {permiso === 'denegado' && (
          <View style={styles.permisoBanner}>
            <Text style={styles.permisoText}>📍 Activá la ubicación para verte en el mapa</Text>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.permisoBtn}>Activar</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.centrarBtn} onPress={centrarEnMiUbicacion}>
          <Text style={styles.centrarIco}>🎯</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:Colors.cream },
  header:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:22, paddingTop:60, paddingBottom:14 },
  title:           { fontSize:26, fontWeight:'900', color:Colors.dark },
  subtitle:        { fontSize:12, color:Colors.gray, marginTop:2 },
  contadorChip:    { backgroundColor:Colors.greenLight, paddingHorizontal:12, paddingVertical:6, borderRadius:100 },
  contadorText:    { fontSize:12, fontWeight:'700', color:Colors.primary },
  mapWrap:         { flex:1, position:'relative' },
  loadingOverlay:  { ...StyleSheet.absoluteFillObject, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(247,243,238,.6)' },
  permisoBanner:   { position:'absolute', top:14, left:16, right:16, backgroundColor:'white', borderRadius:14, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.1, shadowRadius:8, elevation:4 },
  permisoText:     { flex:1, fontSize:12, color:Colors.dark, fontWeight:'600', marginRight:8 },
  permisoBtn:      { fontSize:12, fontWeight:'800', color:Colors.primary },
  centrarBtn:      { position:'absolute', bottom:24, right:20, width:48, height:48, borderRadius:24, backgroundColor:'white', alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.15, shadowRadius:8, elevation:4 },
  centrarIco:      { fontSize:20 },
  callout:         { minWidth:140, padding:4 },
  calloutNombre:   { fontSize:13, fontWeight:'800', color:Colors.dark, marginBottom:2 },
  calloutRating:   { fontSize:11, color:Colors.gray, marginBottom:4 },
  calloutLink:     { fontSize:11, fontWeight:'700', color:Colors.primary },
})
