# Guía de Migración de Base de Datos (Excel a Supabase)

Esta herramienta automatizada fue diseñada por tu equipo de ingeniería para importar el historial de clientes de tu cliente directamente al nuevo sistema **BarberWeb**, asegurando que conserven sus datos en el "Salón de la Fama" y su nivel en el "Loyalty Circle".

## 1. Preparación del Entorno (Solo la primera vez)

Necesitas tener **Python** instalado en tu computadora. Abre una terminal (o PowerShell) en esta carpeta (`scripts`) y ejecuta el siguiente comando para instalar las librerías necesarias:

```bash
pip install pandas supabase openpyxl python-dotenv
```

## 2. Generar la Plantilla (Opcional pero recomendado)

Para que el script funcione, el Excel debe tener las columnas escritas de manera exacta. Para facilitar esto, hemos creado un generador automático de plantilla.

Ejecuta:
```bash
python generar_plantilla.py
```
> Esto creará un archivo llamado `clientes.xlsx` en esta misma carpeta.
> **Instrucción:** Entrégale ese archivo Excel a tu cliente para que copie y pegue su base de datos antigua dentro de él. (O hazlo tú mismo). Recuerda borrar los datos de ejemplo (Juan Pérez, etc.) y solo dejar los reales.

## 3. Consideraciones de los Datos en el Excel
*   **Nombre:** Es obligatorio. Si la fila no tiene nombre, el script la ignorará.
*   **Visitas_Totales:** Escribe solo el número (ej: `5`). Si está vacío, el script le pondrá `0`.
*   **Dinero_Gastado:** Escribe el monto numérico sin símbolos de moneda (ej: `150.50`).
*   **Cumpleaños:** Preferiblemente en formato `YYYY-MM-DD` (ej: 1995-12-30).

## 4. Ejecutar la Migración

Una vez que el archivo `clientes.xlsx` tenga los datos reales de los clientes y esté guardado en esta carpeta (`scripts`), simplemente ejecuta:

```bash
python migrar_clientes.py
```

### ¿Qué sucederá?
1. El script leerá de manera automática el archivo `.env.local` que está en tu carpeta de Next.js para saber cómo conectarse a tu Supabase de forma segura.
2. Empezará a importar cliente por cliente. Verás en la consola un mensaje verde ✅ por cada éxito o rojo ❌ si hubo algún error en una fila específica.
3. ¡Felicidades! Todos los clientes aparecerán al instante en tu base de datos y en el Dashboard de BarberWeb con su respectivo historial de visitas intacto.
