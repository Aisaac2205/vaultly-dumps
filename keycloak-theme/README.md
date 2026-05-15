# Tema Custom de Keycloak — Vaultly

## Estructura

```
vaultly/
└── login/
    ├── theme.properties          # Config del tema (hereda de keycloak base)
    ├── login.ftl                 # Template FreeMarker del login
    ├── messages/
    │   └── messages_es.properties # Traducciones español
    └── resources/
        ├── css/
        │   └── styles.css        # Estilos custom (réplica del diseño React)
        └── img/
            └── favicon.svg       # Logo Vaultly
```

## Cómo deployar

### Opción A: Copiar al servidor (más simple)

1. Copiar la carpeta `vaultly/` completa al directorio de themes de Keycloak:
   ```
   /opt/keycloak/themes/vaultly/
   ```
   o en Docker:
   ```
   /opt/keycloak/themes/vaultly/
   ```

2. Reiniciar Keycloak (o hot-reload si está habilitado)

3. En el Admin Console de Keycloak:
   - Ir a **Realm Settings** → **Themes**
   - En **Login Theme** seleccionar: `vaultly`
   - Guardar

### Opción B: Build como JAR (producción)

```bash
# Desde la raíz del tema
jar -cvf vaultly-theme.jar -C vaultly .

# Copiar el JAR al classpath de Keycloak
cp vaultly-theme.jar /opt/keycloak/providers/
```

### Opción C: Docker

Agregar al Dockerfile de Keycloak:
```dockerfile
COPY vaultly/ /opt/keycloak/themes/vaultly/
```

## Qué hace este tema

- **Réplica exacta** del diseño de login de Vaultly (dos columnas, panel negro con íconos flotantes)
- **Responsive**: en mobile se oculta el panel derecho
- **Español rioplatense**: textos en voseo ("Ingresá", "Gestioná")
- **Hereda de keycloak base**: funciona con MFA, reset password, registro, etc.
- **PKCE compatible**: no toca el flow de OAuth, solo cambia la UI

## Notas

- El CSS oculta elementos default de Keycloak que no necesitamos (header, locale selector)
- Los íconos flotantes usan SVG inline (no dependen de archivos externos)
- El patrón de fondo es un SVG data-uri (no necesita archivo externo)
