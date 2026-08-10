import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../constants/colors";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/auth.service";

import { useTemaStore } from "../store/temaStore";

const { oscuro, toggleTema } = useTemaStore();

export default function AjustesScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuthStore();

  // Estados de configuración
  const [notifPedidos, setNotifPedidos] = useState(true);
  const [notifMensajes, setNotifMensajes] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(false);
  const [ubicacion, setUbicacion] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Estás seguro que querés salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  }

  function handleEliminarCuenta() {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Contactá soporte",
              "Para eliminar tu cuenta escribinos a soporte@ayudavecino.com",
            ),
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ajustes</Text>
      </View>

      <Animated.View
        style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Perfil mini */}
        <TouchableOpacity
          style={styles.perfilCard}
          onPress={() => router.push("/editar-perfil")}
        >
          <View style={styles.perfilAvatar}>
            <Text style={styles.perfilAvatarText}>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.perfilInfo}>
            <Text style={styles.perfilNombre}>{usuario?.nombre}</Text>
            <Text style={styles.perfilEmail}>{usuario?.email}</Text>
            <Text style={styles.perfilEditar}>Toca para editar perfil →</Text>
          </View>
          <View
            style={[
              styles.rolBadge,
              usuario?.rol === "PROVEEDOR" && styles.rolBadgeProv,
            ]}
          >
            <Text style={styles.rolBadgeText}>
              {usuario?.rol === "PROVEEDOR" ? "🔨 Pro" : "🙋 Cliente"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notificaciones</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>📋</Text>
                <View>
                  <Text style={styles.settingLabel}>Pedidos y trabajos</Text>
                  <Text style={styles.settingDesc}>
                    Alertas de estado de pedidos
                  </Text>
                </View>
              </View>
              <Switch
                value={notifPedidos}
                onValueChange={setNotifPedidos}
                trackColor={{
                  false: Colors.border,
                  true: "rgba(26,158,92,.4)",
                }}
                thumbColor={notifPedidos ? Colors.primary : "#aaa"}
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>💬</Text>
                <View>
                  <Text style={styles.settingLabel}>Mensajes</Text>
                  <Text style={styles.settingDesc}>
                    Nuevos mensajes del chat
                  </Text>
                </View>
              </View>
              <Switch
                value={notifMensajes}
                onValueChange={setNotifMensajes}
                trackColor={{
                  false: Colors.border,
                  true: "rgba(26,158,92,.4)",
                }}
                thumbColor={notifMensajes ? Colors.primary : "#aaa"}
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>🎉</Text>
                <View>
                  <Text style={styles.settingLabel}>Promociones</Text>
                  <Text style={styles.settingDesc}>
                    Ofertas y descuentos especiales
                  </Text>
                </View>
              </View>
              <Switch
                value={notifPromos}
                onValueChange={setNotifPromos}
                trackColor={{
                  false: Colors.border,
                  true: "rgba(26,158,92,.4)",
                }}
                thumbColor={notifPromos ? Colors.primary : "#aaa"}
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>📧</Text>
                <View>
                  <Text style={styles.settingLabel}>Emails</Text>
                  <Text style={styles.settingDesc}>
                    Resumen semanal por correo
                  </Text>
                </View>
              </View>
              <Switch
                value={notifEmail}
                onValueChange={setNotifEmail}
                trackColor={{
                  false: Colors.border,
                  true: "rgba(26,158,92,.4)",
                }}
                thumbColor={notifEmail ? Colors.primary : "#aaa"}
              />
            </View>
          </View>
        </View>

        {/* Privacidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacidad</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>📍</Text>
                <View>
                  <Text style={styles.settingLabel}>Compartir ubicación</Text>
                  <Text style={styles.settingDesc}>
                    Para mostrar proveedores cercanos
                  </Text>
                </View>
              </View>
              <Switch
                value={ubicacion}
                onValueChange={setUbicacion}
                trackColor={{
                  false: Colors.border,
                  true: "rgba(26,158,92,.4)",
                }}
                thumbColor={ubicacion ? Colors.primary : "#aaa"}
              />
            </View>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>🔑</Text>
                <View>
                  <Text style={styles.settingLabel}>Cambiar contraseña</Text>
                  <Text style={styles.settingDesc}>
                    Actualizá tu contraseña
                  </Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>📄</Text>
                <View>
                  <Text style={styles.settingLabel}>
                    Términos y condiciones
                  </Text>
                  <Text style={styles.settingDesc}>Leé nuestras políticas</Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Apariencia</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>🌙</Text>
                <View>
                  <Text style={styles.settingLabel}>Modo oscuro</Text>
                  <Text style={styles.settingDesc}>
                    Próximamente disponible
                  </Text>
                </View>
              </View>
              <Switch
                value={modoOscuro}
                onValueChange={() =>
                  Alert.alert(
                    "Próximamente",
                    "El modo oscuro estará disponible en la próxima versión",
                  )
                }
                trackColor={{
                  false: Colors.border,
                  true: "rgba(26,158,92,.4)",
                }}
                thumbColor={modoOscuro ? Colors.primary : "#aaa"}
              />
            </View>
          </View>
        </View>

        {/* Sobre la app */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Sobre la app</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>⭐</Text>
                <View>
                  <Text style={styles.settingLabel}>Calificar AyudaVecino</Text>
                  <Text style={styles.settingDesc}>
                    Dejá tu reseña en la tienda
                  </Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>🐛</Text>
                <View>
                  <Text style={styles.settingLabel}>Reportar un problema</Text>
                  <Text style={styles.settingDesc}>
                    soporte@ayudavecino.com
                  </Text>
                </View>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIco}>📱</Text>
                <View>
                  <Text style={styles.settingLabel}>Versión</Text>
                  <Text style={styles.settingDesc}>AyudaVecino v1.0.0</Text>
                </View>
              </View>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>Actualizado</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botones de sesión */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleEliminarCuenta}
          >
            <Text style={styles.deleteText}>🗑️ Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 16, color: Colors.dark },
  title: { fontSize: 22, fontWeight: "900", color: Colors.dark },
  perfilCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "white",
    marginHorizontal: 22,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  perfilAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  perfilAvatarText: { color: "white", fontSize: 22, fontWeight: "900" },
  perfilInfo: { flex: 1 },
  perfilNombre: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.dark,
    marginBottom: 2,
  },
  perfilEmail: { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  perfilEditar: { fontSize: 11, color: Colors.primary, fontWeight: "600" },
  rolBadge: {
    backgroundColor: "rgba(255,210,63,.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,210,63,.3)",
  },
  rolBadgeProv: {
    backgroundColor: "rgba(26,158,92,.1)",
    borderColor: "rgba(26,158,92,.25)",
  },
  rolBadgeText: { fontSize: 11, fontWeight: "800", color: Colors.dark },
  section: { paddingHorizontal: 22, marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.dark,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIco: { fontSize: 22, width: 32, textAlign: "center" },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark,
    marginBottom: 2,
  },
  settingDesc: { fontSize: 11, color: Colors.gray },
  settingArrow: { fontSize: 22, color: "#ccc" },
  rowDivider: { height: 1, backgroundColor: "#f5f5f5", marginLeft: 60 },
  versionBadge: {
    backgroundColor: "rgba(26,158,92,.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  versionBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  logoutBtn: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#FF7675",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: { color: "#FF7675", fontSize: 15, fontWeight: "700" },
  deleteBtn: { borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  deleteText: { color: "#bbb", fontSize: 13, fontWeight: "600" },
});
