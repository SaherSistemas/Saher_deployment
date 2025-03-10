

const express = require('express');
const router = express.Router();
const articuloController = require('../controllers/articuloController.js');
const usuariosController = require('../controllers/usuariosController.js');
const agenteController = require('../controllers/agenteController.js');
const clienteController = require('../controllers/clientesController.js');
const adminController = require('../controllers/administradoresController.js');
const landingPageController = require('../controllers/landingPageController.js');
const pedidoController = require('../controllers/pedidosController.js');
const pagoController = require('../controllers/pagoCobranzaControllers.js');


//proteger rutas
const auth = require('../middleware/auth.js');

module.exports = function () {
    /*ARTICULOS*/
    /*MOSTRAR TODOS LOS ARTICULOS  */
    router.get('/articulos',
        articuloController.mostrarArticulos);
    /*DESACTIVAR ARTICULOS  */
    router.patch('/articulos/desactivar', auth,
        articuloController.DesactivarArticulo);

    /*NUEVO ARTICULO*/
    /*MOSTRAR EL SIGUIENTE NUMERADOR PARA EL NUEVO ARTICULO  */
    router.get('/numerador', auth,
        articuloController.numerador);
    /*MOSTRAR LAS CLASIFICACIONES PARA UN NUEVO ARTICULO */
    router.get('/clasificacion', auth,
        articuloController.clasificaciones);

    /*SACAR LAS LAS UNIDADES DE MEDIDA */
    router.get('/unidadMedida', auth,
        articuloController.unidadMedida);

    /*SACAR CLAVE SAT  */
    router.get('/catservicio/:clave', auth,
        articuloController.obtenerServicioPorClave);

    /*SACAR LOS IVAS */
    router.get('/iva', auth,
        articuloController.obtenerIvas);

    /*ENVIAR EL ARTICULO PARA GUARDAR */
    router.post('/articulos', auth,
        articuloController.nuevoArticuloNew);

    /*ACTIVAR Y DESACTIVAR EL ARTICULO */
    router.patch('/articulos', auth,
        articuloController.activarYDesactivarArticulo);

    /*FALTA*/
    router.put('/articulos/:artcdartn',
        articuloController.modificarArticulo);

    router.get('/ListaParaPedido', articuloController.obtenerDatosPorGrupoParaPedido);

    router.get('/iva/:ivacdivan', articuloController.obtenerIVAProduc);

    router.get('/existencias/:artcdartn', articuloController.existenciasProducto);

    router.get('/productosLista', articuloController.obtenerDatosPorGrupo)

    router.get('/productosPromocionados', articuloController.obtenerProductosPromocionados)
    /*FIN ARTICULO */

    /*USUARIO*/
    // MOSTRAR TODOS LOS USUARIOS 
    router.get('/usuarios2', auth,
        usuariosController.allUsers1);

    /*NUEVO USUARIO */
    router.post('/crear-cuenta', usuariosController.agregarUsuario);
    /*INICIAR SESION */
    router.post('/iniciar-sesion', usuariosController.autenticarUsuario);

    router.get('/clientes/sinCuenta', auth,
        clienteController.todosClientesSinCuenta);

    router.get('/administradores/sinCuenta', auth,
        adminController.todosAdminSinCuenta);

    router.patch('/usuarios/activarDesactivar', auth,
        usuariosController.activarYDesactivarUsuario);

    // Ruta para cambiar la contraseña de un usuario
    router.patch('/usuarios/cambiarContrasena/:usuarioweb', auth,
        usuariosController.cambiarContrasenaSinVerificarAntigua);


    /* AGENTES */
    router.get('/agentes', auth,
        agenteController.todosAgentes);

    router.patch('/agente/activarDesactivar',
        agenteController.activarYDesactivarAgente);
    //MIS CLIENTES
    router.get('/misclientes/:idAgente', agenteController.misClientes)

    router.get('/agentes/sinCuenta', auth,
        agenteController.todosAgentesSinCuenta);

    /* CLIENTES */
    router.get('/obtenerDatosCliente', clienteController.obtenerDatosCliente)

    router.get('/clientes',
        auth, clienteController.todosClientes);

    router.get('/facturasvencidasCli',
        clienteController.obtenerFacturasVencidas);

    router.get('/obtenerUsuario',
        usuariosController.obtenerUsuario);


    // ADMINISTRADORES
    router.get('/administradores', auth,
        adminController.administradores);

    router.patch('/administrador/activarDesactivar',
        adminController.desactivarUsarios);

    router.get('/administrador/codSiguiente',
        adminController.cod_admin);

    router.post('/administrador',
        adminController.nuevoAdministrador);

    router.get('/perfil', usuariosController.perfil);

    router.get('/claveGrp/:clicdclic', clienteController.claveGrp);

    router.get('/detallesProducto/:artcdartn', clienteController.obtenerDetalles);

    //FACTURAS 
    router.get('/facturasTotal/:claveUsuario', clienteController.totalFacturas);


    router.get('/generarEstadoCuenta/:clicdclic', pagoController.generarEstadoDeCuenta);

    router.get('/facturas/obtenerRFC/:clicdclic', clienteController.obtenerRFC);

    router.get('/ofertas', landingPageController.obtenerOfertas);

    router.get('/TodasOfertas', landingPageController.obtenerTodasOfertas);

    router.post('/contacto', landingPageController.guardarContacto);
    // Ruta para obtener todos los contactos
    router.get('/contactos', auth, landingPageController.obtenerContactos);

    //PEDIDOS 
    router.post('/actualizarPedido', pedidoController.actualizarPedido)

    router.post('/actualizarCotizacion', pedidoController.actualizarCotizacion)

    router.get('/pedidosCliente', pedidoController.pedido);

    router.post('/procesarPedidoCliente', pedidoController.procesarPedidoCliente)

    router.post('/nuevoPedidoCliente', pedidoController.nuevoPedidoCliente);

    router.post('/generarPDf', pedidoController.generarCotizacion)

    router.get('/paqueterias', pedidoController.paqueterias);
    //PEDIDO
    router.get('/pedidos/diaAgente', pedidoController.pedidosDiaAgente);

    //DETALLE PEDIDO
    router.get('/pedidos/detalle/:pedidoId', pedidoController.detallePedido);


    router.get('/traerCarritoYCambiosDePrecio/:pedidoId', pedidoController.traerCarritoYCambiosDePrecio);

    router.get('/pedidosEnCaptura', pedidoController.pedidoCaptura);

    router.get('/pedidosEnCotizacion', pedidoController.pedidoCotizacion);

    router.put('/procesarPedidoAgente', pedidoController.procesarPedidoAgente);

    router.patch('/cambiarEnCaptura', pedidoController.cambiarEnCaptura);

    router.put('/cambiarACotizacion', pedidoController.cambiarACotizacion)

    router.post('/nuevoPedidoAgente', pedidoController.nuevoPedidoAgente)

    //PAGOS

    router.get('/bancos', pagoController.bancos)

    router.post('/registrarPago', pagoController.registrarPago)

    router.get('/obtenerBlocRecibos', pagoController.blocksRecibos)

    router.get('/obtenerRecibosDetalle', pagoController.obtenerRecibosDetalle);

    router.delete('/eliminarRecibos', pagoController.eliminarRecibos)
    return router;
}
