// Categorias de servicio. El value es lo que guarda el backend en Servicio.categoria
// (lista validada en src/modules/servicios/categorias.js del backend — mantener en sync).
export interface Categoria {
  value:  string
  nombre: string
  ico:    string
}

export const CATEGORIAS: Categoria[] = [
  // Hogar
  { value:'plomeria',          nombre:'Plomería',            ico:'🔧' },
  { value:'electricidad',      nombre:'Electricidad',        ico:'⚡' },
  { value:'gasista',           nombre:'Gasista',             ico:'🔥' },
  { value:'cerrajeria',        nombre:'Cerrajería',          ico:'🔑' },
  { value:'climatizacion',     nombre:'Aire acondicionado',  ico:'❄️' },
  { value:'electrodomesticos', nombre:'Electrodomésticos',   ico:'🔌' },
  // Construccion
  { value:'albanileria',       nombre:'Albañilería',         ico:'🏗️' },
  { value:'carpinteria',       nombre:'Carpintería',         ico:'🪟' },
  { value:'pintura',           nombre:'Pintura',             ico:'🎨' },
  { value:'herreria',          nombre:'Herrería',            ico:'⚒️' },
  { value:'techos',            nombre:'Techos',              ico:'🏠' },
  { value:'durlock',           nombre:'Durlock y yesería',   ico:'🧱' },
  { value:'vidrieria',         nombre:'Vidriería',           ico:'🪞' },
  // Exterior y limpieza
  { value:'jardin',            nombre:'Jardín',              ico:'🌿' },
  { value:'limpieza',          nombre:'Limpieza',            ico:'🧹' },
  { value:'fumigacion',        nombre:'Fumigación',          ico:'🐜' },
  { value:'tapizados',         nombre:'Lavado de tapizados', ico:'🛋️' },
  // Servicios varios
  { value:'mudanzas',          nombre:'Mudanzas y fletes',   ico:'🚚' },
  { value:'armado_muebles',    nombre:'Armado de muebles',   ico:'🪑' },
  // Personas y mascotas
  { value:'mascotas',          nombre:'Mascotas',            ico:'🐕' },
  { value:'ninera',            nombre:'Niñera',              ico:'👶' },
  { value:'adultos_mayores',   nombre:'Adultos mayores',     ico:'🧓' },
  { value:'clases',            nombre:'Clases particulares', ico:'📚' },
  // Informatica
  { value:'informatica',       nombre:'Informática y redes', ico:'💻' },
  { value:'celulares',         nombre:'Celulares',           ico:'📱' },
]

const SIN_CATEGORIA: Categoria = { value:'', nombre:'Servicios', ico:'🔨' }

export function categoriaInfo(value?: string | null): Categoria {
  return CATEGORIAS.find(c => c.value === value) ?? SIN_CATEGORIA
}
