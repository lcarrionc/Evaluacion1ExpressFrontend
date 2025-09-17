// Clase para manejar la interfaz de usuario
class UIManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilters = {};
        this.isLoading = false;
        this.productoEditando = null;
        this.categorias = [];
        
        this.initializeElements();
    }

    // Inicializar referencias a elementos del DOM
    initializeElements() {
        // Elementos principales
        this.loadingElement = document.getElementById('loading');
        this.tablaProductos = document.getElementById('tablaProductos');
        this.totalProductos = document.getElementById('totalProductos');
        this.paginacion = document.getElementById('paginacion');
        this.toastContainer = document.getElementById('toastContainer');

        // Modal y formulario
        this.modalProducto = document.getElementById('modalProducto');
        this.modalConfirmacion = document.getElementById('modalConfirmacion');
        this.formProducto = document.getElementById('formProducto');
        this.tituloModal = document.getElementById('tituloModal');

        // Campos del formulario
        this.productoId = document.getElementById('productoId');
        this.nombreInput = document.getElementById('nombre');
        this.descripcionInput = document.getElementById('descripcion');
        this.precioInput = document.getElementById('precio');
        this.stockInput = document.getElementById('stock');
        this.categoriaSelect = document.getElementById('categoria');

        // Filtros
        this.filtroCategoriaSelect = document.getElementById('filtroCategoría');
        this.filtroPrecioMinInput = document.getElementById('filtroPrecioMin');
        this.filtroPrecioMaxInput = document.getElementById('filtroPrecioMax');
        this.filtroDisponibleSelect = document.getElementById('filtroDisponible');

        // Botones
        this.btnNuevoProducto = document.getElementById('btnNuevoProducto');
        this.btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
        this.btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
        this.btnCerrarModal = document.getElementById('btnCerrarModal');
        this.btnCancelar = document.getElementById('btnCancelar');
        this.btnGuardar = document.getElementById('btnGuardar');
        this.btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
        this.btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
    }

    // Mostrar/ocultar loading spinner
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
            this.isLoading = true;
        }
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.add('hidden');
            this.isLoading = false;
        }
    }

    // Mostrar notificaciones toast
    mostrarToast(mensaje, tipo = 'info', duracion = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3`;
        
        const icon = this.getToastIcon(tipo);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span class="flex-1">${mensaje}</span>
            <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.toastContainer.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                setTimeout(() => toast.remove(), 300);
            }
        }, duracion);
    }

    getToastIcon(tipo) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[tipo] || icons.info;
    }

    // Renderizar tabla de productos
    renderizarTablaProductos(productos, paginacionInfo) {
        if (!productos || productos.length === 0) {
            this.tablaProductos.innerHTML = `
                <tr>
                    <td colspan="6" class="px-8 py-16 text-center">
                        <div class="flex flex-col items-center justify-center space-y-4">
                            <div class="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                                <i class="fas fa-box-open text-4xl text-gray-400"></i>
                            </div>
                            <div class="space-y-2">
                                <p class="text-lg font-medium text-gray-300">No se encontraron productos</p>
                                <p class="text-sm text-gray-500">Intente ajustar los filtros o agregue un nuevo producto</p>
                            </div>
                            <button onclick="App.mostrarFormularioNuevo()" class="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                                <i class="fas fa-plus"></i>
                                <span>Agregar Primer Producto</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            this.totalProductos.textContent = '';
            this.paginacion.innerHTML = '';
            return;
        }

        this.tablaProductos.innerHTML = productos.map(producto => this.crearFilaProducto(producto)).join('');
        
        // Actualizar información de total
        if (paginacionInfo) {
            this.totalProductos.innerHTML = `
                <span class="text-gray-300">Mostrando</span> 
                <span class="font-semibold text-white">${productos.length}</span> 
                <span class="text-gray-300">de</span> 
                <span class="font-semibold text-indigo-400">${paginacionInfo.totalProductos}</span> 
                <span class="text-gray-300">productos</span>
            `;
            this.renderizarPaginacion(paginacionInfo);
        }
    }

    // Crear fila de producto para la tabla
    crearFilaProducto(producto) {
        const estadoStock = this.obtenerEstadoStock(producto.stock);
        const precioFormateado = this.formatearPrecio(producto.precio);
        
        return `
            <tr class="table-row hover:bg-black/30 transition-colors duration-150">
                <td class="px-6 py-4">
                    <div>
                        <div class="text-sm font-medium text-white">${this.escaparHTML(producto.nombre)}</div>
                        <div class="text-sm text-gray-400 max-w-xs truncate" title="${this.escaparHTML(producto.descripcion)}">
                            ${this.escaparHTML(producto.descripcion)}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-300">
                    ${precioFormateado}
                </td>
                <td class="px-6 py-4 text-sm text-gray-300">
                    ${producto.stock}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <span class="inline-flex items-center border border-blue-600 px-2 py-1 rounded-full text-xs font-medium bg-blue-900 bg-opacity-30 text-blue-500">
                        <i class="fas fa-tag mr-1"></i> 
                        ${this.escaparHTML(producto.categoria)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm">
                    <span class="${estadoStock.clase}">
                        <i class="${estadoStock.icono} mr-1"></i>
                        ${estadoStock.texto}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm font-medium space-x-2">
                    <button onclick="App.editarProducto('${producto._id}')" 
                            class="text-yellow-500 bg-yellow-500 bg-opacity-30 px-3 py-2 rounded-full hover:text-yellow-600 transition-colors duration-150" 
                            title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="App.confirmarEliminarProducto('${producto._id}', '${this.escaparHTML(producto.nombre)}')" 
                            class="text-red-500 hover:text-red-600 bg-red-500 bg-opacity-30 px-3 py-2 rounded-full transition-colors duration-150 ml-3" 
                            title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // Obtener estado del stock
    obtenerEstadoStock(stock) {
        if (stock === 0) {
            return {
                clase: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border border-red-500/30',
                texto: 'Agotado',
                icono: 'fas fa-times-circle'
            };
        } else if (stock <= 5) {
            return {
                clase: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30',
                texto: 'Stock Bajo',
                icono: 'fas fa-exclamation-triangle'
            };
        } else {
            return {
                clase: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30',
                texto: 'Disponible',
                icono: 'fas fa-check-circle'
            };
        }
    }

    // Formatear precio
    formatearPrecio(precio) {
        return parseFloat(precio).toFixed(2);
    }

    // Escapar HTML para prevenir XSS
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    // Renderizar paginación
    renderizarPaginacion(paginacionInfo) {
        const { paginaActual, totalPaginas, totalProductos } = paginacionInfo;
        
        if (totalPaginas <= 1) {
            this.paginacion.innerHTML = '';
            return;
        }

        const botones = [];
        
        // Botón anterior
        botones.push(`
            <button onclick="App.cambiarPagina(${paginaActual - 1})" 
                    ${paginaActual === 1 ? 'disabled' : ''} 
                    class="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                <i class="fas fa-chevron-left"></i>
            </button>
        `);

        // Números de página
        const inicio = Math.max(1, paginaActual - 2);
        const fin = Math.min(totalPaginas, paginaActual + 2);

        if (inicio > 1) {
            botones.push(this.crearBotonPagina(1, paginaActual));
            if (inicio > 2) {
                botones.push('<span class="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400">...</span>');
            }
        }

        for (let i = inicio; i <= fin; i++) {
            botones.push(this.crearBotonPagina(i, paginaActual));
        }

        if (fin < totalPaginas) {
            if (fin < totalPaginas - 1) {
                botones.push('<span class="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400">...</span>');
            }
            botones.push(this.crearBotonPagina(totalPaginas, paginaActual));
        }

        // Botón siguiente
        botones.push(`
            <button onclick="App.cambiarPagina(${paginaActual + 1})" 
                    ${paginaActual === totalPaginas ? 'disabled' : ''} 
                    class="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                <i class="fas fa-chevron-right"></i>
            </button>
        `);

        this.paginacion.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div class="flex-1 flex justify-between sm:hidden">
                    <button onclick="App.cambiarPagina(${paginaActual - 1})" 
                            ${paginaActual === 1 ? 'disabled' : ''} 
                            class="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                        <i class="fas fa-chevron-left mr-2"></i>
                        Anterior
                    </button>
                    <button onclick="App.cambiarPagina(${paginaActual + 1})" 
                            ${paginaActual === totalPaginas ? 'disabled' : ''} 
                            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                        Siguiente
                        <i class="fas fa-chevron-right ml-2"></i>
                    </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-400">
                            Página <span class="font-medium text-white">${paginaActual}</span> de <span class="font-medium text-indigo-400">${totalPaginas}</span>
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                            ${botones.join('')}
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    crearBotonPagina(numero, paginaActual) {
        const esActual = numero === paginaActual;
        return `
            <button onclick="App.cambiarPagina(${numero})" 
                    class="relative inline-flex items-center px-4 py-2 border transition-all duration-200 text-sm font-medium ${esActual 
                        ? 'z-10 bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white shadow-lg' 
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white'}">
                ${numero}
            </button>
        `;
    }

    // Llenar select de categorías
    llenarSelectCategorias(categorias) {
        this.categorias = categorias;
        
        // Llenar select del formulario
        this.categoriaSelect.innerHTML = '<option value="">Seleccione una categoría</option>' +
            categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        
        // Llenar select de filtros
        this.filtroCategoriaSelect.innerHTML = '<option value="">Todas las categorías</option>' +
            categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Mostrar modal
    mostrarModal(titulo = 'Nuevo Producto') {
        this.tituloModal.textContent = titulo;
        this.modalProducto.classList.remove('hidden');
        this.modalProducto.classList.add('modal-entering');
        
        // Focus en el primer campo
        setTimeout(() => this.nombreInput?.focus(), 100);
    }

    // Ocultar modal
    ocultarModal() {
        this.modalProducto.classList.add('modal-leaving');
        setTimeout(() => {
            this.modalProducto.classList.add('hidden');
            this.modalProducto.classList.remove('modal-entering', 'modal-leaving');
            this.limpiarFormulario();
        }, 300);
    }

    // Mostrar modal de confirmación
    mostrarModalConfirmacion() {
        this.modalConfirmacion.classList.remove('hidden');
        this.modalConfirmacion.classList.add('modal-entering');
    }

    // Ocultar modal de confirmación
    ocultarModalConfirmacion() {
        this.modalConfirmacion.classList.add('modal-leaving');
        setTimeout(() => {
            this.modalConfirmacion.classList.add('hidden');
            this.modalConfirmacion.classList.remove('modal-entering', 'modal-leaving');
        }, 300);
    }

    // Limpiar formulario
    limpiarFormulario() {
        this.formProducto.reset();
        this.productoId.value = '';
        this.productoEditando = null;
        this.limpiarErroresValidacion();
    }

    // Llenar formulario con datos del producto
    llenarFormulario(producto) {
        this.productoId.value = producto._id || '';
        this.nombreInput.value = producto.nombre || '';
        this.descripcionInput.value = producto.descripcion || '';
        this.precioInput.value = producto.precio || '';
        this.stockInput.value = producto.stock || '';
        this.categoriaSelect.value = producto.categoria || '';
        this.productoEditando = producto;
    }

    // Obtener datos del formulario
    obtenerDatosFormulario() {
        return {
            nombre: this.nombreInput.value.trim(),
            descripcion: this.descripcionInput.value.trim(),
            precio: parseFloat(this.precioInput.value),
            stock: parseInt(this.stockInput.value),
            categoria: this.categoriaSelect.value
        };
    }

    // Validar formulario en el frontend
    validarFormulario() {
        this.limpiarErroresValidacion();
        let esValido = true;
        const datos = this.obtenerDatosFormulario();

        // Validar nombre
        if (!datos.nombre || datos.nombre.length < 2 || datos.nombre.length > 100) {
            this.mostrarErrorCampo('nombre', 'El nombre debe tener entre 2 y 100 caracteres');
            esValido = false;
        }

        // Validar descripción
        if (!datos.descripcion || datos.descripcion.length < 10 || datos.descripcion.length > 500) {
            this.mostrarErrorCampo('descripcion', 'La descripción debe tener entre 10 y 500 caracteres');
            esValido = false;
        }

        // Validar precio
        if (isNaN(datos.precio) || datos.precio <= 0) {
            this.mostrarErrorCampo('precio', 'El precio debe ser un número mayor a 0');
            esValido = false;
        }

        // Validar stock
        if (isNaN(datos.stock) || datos.stock < 0) {
            this.mostrarErrorCampo('stock', 'El stock debe ser un número mayor o igual a 0');
            esValido = false;
        }

        // Validar categoría
        if (!datos.categoria) {
            this.mostrarErrorCampo('categoria', 'Debe seleccionar una categoría');
            esValido = false;
        }

        return esValido;
    }

    // Mostrar error en campo específico
    mostrarErrorCampo(campo, mensaje) {
        const input = document.getElementById(campo);
        const errorElement = document.getElementById(`error${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
        
        if (input) {
            input.classList.add('input-error');
        }
        
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.classList.remove('hidden');
        }
    }

    // Limpiar errores de validación
    limpiarErroresValidacion() {
        const campos = ['nombre', 'descripcion', 'precio', 'stock', 'categoria'];
        
        campos.forEach(campo => {
            const input = document.getElementById(campo);
            const errorElement = document.getElementById(`error${campo.charAt(0).toUpperCase() + campo.slice(1)}`);
            
            if (input) {
                input.classList.remove('input-error');
            }
            
            if (errorElement) {
                errorElement.classList.add('hidden');
                errorElement.textContent = '';
            }
        });
    }

    // Obtener filtros actuales
    obtenerFiltros() {
        return {
            categoria: this.filtroCategoriaSelect.value,
            precioMin: this.filtroPrecioMinInput.value,
            precioMax: this.filtroPrecioMaxInput.value,
            disponible: this.filtroDisponibleSelect.value
        };
    }

    // Limpiar filtros
    limpiarFiltros() {
        this.filtroCategoriaSelect.value = '';
        this.filtroPrecioMinInput.value = '';
        this.filtroPrecioMaxInput.value = '';
        this.filtroDisponibleSelect.value = '';
        this.currentFilters = {};
    }

    // Establecer estado de loading en botón
    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }
}

// Instancia global de UI
const UI = new UIManager();

// Exportar para uso en otros archivos
window.UIManager = UIManager;
window.UI = UI;