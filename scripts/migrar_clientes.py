import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import math

# Cargar variables de entorno desde el archivo .env.local de Next.js
load_dotenv(dotenv_path='../barber-pro-web/.env.local')

# Configuración de Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: No se encontraron las credenciales de Supabase en .env.local")
    print("Asegúrate de ejecutar este script desde la carpeta 'scripts' y que .env.local exista en 'barber-pro-web'.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def limpiar_valor(valor, tipo_esperado):
    """Limpia los valores vacíos o NaN del Excel para que Supabase los acepte"""
    if pd.isna(valor) or valor == "" or str(valor).strip() == "":
        if tipo_esperado == "numero":
            return 0
        return None
    
    if tipo_esperado == "string":
        return str(valor).strip()
    
    if tipo_esperado == "numero":
        try:
            return float(valor)
        except:
            return 0
    return valor

def migrar_datos(archivo_excel="clientes.xlsx"):
    print(f"🔄 Iniciando lectura del archivo: {archivo_excel}")
    
    if not os.path.exists(archivo_excel):
        print(f"❌ ERROR: El archivo {archivo_excel} no existe en esta carpeta.")
        return

    try:
        df = pd.read_excel(archivo_excel)
        print(f"📊 Se encontraron {len(df)} registros para procesar.")
    except Exception as e:
        print(f"❌ ERROR al leer el Excel: {e}")
        return

    exitosos = 0
    errores = 0

    for index, row in df.iterrows():
        nombre = limpiar_valor(row.get('Nombre'), "string")
        
        if not nombre:
            print(f"⚠️ Fila {index+2} ignorada: No tiene nombre.")
            errores += 1
            continue

        # Mapeo de columnas del Excel a las columnas de la tabla 'clientes' en Supabase
        cliente_data = {
            "nombre": nombre,
            "telefono": limpiar_valor(row.get('Telefono'), "string"),
            "email": limpiar_valor(row.get('Email'), "string"),
            "cumpleanos": limpiar_valor(row.get('Cumpleaños'), "string"), # Espera formato YYYY-MM-DD
            "notas": limpiar_valor(row.get('Notas'), "string"),
            "total_visitas": int(limpiar_valor(row.get('Visitas_Totales'), "numero")),
            "total_gastado": limpiar_valor(row.get('Dinero_Gastado'), "numero"),
        }

        try:
            # Insertar en Supabase
            respuesta = supabase.table("clientes").insert(cliente_data).execute()
            print(f"✅ Migrado: {nombre} (Visitas: {cliente_data['total_visitas']})")
            exitosos += 1
        except Exception as e:
            print(f"❌ Error al migrar {nombre}: {e}")
            errores += 1

    print("\n" + "="*40)
    print("🚀 MIGRACIÓN FINALIZADA")
    print(f"✅ Registros Exitosos: {exitosos}")
    print(f"❌ Errores/Ignorados: {errores}")
    print("="*40)

if __name__ == "__main__":
    migrar_datos("clientes.xlsx")
