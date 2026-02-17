# ? Temporizador para Asambleas

Aplicación web para controlar el tiempo de participación de personas en asambleas, reuniones o eventos. Funciona completamente en el navegador con HTML, CSS y JavaScript, sin necesidad de servidor.

---

## Características

### Lista de personas
- Agrega personas con su nombre y un tiempo asignado (horas, minutos, segundos).
- Elimina personas individualmente o limpia toda la lista.
- Selecciona una persona haciendo clic en su nombre.
- Los datos se guardan automáticamente en **localStorage** durante **7 días**.

### Temporizador
- **Modo Ascendente (?):** Cuenta desde `00:00:00` hacia arriba.
- **Modo Descendente (?):** Cuenta desde el tiempo asignado hacia abajo. Al llegar a cero, sigue contando y muestra el tiempo extra con un `+` en rojo.

### Modo Presentación
- Pantalla completa con fondo negro ideal para proyectar.
- Muestra el nombre del participante (arriba, en blanco) y el temporizador (grande, al centro).
- Notificación visual al guardar un registro con la tecla `G`.

### Registro de tiempos (tecla G)
- Al presionar `G` se guarda un registro con:
  - Nombre de la persona
  - Tiempo asignado
  - Tiempo usado
  - Fecha y hora del registro
- Si no se presionó `G`, el tiempo se **guarda automáticamente** al cambiar de persona con las flechas.
- No se duplican registros: si ya se guardó con `G`, no se vuelve a guardar al navegar.

---

## Controles de teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Iniciar / Pausar el temporizador |
| `?` Flecha izquierda | Persona anterior |
| `?` Flecha derecha | Persona siguiente |
| `?` Flecha arriba | Cambiar a modo ascendente |
| `?` Flecha abajo | Cambiar a modo descendente |
| `G` | Guardar el tiempo actual en registros |
| `Esc` | Salir del modo presentación |

---

## Tecnologías

- **HTML5** — Estructura de la aplicación
- **CSS3** — Estilos, animaciones y diseño responsivo
- **JavaScript (Vanilla)** — Lógica del temporizador, navegación y almacenamiento
- **localStorage** — Persistencia de datos (personas y registros) por 7 días

---

## Uso

1. Abre `index.html` en cualquier navegador.
2. Escribe el nombre de una persona, configura el tiempo (HH:MM:SS) y presiona **Agregar**.
3. Repite para todas las personas de la asamblea.
4. Presiona **Iniciar Presentación** para entrar al modo pantalla completa.
5. Usa `Espacio` para iniciar/pausar y `? ?` para navegar entre personas.
6. Presiona `G` para guardar el tiempo en cualquier momento.
7. Presiona `Esc` para volver a la vista de configuración y revisar los registros.  
