import React, { useState, useEffect } from 'react';
import './App.css';

const CarniceriaApp = () => {
  
  // Función para cargar datos del localStorage
  const cargarDatosGuardados = () => {
    try {
      const ventasGuardadas = localStorage.getItem('tiznados-ventas');
      const productosGuardados = localStorage.getItem('tiznados-productos');
      const pedidosGuardados = localStorage.getItem('tiznados-pedidos-pendientes');
      
      return {
        ventas: ventasGuardadas ? JSON.parse(ventasGuardadas) : [],
        productos: productosGuardados ? JSON.parse(productosGuardados) : [
          { 
            id: 1, 
            nombre: 'DUO TIZNE',
            categoria: 'Paquete', 
            precio: 230.00,
            imagen: '/images/2.png'
          },
          { 
            id: 2, 
            nombre: 'TIZNE CLASSIC',
            categoria: 'Paquete', 
            precio: 280.00,
            imagen: '/images/3.png'
          },
          { 
            id: 3, 
            nombre: 'MEGA TIZNE',
            categoria: 'Paquete',  
            precio: 560.00,
            imagen: '/images/4.png'
          },
          { 
            id: 4, 
            nombre: 'Arrachera 1 kg',
            categoria: 'Corte', 
            precio: 170.00,
            imagen: '/images/ARRACHERA.webp'
          },
          { 
            id: 5, 
            nombre: 'Asada 1 kg',
            categoria: 'Corte', 
            precio: 150.00,
            imagen: '/images/ASADA.jpg'
          },
          { 
            id: 6, 
            nombre: 'Salchichon', 
            categoria: 'Embutido',
            precio: 9.00,
            imagen: '/images/SALCHICHON.png'
          },
          {
            id: 7,
            nombre: 'Chorizo',
            categoria: 'Embutido',
            precio: 9.00,
            imagen: '/images/CHORIZO.jpg'
          },
          {
            id: 8,
            nombre: 'Chorizo Español',
            categoria: 'Embutido',
            precio: 18.00,
            imagen: '/images/ESPAÑOL.jpg'
          }
        ],
        pedidosPendientes: pedidosGuardados ? JSON.parse(pedidosGuardados) : []
      };
    } catch (error) {
      console.error('Error cargando datos:', error);
      return {
        ventas: [],
        productos: [],
        pedidosPendientes: []
      };
    }
  };

  // Función para guardar en localStorage
  const guardarEnStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error guardando datos:', error);
    }
  };

  // Función para exportar ventas a Excel (CSV)
  const exportarVentasExcel = () => {
    if (ventas.length === 0) {
      alert('No hay ventas para exportar');
      return;
    }

    // Preparar datos para Excel
    const datosExcel = [];
    
    // Encabezados
    datosExcel.push([
      'Fecha',
      'Cliente', 
      'Producto',
      'Cantidad',
      'Precio Unitario',
      'Subtotal',
      'Total Venta',
      'Método Pago',
      'Pago Recibido',
      'Cambio'
    ]);

    // Datos de ventas
    ventas.forEach(venta => {
      venta.productos.forEach((producto, index) => {
        datosExcel.push([
          venta.fecha,
          venta.cliente,
          producto.nombre,
          producto.cantidad,
          `$${producto.precio.toFixed(2)}`,
          `$${(producto.precio * producto.cantidad).toFixed(2)}`,
          index === 0 ? `$${venta.total.toFixed(2)}` : '', // Solo mostrar total en primera fila
          index === 0 ? venta.metodoPago : '',
          index === 0 ? `$${venta.pago.toFixed(2)}` : '',
          index === 0 ? `$${venta.cambio.toFixed(2)}` : ''
        ]);
      });
      
      // Línea separadora entre ventas
      datosExcel.push(['', '', '', '', '', '', '', '', '', '']);
    });

    // Agregar totales al final
    const totalDia = ventas.reduce((total, venta) => total + venta.total, 0);
    const totalVentas = ventas.length;
    
    datosExcel.push(['', '', '', '', '', '', '', '', '', '']);
    datosExcel.push(['RESUMEN DEL DÍA', '', '', '', '', '', '', '', '', '']);
    datosExcel.push(['Total de ventas:', totalVentas, '', '', '', '', '', '', '', '']);
    datosExcel.push(['Total en dinero:', `$${totalDia.toFixed(2)}`, '', '', '', '', '', '', '', '']);

    // Crear CSV
    const csvContent = datosExcel.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',')
    ).join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fecha = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Ventas_Tiznados_${fecha}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Inicializar estados con datos guardados
  const datosIniciales = cargarDatosGuardados();
  
  const [productos, setProductos] = useState(datosIniciales.productos);
  const [pedidoActual, setPedidoActual] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState(datosIniciales.pedidosPendientes);
  const [ventas, setVentas] = useState(datosIniciales.ventas);
  const [vistaActual, setVistaActual] = useState('pedidos');
  
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', precio: '', imagen: '' });
  const [editandoProducto, setEditandoProducto] = useState(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [pagoCliente, setPagoCliente] = useState('');
  const [mostrarVenta, setMostrarVenta] = useState(false);
  const [pedidoCompletado, setPedidoCompletado] = useState(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [pedidoPagando, setPedidoPagando] = useState(null);
  const [montoPagoPendiente, setMontoPagoPendiente] = useState('');

  // useEffect para guardar automáticamente los datos
  useEffect(() => {
    guardarEnStorage('tiznados-ventas', ventas);
  }, [ventas]);

  useEffect(() => {
    guardarEnStorage('tiznados-productos', productos);
  }, [productos]);

  useEffect(() => {
    guardarEnStorage('tiznados-pedidos-pendientes', pedidosPendientes);
  }, [pedidosPendientes]);

  const totalPedido = pedidoActual.reduce((total, item) => total + (item.precio * item.cantidad), 0);

  const agregarProducto = () => {
    if (nuevoProducto.nombre && nuevoProducto.precio) {
      const producto = {
        id: Date.now(),
        nombre: nuevoProducto.nombre,
        categoria: 'Personalizado',
        precio: parseFloat(nuevoProducto.precio),
        imagen: nuevoProducto.imagen || '/images/default.jpg'
      };
      setProductos([...productos, producto]);
      setNuevoProducto({ nombre: '', precio: '', imagen: '' });
    }
  };

  const editarProducto = (id, datosActualizados) => {
    setProductos(productos.map(p => 
      p.id === id 
        ? { ...p, ...datosActualizados, precio: parseFloat(datosActualizados.precio) }
        : p
    ));
    setEditandoProducto(null);
  };

  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const agregarAlPedido = (producto) => {
    const itemExistente = pedidoActual.find(item => item.id === producto.id);
    
    if (itemExistente) {
      setPedidoActual(pedidoActual.map(item =>
        item.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setPedidoActual([...pedidoActual, { ...producto, cantidad: 1 }]);
    }
  };

  const modificarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setPedidoActual(pedidoActual.filter(item => item.id !== id));
    } else {
      setPedidoActual(pedidoActual.map(item =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      ));
    }
  };

  const agregarProductoPersonalizado = () => {
    const nombre = prompt('Nombre del producto:');
    const precio = prompt('Precio del producto:');
    const cantidad = prompt('Cantidad:');
    
    if (nombre && precio && cantidad) {
      const productoPersonalizado = {
        id: Date.now(),
        nombre: nombre,
        precio: parseFloat(precio),
        cantidad: parseFloat(cantidad),
        imagen: '/images/default.jpg'
      };
      setPedidoActual([...pedidoActual, productoPersonalizado]);
    }
  };

  const guardarPedidoPendiente = () => {
    if (pedidoActual.length === 0) {
      alert('No hay productos en el pedido');
      return;
    }

    const pedidoPendiente = {
      id: Date.now(),
      cliente: nombreCliente.trim() || 'Cliente ' + (pedidosPendientes.length + 1),
      productos: [...pedidoActual],
      total: totalPedido,
      fecha: new Date().toLocaleString('es-MX'),
      estado: 'pendiente',
      metodoPago: metodoPago,
      pagado: metodoPago === 'transferencia'
    };

    setPedidosPendientes([...pedidosPendientes, pedidoPendiente]);
    
    setPedidoActual([]);
    setNombreCliente('');
    setPagoCliente('');
    setMetodoPago('efectivo');
    
    alert(`Pedido guardado para ${pedidoPendiente.cliente} - ${pedidoPendiente.pagado ? 'PAGADO' : 'PENDIENTE DE PAGO'}`);
  };

  const marcarComoPagado = (pedidoId, montoPago) => {
    const pedido = pedidosPendientes.find(p => p.id === pedidoId);
    if (!pedido) return;

    const pedidoActualizado = {
      ...pedido,
      pagado: true,
      fechaPago: new Date().toLocaleString('es-MX'),
      montoPago: parseFloat(montoPago),
      cambio: parseFloat(montoPago) - pedido.total
    };

    setPedidosPendientes(pedidosPendientes.map(p => 
      p.id === pedidoId ? pedidoActualizado : p
    ));
    
    setMostrarModalPago(false);
    setPedidoPagando(null);
    setMontoPagoPendiente('');
    
    alert(`Pedido de ${pedido.cliente} marcado como PAGADO`);
  };

  const entregarPedido = (pedidoId) => {
    const pedido = pedidosPendientes.find(p => p.id === pedidoId);
    if (!pedido) return;

    if (!pedido.pagado && pedido.metodoPago === 'efectivo') {
      alert('Este pedido aún no ha sido pagado. Márcalo como pagado primero.');
      return;
    }

    const venta = {
      id: Date.now(),
      cliente: pedido.cliente,
      productos: pedido.productos,
      total: pedido.total,
      pago: pedido.montoPago || pedido.total,
      cambio: pedido.cambio || 0,
      fecha: new Date().toLocaleString('es-MX'),
      metodoPago: pedido.metodoPago,
      pedidoOriginal: pedido.id
    };

    setVentas([...ventas, venta]);
    setPedidosPendientes(pedidosPendientes.filter(p => p.id !== pedidoId));
    
    setPedidoCompletado(venta);
    setMostrarVenta(true);
    setTimeout(() => setMostrarVenta(false), 3000);
  };

  const cerrarVenta = () => {
    if (pedidoActual.length === 0) {
      alert('No hay productos en el pedido');
      return;
    }

    if (metodoPago === 'efectivo') {
      const pago = parseFloat(pagoCliente);
      if (!pago || pago < totalPedido) {
        alert('El pago debe ser mayor o igual al total');
        return;
      }
    }

    const nuevaVenta = {
      id: Date.now(),
      cliente: nombreCliente.trim() || 'Cliente',
      fecha: new Date().toLocaleString('es-MX'),
      productos: [...pedidoActual],
      total: totalPedido,
      pago: metodoPago === 'efectivo' ? parseFloat(pagoCliente) : totalPedido,
      cambio: metodoPago === 'efectivo' ? parseFloat(pagoCliente) - totalPedido : 0,
      metodoPago: metodoPago
    };

    setVentas([...ventas, nuevaVenta]);

    setPedidoActual([]);
    setNombreCliente('');
    setPagoCliente('');
    setMetodoPago('efectivo');
    setPedidoCompletado(nuevaVenta);
    setMostrarVenta(true);
    
    setTimeout(() => setMostrarVenta(false), 3000);
  };

  const eliminarPedidoPendiente = (pedidoId) => {
    setPedidosPendientes(pedidosPendientes.filter(p => p.id !== pedidoId));
  };

  const limpiarPedido = () => {
    setPedidoActual([]);
    setNombreCliente('');
    setPagoCliente('');
    setMetodoPago('efectivo');
  };

  // Función para limpiar todos los datos (opcional)
  const limpiarTodosLosDatos = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar TODOS los datos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('tiznados-ventas');
      localStorage.removeItem('tiznados-productos');
      localStorage.removeItem('tiznados-pedidos-pendientes');
      window.location.reload();
    }
  };

  const VentaCompletada = ({ venta }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-4" style={{ borderColor: '#B70101' }}>
        <div className="text-center">
          <div className="text-6xl mb-4" style={{ color: '#B70101' }}>✓</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#563300' }}>¡Venta Completada!</h2>
          <div className="space-y-3 text-xl">
            <p><span className="font-semibold">Cliente:</span> <span style={{ color: '#B70101' }}>{venta.cliente}</span></p>
            <p><span className="font-semibold">Total:</span> <span style={{ color: '#B70101' }}>${venta.total.toFixed(2)}</span></p>
            <p><span className="font-semibold">Método:</span> {venta.metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Transferencia'}</p>
            {venta.metodoPago === 'efectivo' && (
              <>
                <p><span className="font-semibold">Pago:</span> ${venta.pago.toFixed(2)}</p>
                <div className="text-3xl font-bold p-4 rounded-xl" style={{ color: '#B70101', backgroundColor: '#f0f0f0' }}>
                  Cambio: ${venta.cambio.toFixed(2)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Iconos simples como componentes
  const ShoppingCart = () => <span>🛒</span>;
  const Clock = () => <span>⏳</span>;
  const Edit3 = () => <span>✏️</span>;
  const Calculator = () => <span>🧮</span>;
  const User = () => <span>👤</span>;
  const CreditCard = () => <span>💳</span>;
  const Plus = () => <span>➕</span>;
  const Trash2 = () => <span>🗑️</span>;
  const X = () => <span>❌</span>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f5f0' }}>
      {/* Header */}
      <div className="text-white p-6 shadow-2xl" style={{ 
        background: 'linear-gradient(135deg, #563300 0%, #B70101 100%)' 
      }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">🔥 TIZNADOS MX</h1>
          <p className="text-xl opacity-90">Sistema de Ventas Profesional</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-lg border-b-4" style={{ borderColor: '#B70101' }}>
        <div className="flex justify-center space-x-2 p-2">
          {[
            { key: 'pedidos', label: 'Tomar Pedido', icon: ShoppingCart },
            { 
              key: 'pendientes', 
              label: `Pedidos Pendientes${pedidosPendientes.length > 0 ? ` (${pedidosPendientes.length})` : ''}`, 
              icon: Clock 
            },
            { key: 'productos', label: 'Mis Productos', icon: Edit3 },
            { key: 'ventas', label: 'Ventas del Día', icon: Calculator }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setVistaActual(key)}
              className={`flex items-center px-6 py-4 font-bold text-lg rounded-t-lg transition-all transform hover:scale-105 ${
                vistaActual === key
                  ? 'text-white shadow-lg'
                  : 'text-gray-700 hover:text-white'
              }`}
              style={{
                backgroundColor: vistaActual === key ? '#B70101' : 'transparent',
                borderBottom: vistaActual === key ? 'none' : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (vistaActual !== key) {
                  e.target.style.backgroundColor = '#9D0606';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (vistaActual !== key) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#374151';
                }
              }}
            >
              <Icon />
              <span className="ml-3">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Vista Tomar Pedidos */}
        {vistaActual === 'pedidos' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Products List */}
            <div className="bg-white rounded-2xl shadow-xl border-2" style={{ borderColor: '#563300' }}>
              <div className="p-6 rounded-t-2xl flex justify-between items-center" style={{ backgroundColor: '#563300' }}>
                <h2 className="text-2xl font-bold text-white">🥩 Productos Disponibles</h2>
                <button
                  onClick={agregarProductoPersonalizado}
                  className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
                  style={{ color: '#563300' }}
                >
                  + Personalizado
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {productos.map(producto => (
                  <div key={producto.id} className="flex items-center p-4 border-2 rounded-xl hover:shadow-lg transition-all" style={{ borderColor: '#f0f0f0' }}>
                    <div className="w-20 h-20 rounded-xl overflow-hidden mr-4 shadow-md">
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/images/default.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg" style={{ color: '#563300' }}>{producto.nombre}</h3>
                      {producto.categoria && (
                        <p className="text-sm text-gray-500">{producto.categoria}</p>
                      )}
                      <p className="text-2xl font-bold" style={{ color: '#B70101' }}>${producto.precio.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => agregarAlPedido(producto)}
                      className="px-6 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 shadow-lg"
                      style={{ backgroundColor: '#B70101' }}
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Order */}
            <div className="bg-white rounded-2xl shadow-xl border-2" style={{ borderColor: '#B70101' }}>
              <div className="p-6 rounded-t-2xl flex justify-between items-center" style={{ backgroundColor: '#B70101' }}>
                <h2 className="text-2xl font-bold text-white">🛒 Pedido Actual</h2>
                {pedidoActual.length > 0 && (
                  <button
                    onClick={limpiarPedido}
                    className="bg-white px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-all"
                    style={{ color: '#B70101' }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <div className="p-6">
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#f8f5f0' }}>
                  <div className="flex items-center mb-3">
                    <User />
                    <label className="font-bold ml-2" style={{ color: '#563300' }}>Nombre del Cliente:</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Ingresa el nombre del cliente (opcional)"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    className="w-full border-2 rounded-lg px-4 py-2 text-lg focus:outline-none"
                    style={{ borderColor: '#563300' }}
                  />
                </div>

                {pedidoActual.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-500 text-xl">No hay productos en el pedido</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidoActual.map(item => (
                      <div key={`${item.id}-${item.nombre}`} className="flex items-center p-4 border-2 rounded-xl" style={{ borderColor: '#f0f0f0' }}>
                        <div className="w-16 h-16 rounded-lg overflow-hidden mr-4">
                          <img 
                            src={item.imagen || '/images/default.jpg'} 
                            alt={item.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg" style={{ color: '#563300' }}>{item.nombre}</h3>
                          <p className="text-sm text-gray-600">${item.precio.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                            className="w-10 h-10 rounded-full font-bold text-white transition-all transform hover:scale-110"
                            style={{ backgroundColor: '#B70101' }}
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-bold text-xl" style={{ color: '#563300' }}>{item.cantidad}</span>
                          <button
                            onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                            className="w-10 h-10 rounded-full font-bold text-white transition-all transform hover:scale-110"
                            style={{ backgroundColor: '#B70101' }}
                          >
                            +
                          </button>
                          <span className="ml-4 font-bold text-xl" style={{ color: '#B70101' }}>
                            ${(item.precio * item.cantidad).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t-4 pt-6 mt-6 rounded-2xl p-6" style={{ 
                      borderColor: '#563300',
                      background: 'linear-gradient(135deg, #f8f5f0 0%, #fff 100%)'
                    }}>
                      <div className="text-3xl font-bold text-center mb-6" style={{ color: '#B70101' }}>
                        Total: ${totalPedido.toFixed(2)}
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center mb-3">
                          <CreditCard />
                          <label className="font-bold ml-2" style={{ color: '#563300' }}>Método de Pago:</label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setMetodoPago('efectivo')}
                            className={`p-3 rounded-lg font-bold transition-all ${
                              metodoPago === 'efectivo' 
                                ? 'text-white' 
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                            }`}
                            style={{ 
                              backgroundColor: metodoPago === 'efectivo' ? '#B70101' : undefined 
                            }}
                          >
                            💵 Efectivo
                          </button>
                          <button
                            onClick={() => setMetodoPago('transferencia')}
                            className={`p-3 rounded-lg font-bold transition-all ${
                              metodoPago === 'transferencia' 
                                ? 'text-white' 
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                            }`}
                            style={{ 
                              backgroundColor: metodoPago === 'transferencia' ? '#B70101' : undefined 
                            }}
                          >
                            💳 Transferencia
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {metodoPago === 'efectivo' && (
                          <>
                            <input
                              type="number"
                              placeholder="¿Cuánto paga el cliente?"
                              value={pagoCliente}
                              onChange={(e) => setPagoCliente(e.target.value)}
                              className="w-full border-3 rounded-xl px-6 py-4 text-xl font-bold text-center focus:outline-none focus:ring-4"
                              style={{ borderColor: '#563300' }}
                            />
                            {pagoCliente && parseFloat(pagoCliente) >= totalPedido && (
                              <div className="text-center text-2xl font-bold p-4 rounded-xl" style={{
                                color: '#B70101',
                                backgroundColor: '#f0f0f0'
                              }}>
                                💰 Cambio: ${(parseFloat(pagoCliente) - totalPedido).toFixed(2)}
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={guardarPedidoPendiente}
                            className="py-4 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-105 shadow-lg"
                            style={{ backgroundColor: '#563300' }}
                          >
                            🍖 Guardar Pedido
                          </button>
                          <button
                            onClick={cerrarVenta}
                            className="py-4 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-105 shadow-lg"
                            style={{ backgroundColor: '#B70101' }}
                          >
                            💵 Venta Directa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vista Pedidos Pendientes */}
        {vistaActual === 'pendientes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border-2" style={{ borderColor: '#563300' }}>
              <div className="p-6 rounded-t-2xl" style={{ backgroundColor: '#563300' }}>
                <h2 className="text-2xl font-bold text-white">⏳ Pedidos Pendientes de Pago</h2>
              </div>
              <div className="p-6">
                {pedidosPendientes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-gray-500 text-xl">No hay pedidos pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pedidosPendientes.map(pedido => (
                      <div key={pedido.id} className="border-2 rounded-xl p-6" style={{ borderColor: '#f0f0f0' }}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold" style={{ color: '#563300' }}>
                              👤 {pedido.cliente}
                            </h3>
                            <p className="text-gray-600">{pedido.fecha}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" style={{ color: '#B70101' }}>
                              ${pedido.total.toFixed(2)}
                            </p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              pedido.pagado 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {pedido.pagado ? '✓ Pagado' : '⏳ Pendiente'}
                            </span>
                            {pedido.metodoPago === 'transferencia' && (
                              <p className="text-sm text-blue-600 mt-1">💳 Transferencia</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#f8f5f0' }}>
                          <p className="font-bold mb-2" style={{ color: '#563300' }}>Productos:</p>
                          {pedido.productos.map((producto, index) => (
                            <div key={index} className="flex justify-between py-1">
                              <span>• {producto.nombre} x{producto.cantidad}</span>
                              <span className="font-bold" style={{ color: '#B70101' }}>
                                ${(producto.precio * producto.cantidad).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex space-x-3">
                          {!pedido.pagado && pedido.metodoPago === 'efectivo' && (
                            <button
                              onClick={() => {
                                setPedidoPagando(pedido);
                                setMontoPagoPendiente('');
                                setMostrarModalPago(true);
                              }}
                              className="flex-1 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105"
                              style={{ backgroundColor: '#28a745' }}
                            >
                              💵 Marcar Pagado
                            </button>
                          )}
                          <button
                            onClick={() => entregarPedido(pedido.id)}
                            className={`flex-1 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${
                              !pedido.pagado && pedido.metodoPago === 'efectivo' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            style={{ backgroundColor: '#B70101' }}
                            disabled={!pedido.pagado && pedido.metodoPago === 'efectivo'}
                          >
                            🔥 Entregar Pedido
                          </button>
                          <button
                            onClick={() => eliminarPedidoPendiente(pedido.id)}
                            className="bg-red-100 text-red-700 px-4 py-3 rounded-lg hover:bg-red-200 transition-all"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vista Productos */}
        {vistaActual === 'productos' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2" style={{ borderColor: '#563300' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#563300' }}>➕ Agregar Nuevo Producto</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                  className="border-2 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-4"
                  style={{ borderColor: '#563300' }}
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={nuevoProducto.precio}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                  className="border-2 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-4"
                  style={{ borderColor: '#563300' }}
                />
                <input
                  type="url"
                  placeholder="URL de la imagen"
                  value={nuevoProducto.imagen}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, imagen: e.target.value})}
                  className="border-2 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-4"
                  style={{ borderColor: '#563300' }}
                />
                <button
                  onClick={agregarProducto}
                  className="text-white px-6 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: '#B70101' }}
                >
                  <Plus />
                  <span className="ml-2">Agregar</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2" style={{ borderColor: '#B70101' }}>
              <div className="p-6" style={{ backgroundColor: '#B70101' }}>
                <h2 className="text-2xl font-bold text-white">📋 Catálogo de Productos</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productos.map(producto => (
                  <div key={producto.id} className="border-2 rounded-xl p-4 transition-all transform hover:scale-105 hover:shadow-lg" style={{ borderColor: '#f0f0f0' }}>
                    <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/images/default.jpg';
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: '#563300' }}>{producto.nombre}</h3>
                    {producto.categoria && (
                      <p className="text-sm text-gray-500 mb-2">{producto.categoria}</p>
                    )}
                    <p className="text-2xl font-bold mb-4" style={{ color: '#B70101' }}>${producto.precio.toFixed(2)}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditandoProducto(producto)}
                        className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-all flex items-center justify-center"
                      >
                        <Edit3 />
                        <span className="ml-1">Editar</span>
                      </button>
                      <button
                        onClick={() => eliminarProducto(producto.id)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-all"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vista Ventas */}
        {vistaActual === 'ventas' && (
          <div className="bg-white rounded-2xl shadow-xl border-2" style={{ borderColor: '#563300' }}>
            <div className="p-6 rounded-t-2xl" style={{ backgroundColor: '#563300' }}>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📊 Ventas del Día</h2>
                <div className="flex space-x-4">
                  {ventas.length > 0 && (
                    <>
                      <button
                        onClick={exportarVentasExcel}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all transform hover:scale-105 flex items-center"
                      >
                        📊 Exportar Excel
                      </button>
                      <div className="text-right bg-white rounded-xl p-4">
                        <p className="text-sm text-gray-600">Total del día</p>
                        <p className="text-3xl font-bold" style={{ color: '#B70101' }}>
                          ${ventas.reduce((total, venta) => total + venta.total, 0).toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              {ventas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🧮</div>
                  <p className="text-gray-500 text-xl">No hay ventas registradas hoy</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {ventas.slice().reverse().map(venta => (
                    <div key={venta.id} className="border-2 rounded-xl p-6 transition-all hover:shadow-lg" style={{ borderColor: '#f0f0f0' }}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-lg" style={{ color: '#563300' }}>
                            👤 {venta.cliente}
                          </p>
                          <p className="text-gray-600">{venta.fecha}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                            venta.metodoPago === 'efectivo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {venta.metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Transferencia'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: '#B70101' }}>
                            ${venta.total.toFixed(2)}
                          </p>
                          {venta.metodoPago === 'efectivo' && (
                            <p className="text-gray-600">Cambio: ${venta.cambio.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl" style={{ backgroundColor: '#f8f5f0' }}>
                        <p className="font-bold mb-3" style={{ color: '#563300' }}>Productos vendidos:</p>
                        {venta.productos.map((producto, index) => (
                          <div key={index} className="flex justify-between py-2">
                            <span>• {producto.nombre} x{producto.cantidad}</span>
                            <span className="font-bold" style={{ color: '#B70101' }}>
                              ${(producto.precio * producto.cantidad).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editandoProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full mx-4 border-4" style={{ borderColor: '#B70101' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#563300' }}>Editar Producto</h3>
              <button
                onClick={() => setEditandoProducto(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={editandoProducto.nombre}
                onChange={(e) => setEditandoProducto({...editandoProducto, nombre: e.target.value})}
                className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:outline-none"
                style={{ borderColor: '#563300' }}
                placeholder="Nombre del producto"
              />
              <input
                type="number"
                value={editandoProducto.precio}
                onChange={(e) => setEditandoProducto({...editandoProducto, precio: e.target.value})}
                className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:outline-none"
                style={{ borderColor: '#563300' }}
                placeholder="Precio"
              />
              <input
                type="url"
                value={editandoProducto.imagen || ''}
                onChange={(e) => setEditandoProducto({...editandoProducto, imagen: e.target.value})}
                className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:outline-none"
                style={{ borderColor: '#563300' }}
                placeholder="URL de la imagen"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => editarProducto(editandoProducto.id, editandoProducto)}
                  className="flex-1 text-white py-3 rounded-xl font-bold transition-all transform hover:scale-105"
                  style={{ backgroundColor: '#B70101' }}
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditandoProducto(null)}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-xl font-bold hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de venta completada */}
      {mostrarVenta && pedidoCompletado && (
        <VentaCompletada venta={pedidoCompletado} />
      )}

      {/* Modal de pago para pedidos pendientes */}
      {mostrarModalPago && pedidoPagando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-4" style={{ borderColor: '#28a745' }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#563300' }}>
                💵 Registrar Pago
              </h2>
              <p className="text-lg mb-2">Cliente: <strong>{pedidoPagando.cliente}</strong></p>
              <p className="text-2xl font-bold mb-6" style={{ color: '#B70101' }}>
                Total: ${pedidoPagando.total.toFixed(2)}
              </p>
              
              <input
                type="number"
                placeholder="¿Cuánto paga el cliente?"
                value={montoPagoPendiente}
                onChange={(e) => setMontoPagoPendiente(e.target.value)}
                className="w-full border-3 rounded-xl px-6 py-4 text-xl font-bold text-center mb-4 focus:outline-none"
                style={{ borderColor: '#563300' }}
                autoFocus
              />
              
              {montoPagoPendiente && parseFloat(montoPagoPendiente) >= pedidoPagando.total && (
                <div className="text-xl font-bold p-3 rounded-xl mb-4" style={{
                  color: '#28a745',
                  backgroundColor: '#f0f0f0'
                }}>
                  💰 Cambio: ${(parseFloat(montoPagoPendiente) - pedidoPagando.total).toFixed(2)}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (parseFloat(montoPagoPendiente) >= pedidoPagando.total) {
                      marcarComoPagado(pedidoPagando.id, montoPagoPendiente);
                    } else {
                      alert('El pago debe ser mayor o igual al total');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ backgroundColor: '#28a745' }}
                  disabled={!montoPagoPendiente || parseFloat(montoPagoPendiente) < pedidoPagando.total}
                >
                  ✓ Confirmar Pago
                </button>
                <button
                  onClick={() => {
                    setMostrarModalPago(false);
                    setPedidoPagando(null);
                    setMontoPagoPendiente('');
                  }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-xl font-bold hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón de limpiar datos (solo para desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4">
          <button
            onClick={limpiarTodosLosDatos}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
          >
            🗑️ Limpiar Datos
          </button>
        </div>
      )}
    </div>
  );
};

function App() {
  return <CarniceriaApp />;
}

export default App;