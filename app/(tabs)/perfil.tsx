import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Linking,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/colors";
import { avatarUrl } from "../../constants/config";
import { useAuthStore } from "../../store/authStore";
import { useTema, TemaTokens } from "../../store/temaStore";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { authService } from "../../services/auth.service";
import { pedidosService } from "../../services/pedidos.service";

function SkeletonPedidoRow({ styles }: { styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoLeft}>
        <SkeletonBlock width={40} height={40} borderRadius={12} />
        <View>
          <SkeletonBlock width={140} height={13} style={{ marginBottom: 6 }} />
          <SkeletonBlock width={90} height={11} />
        </View>
      </View>
      <SkeletonBlock width={70} height={18} borderRadius={100} />
    </View>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuthStore();
  const tema = useTema();
  const styles = getStyles(tema);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    cargarPedidos();
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

  async function cargarPedidos() {
    try {
      const data = await pedidosService.misPedidos();
      setPedidos(data);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await authService.logout();
    logout();
    router.replace("/(auth)/welcome");
  }

  const completados = pedidos.filter((p) => p.estado === "COMPLETADO").length;
  const enCurso = pedidos.filter(
    (p) => p.estado === "EN_CURSO" || p.estado === "ACEPTADO",
  ).length;
  const pendientes = pedidos.filter((p) => p.estado === "PENDIENTE").length;

  function handleAyuda() {
    Alert.alert(
      "Ayuda y soporte",
      "¿Tenés algún problema o consulta? Escribinos a soporte@ayudavecino.com y te respondemos a la brevedad.",
      [
        { text: "Cerrar", style: "cancel" },
        {
          text: "Enviar email",
          onPress: () => Linking.openURL("mailto:soporte@ayudavecino.com"),
        },
      ],
    );
  }

  const esProveedor = usuario?.rol === "PROVEEDOR";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── HERO ── */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
        <View style={styles.heroBg} />
        <View style={styles.heroBg2} />

        <View style={styles.heroTop}>
          <Text style={styles.heroTitle}>Mi perfil</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push("/ajustes")}
          >
            <Text style={styles.settingsIco}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                {avatarUrl(usuario?.avatar) ? (
                  <Image source={{ uri: avatarUrl(usuario?.avatar)! }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>
                    {usuario?.nombre?.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.rolBadge, esProveedor && styles.rolBadgeProv]}>
              <Text style={styles.rolBadgeText}>
                {esProveedor ? "🔨 Proveedor" : "🙋 Cliente"}
              </Text>
            </View>
          </View>
          <Text style={styles.heroName}>{usuario?.nombre}</Text>
          <Text style={styles.heroEmail}>{usuario?.email}</Text>

          {esProveedor && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingNum}>
                {usuario?.rating?.toFixed(1) ?? "0.0"}
              </Text>
              <Text style={styles.ratingLabel}>rating</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── STATS ── */}
      <Animated.View
        style={[
          styles.statsCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{pedidos.length}</Text>
          <Text style={styles.statLabel}>
            {esProveedor ? "Trabajos" : "Pedidos"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: "#FFD23F" }]}>{enCurso}</Text>
          <Text style={styles.statLabel}>En curso</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>
            {completados}
          </Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </Animated.View>

      {/* ── PEDIDOS RECIENTES ── */}
      <Animated.View
        style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {esProveedor ? "Trabajos recientes" : "Pedidos recientes"}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/pedidos")}>
            <Text style={styles.sectionLink}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <SkeletonPedidoRow styles={styles} />
            <SkeletonPedidoRow styles={styles} />
          </>
        ) : pedidos.length === 0 ? (
          <View style={styles.emptyPedidos}>
            <Text style={styles.emptyIco}>📋</Text>
            <Text style={styles.emptyText}>Sin pedidos todavía</Text>
          </View>
        ) : (
          pedidos.slice(0, 3).map((p) => {
            const estadoConfig: Record<
              string,
              { color: string; bg: string; label: string }
            > = {
              PENDIENTE: {
                color: "#D4A017",
                bg: "rgba(255,210,63,.12)",
                label: "⏳ Pendiente",
              },
              ACEPTADO: {
                color: Colors.primary,
                bg: "rgba(26,158,92,.1)",
                label: "✓ Aceptado",
              },
              EN_CURSO: {
                color: "#74B9FF",
                bg: "rgba(116,185,255,.12)",
                label: "🔧 En curso",
              },
              COMPLETADO: {
                color: Colors.primary,
                bg: "rgba(26,158,92,.1)",
                label: "✅ Completado",
              },
              CANCELADO: {
                color: "#FF7675",
                bg: "rgba(255,118,117,.12)",
                label: "✕ Cancelado",
              },
            };
            const est = estadoConfig[p.estado] ?? estadoConfig.PENDIENTE;
            return (
              <View key={p.id} style={styles.pedidoCard}>
                <View style={styles.pedidoLeft}>
                  <View style={styles.pedidoIco}>
                    <Text style={{ fontSize: 18 }}>🔧</Text>
                  </View>
                  <View>
                    <Text style={styles.pedidoNombre}>
                      {p.servicio?.nombre}
                    </Text>
                    <Text style={styles.pedidoSub}>
                      {esProveedor ? p.cliente?.nombre : p.proveedor?.nombre}
                    </Text>
                  </View>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                  <Text style={[styles.estadoText, { color: est.color }]}>
                    {est.label}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </Animated.View>

      {/* ── OPCIONES ── */}
      <Animated.View style={[styles.optionsCard, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/editar-perfil")}
        >
          <Text style={styles.optionIco}>👤</Text>
          <Text style={styles.optionText}>Editar perfil</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.optionDivider} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/notificaciones")}
        >
          <Text style={styles.optionIco}>🔔</Text>
          <Text style={styles.optionText}>Notificaciones</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.optionDivider} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/ajustes")}
        >
          <Text style={styles.optionIco}>🔒</Text>
          <Text style={styles.optionText}>Privacidad y seguridad</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.optionDivider} />
        <TouchableOpacity style={styles.optionRow} onPress={handleAyuda}>
          <Text style={styles.optionIco}>❓</Text>
          <Text style={styles.optionText}>Ayuda y soporte</Text>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── LOGOUT ── */}
      <Animated.View
        style={[{ opacity: fadeAnim, paddingHorizontal: 22, marginBottom: 40 }]}
      >
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <Text style={styles.version}>AyudaVecino v1.0.0</Text>
      </Animated.View>
    </ScrollView>
  );
}

const getStyles = (tema: TemaTokens) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: tema.bg },
    hero: {
      backgroundColor: "#1a1a1a",
      paddingBottom: 40,
      overflow: "hidden",
      position: "relative",
    },
    heroBg: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: Colors.primary,
      opacity: 0.1,
      top: -100,
      right: -80,
    },
    heroBg2: {
      position: "absolute",
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: "#FFD23F",
      opacity: 0.06,
      bottom: -60,
      left: -40,
    },
    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 22,
      paddingTop: 56,
      marginBottom: 24,
    },
    heroTitle: { fontSize: 20, fontWeight: "900", color: "white" },
    settingsBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    settingsIco: { fontSize: 16 },
    avatarSection: { alignItems: "center", paddingHorizontal: 22 },
    avatarWrap: { position: "relative", marginBottom: 14 },
    avatarRing: {
      width: 94,
      height: 94,
      borderRadius: 31,
      borderWidth: 3,
      borderColor: "rgba(255,255,255,.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 28,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImg: { width: "100%", height: "100%" },
    avatarText: { color: "white", fontSize: 36, fontWeight: "900" },
    rolBadge: {
      position: "absolute",
      bottom: -8,
      right: -8,
      backgroundColor: "#FFD23F",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: "#1a1a1a",
    },
    rolBadgeProv: { backgroundColor: Colors.primaryLight },
    rolBadgeText: { fontSize: 10, fontWeight: "900", color: "#1a1a1a" },
    heroName: {
      fontSize: 22,
      fontWeight: "900",
      color: "white",
      marginBottom: 4,
    },
    heroEmail: { fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 12 },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,.1)",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 100,
    },
    ratingStar: { fontSize: 16 },
    ratingNum: { fontSize: 18, fontWeight: "900", color: "white" },
    ratingLabel: { fontSize: 12, color: "rgba(255,255,255,.6)" },
    statsCard: {
      flexDirection: "row",
      backgroundColor: tema.card,
      marginHorizontal: 22,
      borderRadius: 20,
      padding: 20,
      marginTop: -20,
      shadowColor: tema.sombra,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
      marginBottom: 24,
    },
    statItem: { flex: 1, alignItems: "center" },
    statDivider: { width: 1, backgroundColor: tema.border },
    statNum: {
      fontSize: 24,
      fontWeight: "900",
      color: tema.texto,
      marginBottom: 4,
    },
    statLabel: { fontSize: 11, color: tema.subTexto, fontWeight: "500" },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 22,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 17, fontWeight: "900", color: tema.texto },
    sectionLink: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
    emptyPedidos: { alignItems: "center", paddingVertical: 24 },
    emptyIco: { fontSize: 36, marginBottom: 8, opacity: 0.3 },
    emptyText: { fontSize: 14, color: tema.subTexto },
    pedidoCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: tema.card,
      marginHorizontal: 22,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      shadowColor: tema.sombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    pedidoLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    pedidoIco: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: Colors.greenLight,
      alignItems: "center",
      justifyContent: "center",
    },
    pedidoNombre: {
      fontSize: 13,
      fontWeight: "700",
      color: tema.texto,
      marginBottom: 2,
    },
    pedidoSub: { fontSize: 11, color: tema.subTexto },
    estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
    estadoText: { fontSize: 10, fontWeight: "700" },
    optionsCard: {
      backgroundColor: tema.card,
      marginHorizontal: 22,
      borderRadius: 20,
      marginBottom: 16,
      shadowColor: tema.sombra,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      overflow: "hidden",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    },
    optionIco: { fontSize: 20, width: 28, textAlign: "center" },
    optionText: { flex: 1, fontSize: 14, fontWeight: "500", color: tema.texto },
    optionArrow: { fontSize: 20, color: tema.subTexto },
    optionDivider: { height: 1, backgroundColor: tema.border, marginLeft: 56 },
    logoutBtn: {
      backgroundColor: tema.card,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: "center",
      marginBottom: 10,
      borderWidth: 1.5,
      borderColor: "#FF7675",
    },
    logoutText: { color: "#FF7675", fontSize: 15, fontWeight: "700" },
    version: { textAlign: "center", fontSize: 11, color: tema.subTexto },
  });
