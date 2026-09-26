import { useState, useEffect, useRef, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { Colors } from "../../constants/colors";
import { avatarUrl } from "../../constants/config";
import { useAuthStore } from "../../store/authStore";
import { useTema, TemaTokens } from "../../store/temaStore";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { authService } from "../../services/auth.service";
import { pedidosService } from "../../services/pedidos.service";
import { FUENTES as F } from '../../constants/diseno'
import { PressScale } from '../../components/ui/PressScale'
import { PlanBadge } from '../../components/ui/PlanBadge'
import { usePlan } from '../../hooks/usePlan'
import { Icono } from '../../components/ui/Icono'
import { FondoBarraEstado } from '../../components/ui/FondoBarraEstado'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { FilaMenu, DivisorMenu } from '../../components/ui/FilaMenu'
import { categoriaInfo } from '../../constants/categorias'
import { textoRating } from '../../utils/rating'

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

  // Al volver a la pestaña: las pestañas quedan montadas y los contadores y
  // "Pedidos recientes" seguían mostrando lo de la primera vez
  useFocusEffect(useCallback(() => { cargarPedidos(); }, []));

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

  // Igual que en Ajustes: se confirma antes de salir (el botón está al final de la
  // lista y es fácil tocarlo sin querer al scrollear)
  function handleLogout() {
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

  const completados = pedidos.filter((p) => p.estado === "COMPLETADO").length;
  const enCurso = pedidos.filter(
    (p) => p.estado === "EN_CURSO" || p.estado === "ACEPTADO",
  ).length;
  const pendientes = pedidos.filter((p) => p.estado === "PENDIENTE").length;

  const esProveedor = usuario?.rol === "PROVEEDOR";
  const plan = usePlan();

  function handleAyuda() {
    // Los dos Premium tienen soporte prioritario
    Alert.alert(
      plan.esPremium ? "Soporte prioritario" : "Ayuda y soporte",
      plan.esPremium
        ? "Como sos Premium, tu consulta pasa primero en la fila: te respondemos en menos de 2 horas hábiles."
        : "¿Tenés algún problema o consulta? Escribinos a soporte@ayudavecino.com y te respondemos a la brevedad.",
      [
        { text: "Cerrar", style: "cancel" },
        {
          text: "Enviar email",
          onPress: () => Linking.openURL(
            plan.esPremium
              ? "mailto:soporte@ayudavecino.com?subject=%5BPRIORITARIO%5D%20Consulta"
              : "mailto:soporte@ayudavecino.com",
          ),
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
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
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
            hitSlop={10}
          >
            <Icono nombre="settings-outline" tamano={20} color="white" />
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
              <Icono nombre={esProveedor ? "hammer" : "person"} tamano={11} color="#1a1a1a" />
              <Text style={styles.rolBadgeText}>
                {esProveedor ? "Proveedor" : "Cliente"}
              </Text>
            </View>
          </View>
          <Text style={styles.heroName}>{usuario?.nombre}</Text>
          <Text style={styles.heroEmail}>
            {usuario?.username ? `@${usuario.username} · ` : ''}{usuario?.email}
          </Text>
          <PlanBadge
            plan={plan.plan}
            rol={plan.rol}
            oscuro
            grande
            style={{ alignSelf: "center", marginBottom: 12 }}
          />

          {esProveedor && (
            <View style={styles.ratingRow}>
              <Icono nombre="star" tamano={16} color="#FFD23F" />
              {usuario?.rating ? (
                <>
                  <Text style={styles.ratingNum}>{textoRating(usuario.rating)}</Text>
                  <Text style={styles.ratingLabel}>rating</Text>
                </>
              ) : (
                <Text style={styles.ratingLabel}>Sin reseñas todavía</Text>
              )}
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
          <Text style={[styles.statNum, { color: tema.dorado }]}>{enCurso}</Text>
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

      {/* ── PLAN ── */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <PressScale
          style={[styles.planCard, plan.plan !== "GRATIS" && styles.planCardActivo]}
          onPress={() => router.push("/planes")}
          accessibilityLabel={plan.plan === "GRATIS" ? "Ver planes" : "Administrar mi plan"}
        >
          <View style={[styles.planIcoWrap, plan.plan !== "GRATIS" && styles.planIcoWrapActivo]}>
            <Icono
              nombre={plan.plan === "GRATIS" ? "diamond-outline" : plan.info.icono}
              tamano={22}
              color={plan.plan === "GRATIS" ? tema.dorado : Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitulo}>
              {plan.plan === "GRATIS"
                ? (esProveedor ? "Conseguí más clientes" : "Pedí con prioridad")
                : `Plan ${plan.info.nombre}`}
            </Text>
            <Text style={styles.planSub}>
              {plan.plan === "GRATIS"
                ? (esProveedor
                    ? "Aparecé primero en la búsqueda con Pro o Premium"
                    : "Pedidos urgentes y más con Vecino Plus o Premium")
                : plan.venceEn
                  ? `Activo hasta el ${plan.venceEn.toLocaleDateString("es-AR")}`
                  : "Activo"}
            </Text>
          </View>
          <Icono nombre="chevron-forward" tamano={18} color={Colors.primary} />
        </PressScale>
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
            <Text style={styles.sectionLink}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <SkeletonPedidoRow styles={styles} />
            <SkeletonPedidoRow styles={styles} />
          </>
        ) : pedidos.length === 0 ? (
          <View style={styles.emptyPedidos}>
            <Icono nombre="receipt-outline" tamano={36} color={tema.subTexto} style={styles.emptyIco} />
            <Text style={styles.emptyText}>Sin pedidos todavía</Text>
          </View>
        ) : (
          pedidos.slice(0, 3).map((p) => {
            return (
              <View key={p.id} style={styles.pedidoCard}>
                <View style={styles.pedidoLeft}>
                  <View style={styles.pedidoIco}>
                    <Icono nombre={categoriaInfo(p.servicio?.categoria).icono} tamano={19} color={Colors.primary} />
                  </View>
                  <View style={styles.pedidoTextos}>
                    <Text style={styles.pedidoNombre} numberOfLines={1}>
                      {p.servicio?.nombre}
                    </Text>
                    <Text style={styles.pedidoSub} numberOfLines={1}>
                      {esProveedor ? p.cliente?.nombre : p.proveedor?.nombre}
                    </Text>
                  </View>
                </View>
                <EstadoBadge estado={p.estado} oscuro={tema.esOscuro} />
              </View>
            );
          })
        )}
      </Animated.View>

      {/* ── OPCIONES ── */}
      <Animated.View style={[styles.optionsCard, { opacity: fadeAnim }]}>
        {/* Para el proveedor, su área de trabajo tiene que estar a mano (antes solo
            se llegaba desde un banner al final de Inicio) */}
        {esProveedor && (
          <>
            <FilaMenu icono="briefcase-outline" texto="Panel de trabajo" onPress={() => router.push("/proveedor-panel")} />
            <DivisorMenu />
            <FilaMenu icono="construct-outline" texto="Mis servicios" onPress={() => router.push("/proveedor-panel/servicios")} />
            <DivisorMenu />
          </>
        )}
        <FilaMenu icono="diamond-outline" tinte="#B8860B" texto="Planes y beneficios" onPress={() => router.push("/planes")} />
        <DivisorMenu />
        {esProveedor && (
          <>
            <FilaMenu
              icono="chatbubbles-outline"
              texto="Respuestas rápidas"
              onPress={() => router.push("/respuestas-rapidas")}
              extra={!plan.esPremium && <Icono nombre="lock-closed" tamano={14} color={tema.subTexto} />}
            />
            <DivisorMenu />
          </>
        )}
        <FilaMenu icono="person-outline" texto="Editar perfil" onPress={() => router.push("/editar-perfil")} />
        <DivisorMenu />
        {!esProveedor && (
          <>
            <FilaMenu icono="heart-outline" tinte="#E0475B" texto="Mis favoritos" onPress={() => router.push("/favoritos")} />
            <DivisorMenu />
          </>
        )}
        <FilaMenu icono="notifications-outline" tinte="#1F6FD1" texto="Notificaciones" onPress={() => router.push("/notificaciones")} />
        <DivisorMenu />
        <FilaMenu icono="shield-checkmark-outline" tinte="#6C5CE7" texto="Privacidad y seguridad" onPress={() => router.push("/ajustes")} />
        <DivisorMenu />
        <FilaMenu icono="help-buoy-outline" tinte={tema.subTexto} texto="Ayuda y soporte" onPress={handleAyuda} />
      </Animated.View>

      {/* ── LOGOUT ── */}
      <Animated.View
        style={[{ opacity: fadeAnim, paddingHorizontal: 22, marginBottom: 40 }]}
      >
        <PressScale haptico style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </PressScale>
        <Text style={styles.version}>AyudaVecino v1.0.0</Text>
      </Animated.View>
    </ScrollView>
    <FondoBarraEstado color="#1a1a1a" />
    </View>
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
    heroTitle: { fontSize: 20, fontFamily: F.extrabold, color: "white" },
    settingsBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,.1)",
      alignItems: "center",
      justifyContent: "center",
    },
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
    avatarText: { color: "white", fontSize: 36, fontFamily: F.extrabold },
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
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rolBadgeProv: { backgroundColor: Colors.primaryLight },
    rolBadgeText: { fontSize: 10, fontFamily: F.extrabold, color: "#1a1a1a" },
    heroName: {
      fontSize: 22,
      fontFamily: F.extrabold,
      color: "white",
      marginBottom: 4,
    },
    heroEmail: { fontFamily: F.regular, fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 12 },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,.1)",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 100,
    },
    ratingNum: { fontSize: 18, fontFamily: F.extrabold, color: "white" },
    ratingLabel: { fontFamily: F.regular, fontSize: 12, color: "rgba(255,255,255,.6)" },
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
      fontFamily: F.extrabold,
      color: tema.texto,
      marginBottom: 4,
    },
    statLabel: { fontSize: 11, color: tema.subTexto, fontFamily: F.medium },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 22,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 17, fontFamily: F.extrabold, color: tema.texto },
    sectionLink: { fontSize: 12, color: Colors.primary, fontFamily: F.bold },
    emptyPedidos: { alignItems: "center", paddingVertical: 24 },
    emptyIco: { marginBottom: 8, opacity: 0.5 },
    emptyText: { fontFamily: F.regular, fontSize: 14, color: tema.subTexto },
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
    pedidoLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 },
    // Sin flex el nombre largo se metía debajo de la etiqueta de estado
    pedidoTextos: { flex: 1 },
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
      fontFamily: F.bold,
      color: tema.texto,
      marginBottom: 2,
    },
    pedidoSub: { fontFamily: F.regular, fontSize: 11, color: tema.subTexto },
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
    planCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: tema.card,
      marginHorizontal: 22,
      marginBottom: 24,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1.5,
      borderColor: "#FFD23F",
    },
    planCardActivo: { borderColor: Colors.primary },
    planIcoWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(255,210,63,.18)", alignItems: "center", justifyContent: "center" },
    planIcoWrapActivo: { backgroundColor: Colors.greenLight },
    planTitulo: { fontSize: 14, fontFamily: F.extrabold, color: tema.texto, marginBottom: 2 },
    planSub: { fontSize: 11, fontFamily: F.regular, color: tema.subTexto, lineHeight: 15 },
    logoutBtn: {
      backgroundColor: tema.card,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: "center",
      marginBottom: 10,
      borderWidth: 1.5,
      borderColor: "#FF7675",
    },
    logoutText: { color: tema.peligro, fontSize: 15, fontFamily: F.bold },
    version: { fontFamily: F.regular, textAlign: "center", fontSize: 11, color: tema.subTexto },
  });
