// Clase principal de la aplicación
class ProductosApp {
    constructor() {
        this.productoAEliminar = null;
        this.inicializada = false;
        
        this.init();
    }

    // Inicializar la aplicación
    async init() {
        try {
            console.log('Inicializando aplicación...');
            
            // Verificar conexión con la API
            const conexionOK = await api.verificarConexion();
            if (!conexionOK) {
                UI.mostrarToast('No se puede conectar con el servidor. Verifique que la API esté ejecutándose en http://localhost:3000', 'error', 10000);
                return;
            }

            // Configurar event listeners
            this.configurarEventListeners();
            
            // Cargar categorías
            await this.cargarCategorias();
            
            // Cargar productos iniciales
            await this.cargarProductos();
            
            this.inicializada = true;
            
        } catch (error) {
            console.error('Error al inicializar aplicación:', error);
            UI.mostrarToast('Error al inicializar la aplicación: ' + error.message, 'error');
        }
    }

    // Configurar todos los event listeners
    configurarEventListeners() {
        // Botón nuevo producto
        if (UI.btnNuevoProducto) {
            UI.btnNuevoProducto.addEventListener('click', () => this.mostrarFormularioNuevo());
        }

        // Botones de filtros
        if (UI.btnAplicarFiltros) {
            UI.btnAplicarFiltros.addEventListener('click', () => this.aplicarFiltros());
        }
        
        if (UI.btnLimpiarFiltros) {
            UI.btnLimpiarFiltros.addEventListener('click', () => this.limpiarFiltros());
        }

        // Modal producto
        if (UI.btnCerrarModal) {
            UI.btnCerrarModal.addEventListener('click', () => UI.ocultarModal());
        }
        
        if (UI.btnCancelar) {
            UI.btnCancelar.addEventListener('click', () => UI.ocultarModal());
        }
        
        if (UI.formProducto) {
            UI.formProducto.addEventListener('submit', (e) => this.manejarSubmitFormulario(e));
        }

        // Modal confirmación
        if (UI.btnConfirmarEliminar) {
            UI.btnConfirmarEliminar.addEventListener('click', () => this.eliminarProducto());
        }
        
        if (UI.btnCancelarEliminar) {
            UI.btnCancelarEliminar.addEventListener('click', () => UI.ocultarModalConfirmacion());
        }

        // Cerrar modales al hacer clic fuera
        if (UI.modalProducto) {
            UI.modalProducto.addEventListener('click', (e) => {
                if (e.target === UI.modalProducto) {
                    UI.ocultarModal();
                }
            });
        }

        if (UI.modalConfirmacion) {
            UI.modalConfirmacion.addEventListener('click', (e) => {
                if (e.target === UI.modalConfirmacion) {
                    UI.ocultarModalConfirmacion();
                }
            });
        }

        // Escape key para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (UI.modalProducto && !UI.modalProducto.classList.contains('hidden')) {
                    UI.ocultarModal();
                }
                if (UI.modalConfirmacion && !UI.modalConfirmacion.classList.contains('hidden')) {
                    UI.ocultarModalConfirmacion();
                }
            }
        });

        // Filtros en tiempo real
        this.configurarFiltrosEnTiempoReal();

        // Validación en tiempo real del formulario
        this.configurarValidacionTiempoReal();
    }

    // Configurar filtros en tiempo real
    configurarFiltrosEnTiempoReal() {
        let timeoutId;

        const aplicarFiltrosConRetraso = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => this.aplicarFiltros(), 500);
        };

        if (UI.filtroPrecioMinInput) {
            UI.filtroPrecioMinInput.addEventListener('input', aplicarFiltrosConRetraso);
        }
        
        if (UI.filtroPrecioMaxInput) {
            UI.filtroPrecioMaxInput.addEventListener('input', aplicarFiltrosConRetraso);
        }
        
        if (UI.filtroCategoriaSelect) {
            UI.filtroCategoriaSelect.addEventListener('change', () => this.aplicarFiltros());
        }
        
        if (UI.filtroDisponibleSelect) {
            UI.filtroDisponibleSelect.addEventListener('change', () => this.aplicarFiltros());
        }
    }

    // Configurar validación en tiempo real
    configurarValidacionTiempoReal() {
        const campos = ['nombre', 'descripcion', 'precio', 'stock', 'categoria'];
        
        campos.forEach(campo => {
            const input = document.getElementById(campo);
            if (input) {
                input.addEventListener('blur', () => this.validarCampo(campo));
                input.addEventListener('input', () => {
                    // Limpiar error cuando el usuario empiece a escribir
                    const errorElement = document.getElementById(`error${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
                    if (errorElement && !errorElement.classList.contains('hidden')) {
                        input.classList.remove('input-error');
                        errorElement.classList.add('hidden');
                    }
                });
            }
        });
    }

    // Validar campo individual
    validarCampo(campo) {
        const input = document.getElementById(campo);
        if (!input) return true;
        
        const valor = input.value.trim();
        let esValido = true;
        let mensaje = '';

        switch (campo) {
            case 'nombre':
                if (!valor || valor.length < 2 || valor.length > 100) {
                    mensaje = 'El nombre debe tener entre 2 y 100 caracteres';
                    esValido = false;
                }
                break;
            case 'descripcion':
                if (!valor || valor.length < 10 || valor.length > 500) {
                    mensaje = 'La descripción debe tener entre 10 y 500 caracteres';
                    esValido = false;
                }
                break;
            case 'precio':
                const precio = parseFloat(valor);
                if (isNaN(precio) || precio <= 0) {
                    mensaje = 'El precio debe ser un número mayor a 0';
                    esValido = false;
                }
                break;
            case 'stock':
                const stock = parseInt(valor);
                if (isNaN(stock) || stock < 0) {
                    mensaje = 'El stock debe ser un número mayor o igual a 0';
                    esValido = false;
                }
                break;
            case 'categoria':
                if (!valor) {
                    mensaje = 'Debe seleccionar una categoría';
                    esValido = false;
                }
                break;
        }

        if (!esValido) {
            UI.mostrarErrorCampo(campo, mensaje);
        }

        return esValido;
    }

    // Cargar categorías desde la API
    async cargarCategorias() {
        try {
            const response = await api.obtenerCategorias();
            if (response.success && response.data) {
                UI.llenarSelectCategorias(response.data);
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            UI.mostrarToast('Error al cargar categorías: ' + error.message, 'error');
            
            // Fallback con categorías hardcodeadas
            const categoriasDefault = [
                'Electrónicos', 'Ropa', 'Hogar', 'Deportes', 'Libros', 
                'Juguetes', 'Alimentación', 'Belleza', 'Automóvil', 'Otros'
            ];
            UI.llenarSelectCategorias(categoriasDefault);
        }
    }

    // Cargar productos con filtros y paginación
    async cargarProductos(page = 1) {
        try {
            UI.currentPage = page;
            const filtros = UI.obtenerFiltros();
            UI.currentFilters = filtros;

            const response = await api.obtenerProductos(filtros, page, UI.itemsPerPage);
            
            if (response.success) {
                UI.renderizarTablaProductos(response.data, response.pagination);
            } else {
                throw new Error(response.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            UI.mostrarToast('Error al cargar productos: ' + error.message, 'error');
            UI.renderizarTablaProductos([], null);
        }
    }

    // Mostrar formulario para nuevo producto
    mostrarFormularioNuevo() {
        UI.limpiarFormulario();
        UI.mostrarModal('Nuevo Producto');
    }

    // Editar producto existente
    async editarProducto(id) {
        try {
            const response = await api.obtenerProductoPorId(id);
            
            if (response.success && response.data) {
                UI.llenarFormulario(response.data);
                UI.mostrarModal('Editar Producto');
            } else {
                throw new Error(response.message || 'Producto no encontrado');
            }
        } catch (error) {
            console.error('Error al cargar producto para editar:', error);
            UI.mostrarToast('Error al cargar producto: ' + error.message, 'error');
        }
    }

    // Manejar submit del formulario
    async manejarSubmitFormulario(e) {
        e.preventDefault();
        
        if (!UI.validarFormulario()) {
            UI.mostrarToast('Por favor corrija los errores en el formulario', 'warning');
            return;
        }

        const datos = UI.obtenerDatosFormulario();
        const esEdicion = !!UI.productoEditando;
        
        try {
            UI.setButtonLoading(UI.btnGuardar, true);
            
            let response;
            if (esEdicion) {
                response = await api.actualizarProducto(UI.productoEditando._id, datos);
            } else {
                response = await api.crearProducto(datos);
            }
            
            if (response.success) {
                UI.ocultarModal();
                await this.cargarProductos(UI.currentPage);
                
                const mensaje = esEdicion ? 'Producto actualizado correctamente' : 'Producto creado correctamente';
                UI.mostrarToast(mensaje, 'success');
            } else {
                throw new Error(response.message || 'Error al guardar el producto');
            }
            
        } catch (error) {
            console.error('Error al guardar producto:', error);
            
            // Manejar errores de validación del servidor
            if (error.message.includes('validación') || error.message.includes('Ya existe')) {
                UI.mostrarToast(error.message, 'warning');
            } else {
                UI.mostrarToast('Error al guardar producto: ' + error.message, 'error');
            }
        } finally {
            UI.setButtonLoading(UI.btnGuardar, false);
        }
    }

    // Confirmar eliminación de producto
    confirmarEliminarProducto(id, nombre) {
        this.productoAEliminar = { id, nombre };
        UI.mostrarModalConfirmacion();
    }

    // Eliminar producto
    async eliminarProducto() {
        if (!this.productoAEliminar) return;

        try {
            UI.setButtonLoading(UI.btnConfirmarEliminar, true);
            
            const response = await api.eliminarProducto(this.productoAEliminar.id);
            
            if (response.success) {
                UI.ocultarModalConfirmacion();
                
                // Si eliminamos el último producto de la página actual, volver a la anterior
                const paginaActual = UI.currentPage;
                await this.cargarProductos(paginaActual);
                
                UI.mostrarToast(`Producto "${this.productoAEliminar.nombre}" eliminado correctamente`, 'success');
            } else {
                throw new Error(response.message || 'Error al eliminar el producto');
            }
            
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            UI.mostrarToast('Error al eliminar producto: ' + error.message, 'error');
        } finally {
            UI.setButtonLoading(UI.btnConfirmarEliminar, false);
            this.productoAEliminar = null;
        }
    }

    // Aplicar filtros
    async aplicarFiltros() {
        UI.currentPage = 1; // Volver a la primera página al aplicar filtros
        await this.cargarProductos(1);
    }

    // Limpiar filtros
    async limpiarFiltros() {
        UI.limpiarFiltros();
        UI.currentPage = 1;
        await this.cargarProductos(1);
    }

    // Cambiar página
    async cambiarPagina(page) {
        if (page < 1 || UI.isLoading) return;
        await this.cargarProductos(page);
    }

    // Recargar datos
    async recargar() {
        await this.cargarProductos(UI.currentPage);
        UI.mostrarToast('Datos actualizados', 'info');
    }

    // Buscar productos por texto (función adicional)
    async buscarProductos(texto) {
        try {
            const response = await api.obtenerProductos({}, 1, 1000);
            
            if (response.success) {
                const productosFiltrados = response.data.filter(producto => 
                    producto.nombre.toLowerCase().includes(texto.toLowerCase()) ||
                    producto.descripcion.toLowerCase().includes(texto.toLowerCase())
                );
                
                UI.renderizarTablaProductos(productosFiltrados, {
                    paginaActual: 1,
                    totalPaginas: 1,
                    totalProductos: productosFiltrados.length
                });
            }
        } catch (error) {
            console.error('Error al buscar productos:', error);
            UI.mostrarToast('Error en la búsqueda: ' + error.message, 'error');
        }
    }

    // Exportar datos a CSV (función adicional)
    async exportarCSV() {
        try {
            const response = await api.obtenerProductos({}, 1, 1000);
            
            if (response.success) {
                const productos = response.data;
                const csv = this.convertirACSV(productos);
                this.descargarCSV(csv, 'productos.csv');
                UI.mostrarToast('Productos exportados correctamente', 'success');
            }
        } catch (error) {
            console.error('Error al exportar CSV:', error);
            UI.mostrarToast('Error al exportar: ' + error.message, 'error');
        }
    }

    // Convertir array a CSV
    convertirACSV(productos) {
        const headers = ['ID', 'Nombre', 'Descripción', 'Precio', 'Stock', 'Categoría'];
        const rows = productos.map(p => [
            p._id,
            `"${p.nombre.replace(/"/g, '""')}"`,
            `"${p.descripcion.replace(/"/g, '""')}"`,
            p.precio,
            p.stock,
            p.categoria
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Descargar archivo CSV
    descargarCSV(contenido, nombreArchivo) {
        const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', nombreArchivo);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Obtener estadísticas (función adicional)
    async obtenerEstadisticas() {
        try {
            const estadisticas = await api.obtenerEstadisticas();
            
            if (estadisticas) {
                console.log('Estadísticas:', estadisticas);
                
                // Mostrar estadísticas en un toast
                const mensaje = `Total productos: ${estadisticas.totalProductos} | Disponibles: ${estadisticas.productosDisponibles} | Agotados: ${estadisticas.productosAgotados} | Valor inventario: $${estadisticas.valorTotalInventario.toFixed(2)}`;
                
                UI.mostrarToast(mensaje, 'info', 8000);
            }
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
        }
    }

    // Validar conexión periódicamente
    iniciarMonitoreoConexion() {
        setInterval(async () => {
            if (this.inicializada) {
                const conectado = await api.verificarConexion();
                if (!conectado) {
                    UI.mostrarToast('Conexión perdida con el servidor', 'warning');
                }
            }
        }, 30000); // Verificar cada 30 segundos
    }

    // Manejar errores globales
    manejarErrorGlobal(error) {
        console.error('Error global:', error);
        
        if (error.message.includes('Failed to fetch')) {
            UI.mostrarToast('Error de conexión. Verifique su conexión a internet.', 'error');
        } else if (error.message.includes('timeout')) {
            UI.mostrarToast('La petición tardó demasiado tiempo. Intente nuevamente.', 'warning');
        } else {
            UI.mostrarToast('Error inesperado: ' + error.message, 'error');
        }
    }

    // Métodos de utilidad
    formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatearMoneda(cantidad) {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(cantidad);
    }

    // Cleanup al cerrar la aplicación
    cleanup() {
        console.log('Aplicación cerrada correctamente');
    }
}

// Manejo de errores globales
window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    if (window.App) {
        window.App.manejarErrorGlobal(event.error);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
    if (window.App) {
        window.App.manejarErrorGlobal(event.reason);
    }
});

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando aplicación...');
    window.App = new ProductosApp();
    
    // Iniciar monitoreo de conexión
    window.App.iniciarMonitoreoConexion();
});

// Cleanup al cerrar la ventana
window.addEventListener('beforeunload', () => {
    if (window.App) {
        window.App.cleanup();
    }
});

// Exportar para uso global
window.ProductosApp = ProductosApp;