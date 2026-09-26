import type { NombreIcono } from '../components/ui/Icono'

// Categorias de servicio. El value es lo que guarda el backend en Servicio.categoria
// (lista validada en src/modules/servicios/categorias.js del backend — mantener en sync).
export interface Categoria {
  value:  string
  nombre: string
  icono:  NombreIcono
}

export const CATEGORIAS: Categoria[] = [
  // Hogar
  { value:'plomeria',          nombre:'Plomería',            icono:'water-outline' },
  { value:'electricidad',      nombre:'Electricidad',        icono:'flash-outline' },
  { value:'gasista',           nombre:'Gasista',             icono:'flame-outline' },
  { value:'cerrajeria',        nombre:'Cerrajería',          icono:'key-outline' },
  { value:'climatizacion',     nombre:'Aire acondicionado',  icono:'snow-outline' },
  { value:'electrodomesticos', nombre:'Electrodomésticos',   icono:'tv-outline' },
  // Construccion
  { value:'albanileria',       nombre:'Albañilería',         icono:'layers-outline' },
  { value:'carpinteria',       nombre:'Carpintería',         icono:'hammer-outline' },
  { value:'pintura',           nombre:'Pintura',             icono:'brush-outline' },
  { value:'herreria',          nombre:'Herrería',            icono:'build-outline' },
  { value:'techos',            nombre:'Techos',              icono:'home-outline' },
  { value:'durlock',           nombre:'Durlock y yesería',   icono:'grid-outline' },
  { value:'vidrieria',         nombre:'Vidriería',           icono:'browsers-outline' },
  // Exterior y limpieza
  { value:'jardin',            nombre:'Jardín',              icono:'leaf-outline' },
  { value:'limpieza',          nombre:'Limpieza',            icono:'sparkles-outline' },
  { value:'fumigacion',        nombre:'Fumigación',          icono:'bug-outline' },
  { value:'tapizados',         nombre:'Lavado de tapizados', icono:'bed-outline' },
  // Servicios varios
  { value:'mudanzas',          nombre:'Mudanzas y fletes',   icono:'cube-outline' },
  { value:'armado_muebles',    nombre:'Armado de muebles',   icono:'construct-outline' },
  // Personas y mascotas
  { value:'mascotas',          nombre:'Mascotas',            icono:'paw-outline' },
  { value:'ninera',            nombre:'Niñera',              icono:'happy-outline' },
  { value:'adultos_mayores',   nombre:'Adultos mayores',     icono:'people-outline' },
  { value:'clases',            nombre:'Clases particulares', icono:'book-outline' },
  // Informatica
  { value:'informatica',       nombre:'Informática y redes', icono:'laptop-outline' },
  { value:'celulares',         nombre:'Celulares',           icono:'phone-portrait-outline' },
]

const SIN_CATEGORIA: Categoria = { value:'', nombre:'Servicios', icono:'briefcase-outline' }

export function categoriaInfo(value?: string | null): Categoria {
  return CATEGORIAS.find(c => c.value === value) ?? SIN_CATEGORIA
}
