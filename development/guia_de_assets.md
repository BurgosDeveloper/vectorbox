# Guía Completa de Assets Visuales e Iconografía - SubliAcrilico

Para lograr el acabado estético y profesional de un SaaS de **$10,000 USD**, la consistencia visual, la calidad de las imágenes y la correcta elección de iconos son fundamentales. Esta guía te indica exactamente qué conseguir y cómo estructurar la iconografía del sistema.

---

## 1. Inventario de Imágenes a Conseguir (Total: 7 Recursos Clave)

Para lanzar la web con una identidad impecable, necesitas conseguir exactamente **7 archivos visuales**:

| # | Archivo | Dimensiones | Formato | Propósito y Descripción Visual |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `logo-horizontal` | 300 x 80 px | `.png` o `.svg` | **Logotipo de Cabecera**: El nombre "SubliAcrilico" con la tipografía elegante `Athena`. Debe tener fondo transparente para encajar sobre el fondo oscuro `#0C100E`. |
| **2** | `logo-monograma` | 150 x 150 px | `.png` o `.svg` | **Símbolo de Marca**: Iniciales "SA" entrelazadas en color bronce (`#97754D`). Usado en el footer, botones de carga (loaders) y modales de registro. |
| **3** | `favicon` | 32 x 32 px | `.png` o `.ico` | **Ícono del Navegador**: El monograma simplificado en tamaño miniatura para la pestaña web. |
| **4** | `hero-bg` | 1920 x 1080 px | `.jpg` (Optimizado) | **Fondo del Hero (Landing)**: Imagen abstracta de alta gama con texturas de acrílico cristalino, reflejos dorados y profundidad oscura sobre el color base `#0C100E`. |
| **5** | `login-bg` | 1080 x 1080 px | `.jpg` | **Fondo de Formularios**: Gradiente difuminado elegante que fusiona `#0C100E` con `#364442`, ideal para modales interactivos y pantallas de login de administración. |
| **6** | `preview-corel-default` | 600 x 600 px | `.jpg` o `.png` | **Imagen por Defecto del Catálogo**: Un mockup de alta resolución que muestre un vector en Corel Draw (ej. una lámpara acrílica iluminada, planos de corte láser o aviso publicitario premium). |
| **7** | `logos-pago-combinados` | Varios (ej. 120x50 px)| `.png` (Transparente) | **Logos de Zelle y Provincial**: Los logos oficiales de ambos métodos de pago para colocarlos en el checkout interactivo. |

---

## 2. Pautas de Iconografía Premium (Uso de Ionicons)

Para evitar una interfaz genérica y sobrecargada, utilizaremos exclusivamente la librería **Ionicons** (a través del paquete `react-icons/io5` para React). Estos iconos son sumamente limpios, geométricos, modernos y consistentes.

### 2.1. Reglas de Uso de Iconos en la Interfaz:
*   **Uniformidad de Estilo**: Usar la variante *Outline* (`IoHomeOutline`, `IoCartOutline`) para estados inactivos, y la variante *Filled* (`IoHome`, `IoCart`) para estados activos o hover.
*   **Proporción y Espaciado**: El tamaño estándar para iconos en botones y menús debe ser de **20px a 24px**. Siempre deben ir acompañados de un espaciado sutil (`gap-2` en flexbox) respecto al texto.
*   **Color de Acento**: Los iconos interactivos clave deben vestirse con el color de acento bronce (`#97754D`) o beige claro (`#C2AD90`) para guiar la vista del usuario con pocos clics.

### 2.2. Mapa de Iconos Recomendados por Sección:

#### A. Barra de Navegación & Cliente
*   **Carrito de Compras**: `IoCartOutline` (vacío) / `IoCart` (con productos).
*   **Perfil de Usuario**: `IoPersonOutline` / `IoPersonCircle`.
*   **Catálogo de Diseños**: `IoGridOutline` / `IoImagesOutline`.
*   **Historial de Compras**: `IoReceiptOutline`.
*   **Descarga de Archivos**: `IoDownloadOutline`.

#### B. Dashboard de MAFER (Administración de Ventas y Productos)
*   **Añadir Diseño**: `IoAddCircleOutline`.
*   **Gestión de Ventas**: `IoCashOutline`.
*   **Conciliación de Zelle / Provincial**: `IoCheckmarkDoneCircleOutline` (aprobaciones automáticas) o `IoDocumentAttachOutline` (subir Excel/CSV).
*   **Gestión de Usuarios**: `IoPeopleOutline`.
*   **Salir de Sesión**: `IoLogOutOutline`.

#### C. Dashboard de DEV (Métricas TI y Servidor)
*   **Usuarios Registrados**: `IoPeopleOutline`.
*   **Usuarios Activos en Línea**: `IoPulseOutline` (indica actividad en vivo).
*   **Tiempo Promedio en la Web**: `IoTimeOutline`.
*   **Facturación e Ingresos Totales**: `IoTrendingUpOutline` o `IoWalletOutline`.
*   **Configuración del Sistema**: `IoSettingsOutline`.
*   **Borrar/Gestionar Clientes (CRUD)**: `IoCreateOutline` (Editar) y `IoTrashOutline` (Borrar).

---

## 3. Recomendaciones de Optimización

1.  **Formato Moderno**: Si es posible, proporciona los logotipos en formato `.svg`. Los gráficos vectoriales nunca se pixelan y se cargan al instante.
2.  **Compresión de Fondos**: Pasa imágenes como `hero-bg.jpg` por herramientas como [TinyJPG](https://tinyjpg.com/) antes de guardarlas para asegurar que pesen menos de 300KB, mejorando drásticamente el tiempo de carga inicial de la web.
