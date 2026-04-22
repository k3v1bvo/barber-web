-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear la tabla de asistencias
CREATE TABLE public.asistencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    hora_salida TIMESTAMP WITH TIME ZONE,
    horas_trabajadas NUMERIC(5,2),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurar políticas de seguridad (RLS)
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias asistencias (o administradores ven todas)
CREATE POLICY "Usuarios pueden ver sus asistencias y admin todas" 
ON public.asistencias FOR SELECT 
USING (
    auth.uid() = profile_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Política: Los usuarios pueden insertar sus propias asistencias
CREATE POLICY "Usuarios pueden insertar sus asistencias" 
ON public.asistencias FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

-- Política: Los usuarios pueden actualizar sus propias asistencias (marcar salida)
CREATE POLICY "Usuarios pueden actualizar sus asistencias" 
ON public.asistencias FOR UPDATE 
USING (auth.uid() = profile_id);

-- 3. Crear índice para optimizar consultas por fecha y usuario
CREATE INDEX idx_asistencias_profile_fecha ON public.asistencias(profile_id, fecha);
