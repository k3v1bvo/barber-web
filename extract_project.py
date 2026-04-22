import os
import glob

def extract_all_files(folder_path="."):
    """Extrae TODO el contenido de tu proyecto en un solo TXT"""
    
    output_content = []
    output_content.append("#" * 80)
    output_content.append("PROYECTO WEB - EXTRACCIÓN COMPLETA")
    output_content.append(f"📁 Carpeta: {os.path.abspath(folder_path)}")
    output_content.append(f"📅 Fecha: {os.popen('date').read().strip()}")
    output_content.append("#" * 80 + "\n\n")
    
    # Extensiones a buscar
    extensions = ['*.html', '*.css', '*.js', '*.json', '*.txt', '*.md', 'package.json', 'README*']
    
    all_files = []
    for ext in extensions:
        all_files.extend(glob.glob(ext, recursive=True))
        all_files.extend(glob.glob(f"**/{ext}", recursive=True))
    
    # Archivos individuales importantes
    important_files = ['index.html', 'style.css', 'script.js', 'main.css']
    for file in important_files:
        if os.path.exists(file):
            all_files.append(file)
    
    all_files = list(set(all_files))  # Eliminar duplicados
    all_files.sort()
    
    for filepath in all_files:
        try:
            if os.path.isfile(filepath):
                output_content.append(f"\n{'='*80}")
                output_content.append(f"📄 ARCHIVO: {filepath}")
                output_content.append(f"📏 Tamaño: {os.path.getsize(filepath)} bytes")
                output_content.append('='*80 + "\n")
                
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    output_content.append(content)
                    
        except Exception as e:
            output_content.append(f"❌ Error leyendo {filepath}: {str(e)}")
    
    # Guardar resultado
    with open("PROYECTO_COMPLETO.txt", 'w', encoding='utf-8') as f:
        f.write("\n".join(output_content))
    
    print("✅ ¡LISTO! Todo tu proyecto está en 'PROYECTO_COMPLETO.txt'")
    print(f"📊 Archivos encontrados: {len(all_files)}")
    return "PROYECTO_COMPLETO.txt"

# EJECUTAR
if __name__ == "__main__":
    archivo = extract_all_files()
    print(f"\n🎉 Copia TODO el contenido de '{archivo}' y pégalo acá!")