import os

files_to_update = [
    r'c:\Users\LENOVO\Desktop\Proyectos\solago\src\context\PuntoNexusContext.jsx',
    r'c:\Users\LENOVO\Desktop\Proyectos\solago\src\App.jsx',
    r'c:\Users\LENOVO\Desktop\Proyectos\solago\src\components\Login.jsx',
    r'c:\Users\LENOVO\Desktop\Proyectos\solago\src\utils\receiptGenerator.js'
]

for file_path in files_to_update:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            c = f.read()
        
        c = c.replace('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80', '/logo.png')
        c = c.replace("'Punto Nexus'", "'SoLago'")
        c = c.replace('"Punto Nexus"', '"SoLago"')
        c = c.replace('Punto Nexus', 'SoLago')
        c = c.replace('PUNTO NEXUS', 'SOLAGO')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(c)
        print('Actualizado exitosamente:', file_path)
