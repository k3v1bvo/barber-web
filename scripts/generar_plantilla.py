import pandas as pd

def crear_plantilla():
    # Definir las columnas exactas que espera el script de migración
    columnas = [
        "Nombre", 
        "Telefono", 
        "Email", 
        "Cumpleaños", 
        "Visitas_Totales", 
        "Dinero_Gastado", 
        "Notas"
    ]
    
    # Datos de ejemplo para guiar al cliente
    datos_ejemplo = [
        ["Juan Pérez", "+1234567890", "juan@email.com", "1990-05-14", 8, 120.50, "Prefiere fade bajo. Cliente VIP."],
        ["Carlos López", "0987654321", "", "", 2, 30.00, "Alérgico a ceras perfumadas"],
        ["", "", "", "", "", "", "<- BORRA ESTAS FILAS DE EJEMPLO ANTES DE USAR"]
    ]
    
    # Crear un DataFrame con pandas
    df = pd.DataFrame(datos_ejemplo, columns=columnas)
    
    # Exportar a Excel
    nombre_archivo = "clientes.xlsx"
    df.to_excel(nombre_archivo, index=False)
    
    print(f"✅ ¡Plantilla '{nombre_archivo}' generada con éxito!")
    print("Entrégale este archivo a tu cliente para que pegue allí sus datos históricos.")

if __name__ == "__main__":
    crear_plantilla()
