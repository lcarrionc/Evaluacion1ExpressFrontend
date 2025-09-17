// Configuración de la API
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Clase para manejar las llamadas a la API
class ProductosAPI {
    constructor(config = API_CONFIG) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
        this.headers = config.headers;
    }

    // Método genérico para hacer peticiones HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                ...this.headers,
                ...options.headers
            },
            signal: AbortSignal.timeout(this.timeout),
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            UI.showLoading();
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error del servidor' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en API request:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('La petición ha tardado demasiado tiempo');
            }
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('No se puede conectar con el servidor. Verifique que la API esté ejecutándose.');
            }
            
            throw error;
        } finally {
            UI.hideLoading();
        }
    }

    // Obtener todos los productos con filtros y paginación
    async obtenerProductos(filtros = {}, page = 1, limit = 10) {
        const params = new URLSearchParams();
        
        // Agregar filtros a los parámetros
        if (filtros.categoria && filtros.categoria !== '') {
            params.append('categoria', filtros.categoria);
        }
        
        if (filtros.precioMin && filtros.precioMin !== '') {
            params.append('precioMin', filtros.precioMin);
        }
        
        if (filtros.precioMax && filtros.precioMax !== '') {
            params.append('precioMax', filtros.precioMax);
        }
        
        if (filtros.disponible && filtros.disponible !== '') {
            params.append('disponible', filtros.disponible);
        }
        
        // Agregar paginación
        params.append('page', page);
        params.append('limit', limit);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/productos?${queryString}` : '/productos';
        
        return await this.request(endpoint);
    }

    // Obtener un producto por ID
    async obtenerProductoPorId(id) {
        if (!id) {
            throw new Error('ID del producto es requerido');
        }
        
        return await this.request(`/productos/${id}`);
    }

    // Crear un nuevo producto
    async crearProducto(producto) {
        if (!this.validarProducto(producto)) {
            throw new Error('Datos del producto inválidos');
        }
        
        return await this.request('/productos', {
            method: 'POST',
            body: producto
        });
    }

    // Actualizar un producto existente
    async actualizarProducto(id, producto) {
        if (!id) {
            throw new Error('ID del producto es requerido');
        }
        
        if (!this.validarProducto(producto, false)) {
            throw new Error('Datos del producto inválidos');
        }
        
        return await this.request(`/productos/${id}`, {
            method: 'PUT',
            body: producto
        });
    }

    // Eliminar un producto
    async eliminarProducto(id) {
        if (!id) {
            throw new Error('ID del producto es requerido');
        }
        
        return await this.request(`/productos/${id}`, {
            method: 'DELETE'
        });
    }

    // Obtener categorías disponibles
    async obtenerCategorias() {
        return await this.request('/categorias');
    }

    // Buscar productos por categoría
    async buscarPorCategoria(categoria) {
        if (!categoria) {
            throw new Error('Categoría es requerida');
        }
        
        return await this.request(`/productos/categoria/${categoria}`);
    }

    // Validar datos del producto
    validarProducto(producto, esCreacion = true) {
        if (!producto || typeof producto !== 'object') {
            return false;
        }

        // Validaciones para creación (todos los campos son requeridos)
        if (esCreacion) {
            const camposRequeridos = ['nombre', 'descripcion', 'precio', 'stock', 'categoria'];
            for (const campo of camposRequeridos) {
                if (!producto[campo] && producto[campo] !== 0) {
                    console.error(`Campo requerido faltante: ${campo}`);
                    return false;
                }
            }
        }

        // Validaciones específicas
        if (producto.nombre) {
            if (typeof producto.nombre !== 'string' || producto.nombre.trim().length < 2 || producto.nombre.trim().length > 100) {
                console.error('Nombre inválido');
                return false;
            }
        }

        if (producto.descripcion) {
            if (typeof producto.descripcion !== 'string' || producto.descripcion.trim().length < 10 || producto.descripcion.trim().length > 500) {
                console.error('Descripción inválida');
                return false;
            }
        }

        if (producto.precio !== undefined) {
            const precio = parseFloat(producto.precio);
            if (isNaN(precio) || precio <= 0) {
                console.error('Precio inválido');
                return false;
            }
        }

        if (producto.stock !== undefined) {
            const stock = parseInt(producto.stock);
            if (isNaN(stock) || stock < 0) {
                console.error('Stock inválido');
                return false;
            }
        }

        return true;
    }

    // Método para verificar la conexión con la API
    async verificarConexion() {
        try {
            await this.request('/productos');
            return true;
        } catch (error) {
            console.error('Error al verificar conexión:', error);
            return false;
        }
    }

    // Método para obtener estadísticas (si la API las proporciona)
    async obtenerEstadisticas() {
        try {
            // Obtener todos los productos para calcular estadísticas
            const response = await this.obtenerProductos({}, 1, 1000);
            const productos = response.data || [];
            
            const estadisticas = {
                totalProductos: productos.length,
                productosDisponibles: productos.filter(p => p.stock > 0).length,
                productosAgotados: productos.filter(p => p.stock === 0).length,
                valorTotalInventario: productos.reduce((total, p) => total + (p.precio * p.stock), 0),
                categorias: [...new Set(productos.map(p => p.categoria))].length,
                precioPromedio: productos.length > 0 ? productos.reduce((total, p) => total + p.precio, 0) / productos.length : 0
            };
            
            return estadisticas;
        } catch (error) {
            console.error('Error al calcular estadísticas:', error);
            return null;
        }
    }
}

// Instancia global de la API
const api = new ProductosAPI();

// Manejo de errores globales para la API
window.addEventListener('unhandledrejection', (event) => {
    console.error('Error no manejado en promesa:', event.reason);
    
    if (event.reason?.message?.includes('No se puede conectar')) {
        UI.mostrarToast('No se puede conectar con el servidor. Verifique que la API esté ejecutándose.', 'error');
    }
});

// Exportar para uso en otros archivos
window.ProductosAPI = ProductosAPI;
window.api = api;