// Tipos principales para Barber Pro Web

export type Role = 'admin' | 'recepcionista' | 'barbero' | 'cliente'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: Role
  is_active: boolean
  comision_porcentaje: number
  created_at: string
}

export interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  duracion_minutos: number
  color: string
  is_active: boolean
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  cumpleanos: string | null
  notas: string | null
  total_visitas: number
  total_gastado: number
  ultima_visita: string | null
}

export interface Cita {
  id: string
  cliente_id: string | null
  barbero_id: string | null
  servicio_id: string | null
  estado: 'pendiente' | 'confirmado' | 'en_proceso' | 'completado' | 'cancelado' | 'no_presento'
  fecha_hora: string
  duracion_real_minutos: number | null
  precio: number
  comision_barbero: number | null
  metodo_pago: string | null
  propinas: number
  productos_adicionales: any
  notas: string | null
  // Joined data
  cliente?: Cliente
  barbero?: Profile
  servicio?: Servicio
}

export interface Producto {
  id: string
  nombre: string
  sku: string | null
  descripcion: string | null
  stock_actual: number
  stock_minimo: number
  precio_costo: number | null
  precio_venta: number
  categoria: string | null
  is_active: boolean
}

export interface Asistencia {
  id: string
  profile_id: string
  fecha: string
  hora_entrada: string
  hora_salida: string | null
  horas_trabajadas: number | null
  notas: string | null
  created_at: string
  profile?: Profile
}