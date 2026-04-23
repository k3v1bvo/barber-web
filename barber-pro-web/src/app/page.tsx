'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Scissors,
  Clock,
  Phone,
  MapPin,
  Star,
  Calendar,
  ChevronRight,
  Instagram,
  Facebook,
  Mail,
  MessageCircle,
  Twitter,
  LogOut,
  LayoutDashboard,
  Loader2,
  ShoppingBag
} from 'lucide-react'

interface UserProfile {
  full_name: string
  email: string
  role: string
  avatar_url?: string
}

interface Servicio {
  id: string
  nombre: string
  descripcion: string
  precio: number
  duracion_minutos: number
}

interface Producto {
  id: string
  nombre: string
  precio_venta: number
  image_url: string | null
}

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUserAndData = async () => {
      // 1. Verificar usuario
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, role, avatar_url')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          setUser(profile as UserProfile)
        }
      }

      // 2. Cargar servicios
      const { data: serviciosData } = await supabase
        .from('servicios')
        .select('*')
        .eq('is_active', true)
        .order('nombre')

      if (serviciosData) {
        setServicios(serviciosData)
      }

      // 3. Cargar Productos Destacados
      const { data: prodsData } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta, image_url')
        .eq('is_active', true)
        .gt('stock_actual', 0)
        .limit(4)

      if (prodsData) {
        setProductos(prodsData)
      }

      setLoading(false)
    }

    checkUserAndData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      recepcionista: 'Recepcionista',
      barbero: 'Barbero',
      cliente: 'Cliente'
    }
    return roles[role] || role
  }

  const getPanelUrl = (role: string) => {
    switch (role) {
      case 'admin': return '/admin'
      case 'barbero': return '/barbero'
      case 'recepcionista': return '/recepcion'
      case 'cliente': return '/cliente'  // ✅ AGREGADO
      default: return '/'
    }
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <Scissors className="w-8 h-8 text-amber-400" />
              <span className="text-2xl font-bold tracking-wider">BarberSite</span>
            </div>

            {/* Usuario logueado o botones de auth */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* Panel según rol */}
                  <Link
                    href={getPanelUrl(user.role)}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 rounded-lg transition"
                  >
                    <LayoutDashboard size={18} />
                    <span>Panel {getRoleLabel(user.role)}</span>
                  </Link>

                  {/* Info usuario */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-amber-400 font-bold">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        getInitials(user.full_name || 'U')
                      )}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-white font-medium text-sm">{user.full_name}</p>
                      <p className="text-zinc-400 text-xs">{getRoleLabel(user.role)}</p>
                    </div>
                  </div>

                  {/* Botón cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-6 py-2 border border-amber-400 text-amber-400 rounded-full hover:bg-amber-400 hover:text-black transition uppercase text-sm tracking-widest"
                  >
                    Login
                  </Link>
                  <Link
                    href="/reservar"
                    className="px-6 py-2 bg-amber-400 text-black rounded-full hover:bg-amber-300 transition uppercase text-sm font-bold tracking-widest"
                  >
                    Reservar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            ESTILO <span className="text-amber-400">CLÁSICO</span><br />
            MODERNO
          </h1>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Donde la tradición barbera se encuentra con la innovación.
            Experimenta el arte del cuidado masculino en su máxima expresión.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {user ? (
              <Link
                href={getPanelUrl(user.role)}
                className="inline-flex items-center justify-center gap-2 bg-amber-400 text-black px-8 py-4 rounded-full font-bold hover:bg-amber-300 transition transform hover:scale-105 uppercase tracking-widest"
              >
                <Calendar className="w-5 h-5" />
                Ir al Panel
              </Link>
            ) : (
              <Link
                href="/reservar"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 text-black px-8 py-4 rounded-full font-bold hover:bg-amber-300 transition transform hover:scale-105 uppercase tracking-widest"
              >
                <Calendar className="w-5 h-5" />
                Reservar Cita
              </Link>
            )}
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-2 border border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-black transition uppercase tracking-widest"
            >
              <ShoppingBag className="w-5 h-5" />
              Explorar Tienda
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-8 h-8 text-white/50 rotate-90" />
        </div>
      </section>

      {/* Info Bar */}
      <div className="bg-amber-400 text-black py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Lun-Sáb: 9:00 - 21:00
          </span>
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            +591 71234567
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Edif. Antezana, C. Sucre, Cbba
          </span>
        </div>
      </div>

      {/* Servicios */}
      <section id="servicios" className="py-24 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 uppercase tracking-widest text-sm font-bold mb-4">Nuestros Servicios</p>
            <h2 className="text-5xl font-bold">Cortes & Estilos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios?.map((servicio) => (
              <div
                key={servicio.id}
                className="group bg-black border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/50 transition-all duration-300"
              >
                <div className="h-1 bg-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold">{servicio.nombre}</h3>
                  </div>

                  <p className="text-gray-400 mb-4 min-h-12">
                    {servicio.descripcion || 'Servicio premium de barbería'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-3xl font-bold text-amber-400">{formatCurrency(servicio.precio)}</p>
                      <p className="text-sm text-gray-500">{servicio.duracion_minutos} min</p>
                    </div>
                    {user ? (
                      <Link
                        href={getPanelUrl(user.role)}
                        className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-amber-400 transition"
                      >
                        Ir al Panel
                      </Link>
                    ) : (
                      <Link
                        href="/register"
                        className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-amber-400 transition"
                      >
                        Reservar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!servicios || servicios.length === 0) && (
            <div className="text-center py-16">
              <Scissors className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay servicios disponibles</p>
              <Link href="/login" className="text-amber-400 hover:underline">
                Inicia sesión para gestionar servicios →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Acerca de */}
      <section id="acerca" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800"
                  alt="Barbería"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-amber-400 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-black">10+</p>
                  <p className="text-sm text-black/70 uppercase tracking-widest">Años</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-amber-400 uppercase tracking-widest text-sm font-bold mb-4">Acerca de Nosotros</p>
              <h2 className="text-5xl font-bold mb-6">La Mejor Barbería<br />de la Ciudad</h2>
              <p className="text-gray-400 mb-6 text-lg">
                En BarberSite, combinamos técnicas tradicionales con las últimas tendencias
                para ofrecerte una experiencia única. Nuestro compromiso es con la excelencia
                en cada detalle, desde el momento en que entras hasta que sales luciendo
                tu mejor versión.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                {[
                  { numero: '5000+', texto: 'Clientes Satisfechos' },
                  { numero: '15+', texto: 'Barberos Expertos' },
                  { numero: '4.9', texto: 'Rating Promedio' },
                  { numero: '100%', texto: 'Garantía' }
                ].map((item, i) => (
                  <div key={i} className="text-center p-4 bg-zinc-900 rounded-xl">
                    <p className="text-3xl font-bold text-amber-400">{item.numero}</p>
                    <p className="text-sm text-gray-400">{item.texto}</p>
                  </div>
                ))}
              </div>

              {user ? (
                <Link
                  href={getPanelUrl(user.role)}
                  className="inline-flex items-center gap-2 bg-amber-400 text-black px-8 py-4 rounded-full font-bold hover:bg-amber-300 transition"
                >
                  Ir al Panel
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-amber-400 text-black px-8 py-4 rounded-full font-bold hover:bg-amber-300 transition"
                >
                  Agenda Tu Cita
                  <ChevronRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tienda Pro Destacados */}
      {productos.length > 0 && (
        <section id="tienda" className="py-24 bg-black border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-amber-400 uppercase tracking-widest text-sm font-bold mb-4">Productos Premium</p>
              <h2 className="text-5xl font-bold">Tienda</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {productos.map((producto) => (
                <div key={producto.id} className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5 group hover:border-amber-500/30 transition-all">
                  <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                    <img
                      src={producto.image_url || 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500'}
                      alt={producto.nombre}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-bold mb-2 line-clamp-1">{producto.nombre}</h3>
                    <p className="text-amber-500 font-black text-xl mb-4">{formatCurrency(producto.precio_venta)}</p>
                    <Link href="/tienda" className="inline-block w-full py-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-lg text-sm font-bold uppercase tracking-widest transition-colors border border-white/10 hover:border-amber-500">
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-amber-500 text-amber-500 px-8 py-4 rounded-full font-bold hover:bg-amber-500 hover:text-black transition uppercase tracking-widest"
              >
                <ShoppingBag className="w-5 h-5" />
                Catálogo Completo
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Equipo */}
      <section id="equipo" className="py-24 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 uppercase tracking-widest text-sm font-bold mb-4">Nuestro Equipo</p>
            <h2 className="text-5xl font-bold">Barberos Expertos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { nombre: 'Carlos Rodríguez', especialidad: 'Cortes Clásicos', imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
              { nombre: 'Miguel Ángel', especialidad: 'Fade & Design', imagen: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
              { nombre: 'José Martínez', especialidad: 'Barba & Afeitado', imagen: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400' }
            ].map((barbero, i) => (
              <div key={i} className="group text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-64 h-64 rounded-full overflow-hidden mx-auto">
                    <img
                      src={barbero.imagen}
                      alt={barbero.nombre}
                      className="w-full h-full object-cover blur-[3px] grayscale opacity-70 group-hover:blur-[0px] group-hover:grayscale-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-500"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                    {barbero.especialidad}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{barbero.nombre}</h3>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 uppercase tracking-widest text-sm font-bold mb-4">Testimonios</p>
            <h2 className="text-5xl font-bold">Lo Que Dicen</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                nombre: 'Carlos M.',
                texto: 'El mejor corte que he tenido. Los barberos son verdaderos profesionales que conocen su oficio.',
                estrellas: 5
              },
              {
                nombre: 'Ana G.',
                texto: 'Excelente atención y ambiente. Mi esposo siempre queda satisfecho con su corte.',
                estrellas: 5
              },
              {
                nombre: 'Roberto D.',
                texto: 'Desde que descubrí BarberSite, no voy a otro lugar. Calidad garantizada y precios justos.',
                estrellas: 5
              }
            ].map((testimonio, i) => (
              <div key={i} className="bg-zinc-900 p-8 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonio.estrellas }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonio.texto}"</p>
                <p className="font-bold text-amber-400">{testimonio.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-24 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <p className="text-amber-400 uppercase tracking-widest text-sm font-bold mb-4">Contacto</p>
              <h2 className="text-5xl font-bold mb-6">Visítanos</h2>
              <p className="text-gray-400 mb-8 text-lg">
                Estamos ubicados en un lugar privilegiado. ¡Te esperamos!
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Dirección</h3>
                    <p className="text-gray-400">Edif. Antezana, calle Sucre, Cochabamba</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Teléfono</h3>
                    <p className="text-gray-400">+591 71234567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Horario</h3>
                    <p className="text-gray-400">Lunes a Sábado: 9:00 - 21:00<br />Domingo: Cerrado</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Email</h3>
                    <p className="text-gray-400">info@BarberSite.com</p>
                  </div>
                </div>
              </div>

              {/* Redes sociales */}
              <div className="flex gap-4 mt-8">
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-400 transition">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-400 transition">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-400 transition">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-400 transition">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Mapa */}
            <div className="bg-zinc-800 rounded-2xl overflow-hidden h-[500px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.3821644859213!2d-66.1548148237828!3d-17.393438064360744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e3730afb6974d5%3A0xf6413d9e8b60ca50!2sBarber%20Site!5e0!3m2!1ses-419!2sbo!4v1771741041111!5m2!1ses-419!2sbo"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Info Bar Bottom */}
      <div className="bg-amber-400 text-black py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Lun-Sáb: 9:00 - 21:00
          </span>
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            +591 71234567
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Edif. Antezana, C. Sucre, Cbba
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Scissors className="w-8 h-8 text-amber-400" />
              <span className="text-xl font-bold tracking-wider">BarberSite</span>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <a href="#servicios" className="hover:text-amber-400 transition">Servicios</a>
              <a href="#acerca" className="hover:text-amber-400 transition">Nosotros</a>
              <a href="#tienda" className="hover:text-amber-400 transition">Tienda</a>
              <a href="#equipo" className="hover:text-amber-400 transition">Equipo</a>
              <a href="#contacto" className="hover:text-amber-400 transition">Contacto</a>
            </div>

            <p className="text-gray-500 text-sm">
              © 2026 BarberSite. Todos los derechos reservados. Cochabamba, Bolivia. -k3v1bvo Studios, designed by k3v1bvo-
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}