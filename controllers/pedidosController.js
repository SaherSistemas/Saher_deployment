const PDFDocument = require("pdfkit");
const { Sequelize, Op } = require('sequelize');
const nodemailer = require('nodemailer');
const Pedidos = require('../models/PEDIDOS/Pedidos')
const Pedido1 = require('../models/PEDIDOS/Pedidos1');
const Clientes = require('../models/CLIENTES/Clientes');
const CuentasxCobrar = require('../models/CLIENTES/CuentasxCobrar');
const Remision = require('../models/CLIENTES/Remision');
const articulos = require('../models/ARTICULOS/Articulos');
const iva = require('../models/ARTICULOS/Iva');
const numerador = require('../models/ARTICULOS/Numerador');
const Agentes = require('../models/AGENTES/Agentes');
const Factura = require('../models/CLIENTES/Facturas');
const Paqueterias = require('../models/PEDIDOS/Paqueterias')
const Preciogpo = require('../models/CLIENTES/PrecioGpo.js');
const usuarios = require("../models/USUARIOS/Usuarios.js");


exports.actualizarPedido = async (req, res, next) => {
    try {
        const { pdicdpdin, carrito } = req.body;

        const cliente = await Pedidos.findOne({
            where:
            {
                pdicdpdin,
                empcdempn: 20
            },
            attributes: ['clicdclic'],
        })
        // Verificar saldo del cliente
        const saldoCliente = await Clientes.findByPk(cliente.dataValues.clicdclic.trim(), {
            attributes: ['clilimcrn', 'clisaldon']
        });
        const saldoDisponible = saldoCliente.dataValues.clilimcrn - saldoCliente.dataValues.clisaldon;

        // Calcular total de pedidos pendientes de facturar
        const pedidosPendientesDeFacturar = await Pedidos.findAll({
            where: {
                clicdclic: cliente.dataValues.clicdclic.trim(),
                pdistatuc: { [Op.in]: ['C', 'R', 'P'] },
                empcdempn: 20
            },
            attributes: ['pdicdpdin']
        });

        let totalPedidosPendientes = 0;
        if (pedidosPendientesDeFacturar && pedidosPendientesDeFacturar.length > 0) {
            for (const pedido of pedidosPendientesDeFacturar) {
                const pdicdpdin = pedido.dataValues.pdicdpdin;

                const articulosPedido = await Pedido1.findAll({
                    where: {
                        pdicdpdin,
                        empcdempn: 20
                    }
                });

                for (const articulo of articulosPedido) {
                    const precioArticulo = articulo.dataValues.pdiprevtn;
                    const cantidad = articulo.dataValues.pdicntpdn;

                    const articuloInfo = await articulos.findOne({
                        where: { artcdartn: articulo.dataValues.artcdartn },
                        attributes: ['ivacdivan']
                    });

                    const ivaP = await iva.findByPk(articuloInfo.dataValues.ivacdivan);
                    const ivaPorciento = ivaP.ivaporcen;

                    totalPedidosPendientes += (precioArticulo * cantidad) * (1 + ivaPorciento / 100);
                }
            }
        }

        // Calcular total del nuevo pedido
        let totalNuevoPedido = 0;
        for (const item of carrito) {
            const { cantidad, precioReal, articulo } = item;
            const { artcdartn } = articulo;

            const articuloInfo = await articulos.findOne({
                where: { artcdartn },
                attributes: ['ivacdivan']
            });

            const ivaP = await iva.findByPk(articuloInfo.dataValues.ivacdivan);
            const ivaPorciento = ivaP.ivaporcen;

            totalNuevoPedido += (precioReal * cantidad) * (1 + ivaPorciento / 100);
        }


        const totalPedidoCliente = totalPedidosPendientes + totalNuevoPedido;
        if (totalPedidoCliente > saldoDisponible) {
            return res.status(403).json({
                mensaje: 'El total del pedido nuevo y los pendientes excede el saldo disponible.',
            });
        }
        await Pedido1.destroy({ where: { pdicdpdin } });


        const nuevosArticulosPedido = carrito.map((item) => ({
            empcdempn: 20,
            pdicdpdin,
            artcdartn: item.articulo.artcdartn,
            pdiaplofc: 'N',
            pdidescrc: item.articulo.artdsartc.substring(0, 5),
            pdicntpdn: item.cantidad,
            pdicntsun: item.cantidad,
            pdicntchn: 0,
            pdiprevtn: item.precioReal,
            pdipranon: item.precioReal,
            pdiaplagc: '',
            pdipasilc: '',
            pdianaqun: 0,
            pdiniveln: 0,
            pdiposicn: 0,
            pdipesokn: 0,
        }))
        await Pedido1.bulkCreate(nuevosArticulosPedido)

        res.json({ mensaje: 'Pedido actualizado correctamente.' })
    } catch (error) {
        console.error("Error al actualizar el pedido:", error);
        res.status(500).json({ error: error.message });
        next(error);
    }

};

exports.actualizarCotizacion = async (req, res, next) => {
    const { pdicdpdin, carrito } = req.body;

    await Pedido1.destroy({ where: { pdicdpdin } });

    const nuevosArticulosPedido = carrito.map((item) => ({
        empcdempn: 20,
        pdicdpdin,
        artcdartn: item.articulo.artcdartn,
        pdiaplofc: 'N',
        pdidescrc: item.articulo.artdsartc.substring(0, 5),
        pdicntpdn: item.cantidad,
        pdicntsun: item.cantidad,
        pdicntchn: 0,
        pdiprevtn: item.precioReal,
        pdipranon: item.precioReal,
        pdiaplagc: '',
        pdipasilc: '',
        pdianaqun: 0,
        pdiniveln: 0,
        pdiposicn: 0,
        pdipesokn: 0,
    }))
    await Pedido1.bulkCreate(nuevosArticulosPedido)

    res.json({ mensaje: 'Pedido actualizado correctamente.' })
}


exports.generarCotizacion = async (req, res, next) => {
    const { carrito, clicdclic } = req.body;
    try {
        const datoCliente = await Clientes.findOne({ where: { clicdclic } });

        if (!datoCliente) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        // Datos del cliente
        const clicdclic1 = datoCliente.dataValues.clicdclic.trim();
        const clirazonc1 = datoCliente.dataValues.clirazonc.trim();
        const cliemailc1 = datoCliente.dataValues.cliemailc.trim();
        const clicallec = datoCliente.dataValues.clicallec.trim();
        const clicvrfcc = datoCliente.dataValues.clicvrfcc.trim();

        // Configurar PDF
        const doc = new PDFDocument({ margin: 40 });
        res.setHeader("Content-Disposition", "attachment; filename=cotizacion.pdf");
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Logo y encabezado
        doc.image("ic_Saher_sinBg.png", 40, 40, { width: 150 });
        doc.fillColor("#333")
            .fontSize(20)
            .text("Cotización de Pedido", 150, 50, { align: "right" })
            .moveDown();

        doc.fillColor("#444")
            .fontSize(12)
            .text("Empresa: FARMACIAS SAHER DE SINALOA S DE RL DE CV", 200, doc.y)
            .text("Dirección: Calle Pastor Rouix 2314 int B, Colonia Industrial El Palmito, Culiacán, Sinaloa", 200, doc.y)
            .text("Teléfono: 6677644798", 200, doc.y)
            .text("Email: farmacias.saher@gmail.com", 200, doc.y)
            .moveDown();

        // Fecha y detalles del cliente
        doc.fillColor("#444")
            .fontSize(12)
            .text(`Fecha: ${new Date().toLocaleDateString()}`, { align: "right" })
            .moveDown()
            .font("Helvetica-Bold")
            .text("Detalles del Cliente")
            .font("Helvetica")
            .text(`Clave Interna Cliente: ${clicdclic1 || "N/A"}`)
            .text(`Nombre: ${clirazonc1 || "N/A"}`)
            .text(`RFC: ${clicvrfcc || "N/A"}`)
            .text(`Correo: ${cliemailc1 || "N/A"}`)
            .text(`Dirección: ${clicallec || "N/A"}`)
            .moveDown();

        // Configurar tabla
        const xStart = 40;
        const columnWidths = [70, 200, 50, 80, 50]; // Ancho de columnas
        let yPosition = doc.y;
        const pageHeight = 720; // Altura máxima antes de agregar una nueva página
        const marginTop = 50;

        // Función para agregar encabezado de la tabla
        const drawTableHeader = (y) => {
            doc.rect(xStart, y, 550, 25).fill("#eeeeee").stroke();
            doc.fillColor("#000").fontSize(12)
                .text("Código", xStart + 10, y + 7)
                .text("Producto", xStart + columnWidths[0] + 10, y + 7)
                .text("Cantidad", xStart + columnWidths[0] + columnWidths[1] + 10, y + 7, { width: columnWidths[2], align: "right" })
                .text("Precio", xStart + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10, y + 7, { width: columnWidths[3], align: "right" })
                .text("Total", xStart + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 10, y + 7, { width: columnWidths[5], align: "right" });

            return y + 30;
        };

        yPosition = drawTableHeader(yPosition);

        let totalSinIVA = 0;
        let totalIVA = 0;

        for (const item of carrito) {
            // Validaciones para evitar valores NaN o undefined
            const codigo = item.articulo?.artcdartn || "N/A";
            const nombreProducto = item.articulo?.artdsartc || "Producto sin nombre";
            const cantidad = item.cantidad || 0;
            const precioReal = item.precioReal || 0;
            const subtotal = precioReal * cantidad;

            // CONSULTAR IVA 
            const articuloInfo = await articulos.findOne({
                where: { artcdartn: item.articulo.artcdartn },
                attributes: ['ivacdivan']
            });

            const ivaP = await iva.findByPk(articuloInfo.dataValues.ivacdivan);
            const ivaPorciento = ivaP.ivaporcen;

            // Calcular IVA
            const IVA = subtotal * (ivaPorciento / 100);
            totalSinIVA += subtotal;
            totalIVA += IVA;

            // Verificar si es necesario agregar una nueva página
            if (yPosition + 20 > pageHeight) {
                doc.addPage();
                yPosition = marginTop;
                yPosition = drawTableHeader(yPosition);
            }

            // Cambiar color a naranja si tiene IVA
            if (ivaPorciento > 0) {
                doc.fillColor("orange"); // Color naranja para productos con IVA
            } else {
                doc.fillColor("black"); // Color negro para productos sin IVA
            }

            // Agregar fila de producto
            doc.fontSize(10)
                .text(codigo, xStart + 10, yPosition + 10, { width: columnWidths[0] })
                .text(nombreProducto, xStart + columnWidths[0] + 10, yPosition + 10, { width: columnWidths[1] })
                .text(cantidad.toString(), xStart + columnWidths[0] + columnWidths[1] + 10, yPosition + 10, { width: columnWidths[2], align: "right" })
                .text(`$${precioReal.toFixed(2)}`, xStart + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10, yPosition + 10, { width: columnWidths[3], align: "right" })
                .text(`$${subtotal.toFixed(2)}`, xStart + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], yPosition + 10, { width: columnWidths[5], align: "right" });

            // Dibujar línea separadora en naranja si tiene IVA
            if (ivaPorciento > 0) {
                doc.strokeColor("green"); // Línea naranja para productos con IVA
            } else {
                doc.strokeColor("#165bc6"); // Línea azul para productos sin IVA
            }

            // Restaurar color negro para los siguientes productos
            doc.fillColor("black");
            doc.strokeColor("#ddd");
            yPosition += 40; // Espacio entre filas
            doc.moveDown(0.5);
            doc.moveTo(xStart, yPosition).lineTo(xStart + 550, yPosition).stroke();
        }


        // Agregar totales
        yPosition += 1;
        if (yPosition > pageHeight) {
            doc.addPage();
            yPosition = marginTop;
        }

        doc.fillColor("red").fontSize(12)
            .text(`Subtotal: $${totalSinIVA.toFixed(2)}`, xStart + 400, yPosition, { align: "right" })
            .text(`Total sin IVA: $${totalIVA.toFixed(2)}`, xStart + 400, yPosition + 15, { align: "right" })
            .text(`Total: $${(totalSinIVA + totalIVA).toFixed(2)}`, xStart + 400, yPosition + 30, { align: "right" });

        doc.end();
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Error al generar el PDF" });
        }
    }
};


exports.procesarPedidoCliente = async (req, res, next) => {
    const { clienteId, pdicdpdin, pdifecped, pdihorrec, carrito } = req.body;
    try {
        const { clinomcoc } = await Clientes.findByPk(clienteId)
        const tieneAbarrote = clinomcoc.toLowerCase().includes("abarrote");
        if (tieneAbarrote) {
            const remisiones = await Remision.findAll({
                where: {
                    clicdclic: clienteId,
                    empcdempn: 20,
                    remstatuc: 'A'
                },
                order: [['remfecred', 'DESC']],
                limit: 20
            })

            for (const remision of remisiones) {
                const facturasRem = await CuentasxCobrar.findAll({
                    attributes: [
                        'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                        'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                        'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
                        [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
                    ],
                    where: {
                        cxcnudocn: remision.remnufacn,
                        empcdempn: 20,
                        cxcstatuc: 'C',
                        cxcfevend: { [Op.lte]: new Date(new Date() - 10 * 24 * 60 * 60 * 1000) }, //CAMBIAR A 10 DIAS 
                    },
                    group: [
                        'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                        'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                        'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
                    ]
                });

                if (facturasRem.length > 0) {
                    return res.status(403).json({
                        mensaje: 'No puedes realizar un pedido debido a que tienes remisiones vencidas con más de 10 días vencida.',
                    });
                }
            }
        } else {
            const facturasVencidas = await CuentasxCobrar.findAll({
                attributes: [
                    'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                    'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                    'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
                    [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
                ],
                where: {
                    clicdclic: clienteId,
                    empcdempn: 20,
                    cxcstatuc: 'C',
                    cxcfevend: { [Op.lte]: new Date(new Date() - 10 * 24 * 60 * 60 * 1000) },
                },
                group: [
                    'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                    'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                    'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
                ]
            });

            if (facturasVencidas.length > 0) {
                return res.status(403).json({
                    mensaje: 'No puedes realizar un pedido debido a que tienes facturas vencidas con más de 10 días vencidas.',
                });
            }
        }
        await Pedidos.update(
            {
                pdistatuc: 'Z',
                pdifecped: pdifecped,
                pdihorrec: pdihorrec,
            },
            {
                where: {
                    pdicdpdin,
                    empcdempn: 20
                }
            }
        )

        const agente = await Clientes.findOne({
            attributes: ['cliagecvn'],
            where: {
                clicdclic: clienteId,
            }
        })
        const correoAgente = await Agentes.findOne({
            attributes: ['ageplazac'],
            where: {
                agecdagen: agente.dataValues.cliagecvn,
            }
        })

        const email = correoAgente.dataValues?.ageplazac;
        if (email) {

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'farmacias.saher@gmail.com',
                    pass: 'ahpa uwpg bkoa lulp',
                },
            });

            const nomCliente = await Clientes.findOne({
                attributes: ['clirazonc'],
                where: {
                    clicdclic: clienteId,
                }
            })

            const correo = {
                from: 'farmacias.saher@gmail.com',
                to: `${email}`,
                subject: `Nuevo Pedido Realizado: ${pdicdpdin}`,
                html: `
              <h1>Pedido Realizado</h1>
              <p>Se ha realizado un nuevo pedido con el siguiente folio:</p>
              <p><strong>Pedido: ${pdicdpdin}</strong></p>
              <p><strong>Cliente:</strong> ${nomCliente.dataValues.clirazonc}</p>
              <p><strong>Fecha:</strong> ${pdifecped}</p>
          
              <h3>Detalle del Pedido</h3>
              <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr>
                    <th>Código Artículo</th>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${carrito.map(item => {
                    const { articulo, cantidad, precioReal } = item;
                    return `
                      <tr>
                        <td>${articulo.artcdartn}</td>
                        <td>${articulo.artdsartc}</td>
                        <td>${cantidad}</td>
                        <td>${precioReal}</td>
                      </tr>
                    `;
                }).join('')}
                </tbody>
              </table>
          
              <p>Gracias por usar nuestro sistema.</p>
            `,
            };

            await transporter.sendMail(correo);

        } else {
            console.log('No se encontró un email asociado para esta clave.');
        }

        await usuarios.increment('cant_pedidos', {
            by: 1,
            where: { clvcli: clienteId }
        });

        res.json({ mensaje: 'Pedido procesado correctamente y correo enviado.' });
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }
}


exports.pedido = async (req, res, next) => {
    try {
        const cliente = req.query.clicdclic;
        const { fechaInicio, fechaFin } = req.query;

        // Validación de parámetros
        if (!cliente || !fechaInicio || !fechaFin) {
            return res.status(400).json({ mensaje: "Parámetros incompletos: cliente, fechaInicio o fechaFin." });
        }

        // Obtener los pedidos
        const pedidos = await Pedidos.findAll({
            attributes: [
                "empcdempn",
                "pdicdpdin", // Número de pedido (folio)
                "pdifecped",
                "pdiussurc",
                "pdiuschec",
                "pdiusempc",
                "pdihorfac",
                "clicdclic",
                "pdifecfad",
                "pdistatuc"
            ],
            where: {
                clicdclic: cliente,
                empcdempn: 20,
                pdifecped: {
                    [Op.between]: [fechaInicio, fechaFin],
                }
            },
            order: [
                ['pdifecped', 'DESC'] // Ordenar por fecha de pedido descendente
            ],
        });

        // Obtener las facturas
        const facturas = await Factura.findAll({
            attributes: [
                'fclfacdigc', // Folio digital de la factura
                'fclfolpec',  // Folio del pedido
            ],
            where: {
                empcdempn: 20,
            },
        });

        // Crear un mapa para emparejar las facturas con los pedidos
        const facturaMap = facturas.reduce((map, factura) => {
            map[factura.fclfolpec.trim()] = factura.fclfacdigc.trim();
            return map;
        }, {});


        // Combinar pedidos con su respectiva factura digital
        const pedidosConFacturas = pedidos.map((pedido) => {
            const pedidoJSON = pedido.toJSON(); // Convertir a JSON para manejar fácilmente el objeto
            return {
                ...pedidoJSON,
                facturaDigital: facturaMap[pedidoJSON.pdicdpdin.trim()] || null,
            };
        });
        res.json({ pedidos: pedidosConFacturas });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener los pedidos." });
    }
};



exports.pedidosDiaAgente = async (req, res, next) => {
    try {
        const { fecha, agenteId } = req.query;

        if (!fecha || !agenteId) {
            return res.status(400).json({ message: 'Faltan parámetros: fecha y agenteId son requeridos' });
        }

        // Obtén los clientes asociados al agente
        const clientesAgente = await Clientes.findAll({
            where: { cliagecvn: agenteId },
            attributes: ['clicdclic', 'clirazonc']
        });

        const clienteMap = clientesAgente.reduce((map, cliente) => {
            map[cliente.clicdclic] = cliente.clirazonc;
            return map;
        }, {});

        const clienteIds = Object.keys(clienteMap);

        if (clienteIds.length === 0) {
            return res.status(404).json({ message: 'El agente no tiene clientes asignados' });
        }

        // Obtén los pedidos
        const pedidos = await Pedidos.findAll({
            where: {
                pdifecped: fecha,
                clicdclic: clienteIds,
                empcdempn: 20
            }
        });

        if (pedidos.length === 0) {
            return res.status(200).json({ message: 'No se encontraron pedidos para los clientes asociados' });
        }

        // Añade la razón social al resultado
        const pedidosConRazonSocial = pedidos.map(pedido => ({
            ...pedido.toJSON(),
            clicdclic: pedido.clicdclic,
            clirazonc: clienteMap[pedido.clicdclic],
        }));

        res.status(200).json(pedidosConRazonSocial);
    } catch (error) {

        res.status(500).json({ error: error.message });
    }
};

exports.detallePedido = async (req, res) => {
    try {
        const { pedidoId } = req.params;

        const detalles = await Pedido1.findAll({
            where: {
                pdicdpdin: pedidoId,
                empcdempn: 20
            },
            include: [
                {
                    model: articulos,
                    as: 'articulos',
                    attributes: ['artcdartn', 'artdsartc', 'ivacdivan'], // Asegurar que 'artcdartn' está incluido
                },
            ],
        });

        if (detalles.length === 0) {
            return res.status(404).json({ message: 'No se encontraron detalles para este pedido.' });
        }

        // Extraer los IDs de los artículos
        const articulosIds = detalles.map(detalle => detalle.articulos?.artcdartn).filter(id => id);

        const preciosActuales = await Preciogpo.findAll({
            where: { artcdartn: articulosIds },
        })

        res.status(200).json(detalles);
    } catch (error) {
        console.error('Error al consultar detalles del pedido:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

exports.traerCarritoYCambiosDePrecio = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const { precioGrp } = req.query;

        const detallesAnteriores = await Pedido1.findAll({
            where: {
                pdicdpdin: pedidoId,
                empcdempn: 20
            },
            include: [
                {
                    model: articulos,
                    as: 'articulos',
                    attributes: ['artcdartn', 'artdsartc', 'ivacdivan'],
                },
            ],
        });

        if (detallesAnteriores.length === 0) {
            return res.status(404).json({ message: 'No se encontraron detalles para este pedido.' });
        }

        const articulosIds = detallesAnteriores.map(detalle => detalle.articulos?.artcdartn).filter(id => id);

        const preciosActuales = await Preciogpo.findAll({
            where: {
                artcdartn: articulosIds,
                grpcdgrpn: precioGrp
            },
        });

        const preciosMap = {};

        preciosActuales.forEach(articuloPrecio => {
            let precioReal;
            if (articuloPrecio.grppreofn && new Date(articuloPrecio.grpfecofd) >= new Date()) {
                precioReal = articuloPrecio.grppreofn;
            } else {
                precioReal = articuloPrecio.grpprecin;
            }
            preciosMap[articuloPrecio.artcdartn] = precioReal;
        });

        let cambios = [];

        for (let detalle of detallesAnteriores) {
            const articulo = detalle.articulos;
            const precioActual = preciosMap[articulo.artcdartn];
            const precioPrevio = detalle.dataValues.pdiprevtn;

            if (precioActual !== precioPrevio) {
                const resultado = await Pedido1.update(
                    { pdiprevtn: precioActual, pdipranon: precioActual },
                    { where: { empcdempn: 20, pdicdpdin: pedidoId, artcdartn: articulo.artcdartn } }
                );

                if (resultado[0] === 0) {
                    console.log('No se actualizó ningún registro.');
                } else {
                    console.log('Precio actualizado con éxito.');
                }

                cambios.push({
                    articulo: articulo.artdsartc,
                    precio_anterior: precioPrevio,
                    nuevo_precio: precioActual,
                    subio: precioPrevio < precioActual
                });
            }
        }

        const detalles = await Pedido1.findAll({
            where: {
                pdicdpdin: pedidoId,
                empcdempn: 20
            },
            include: [
                {
                    model: articulos,
                    as: 'articulos',
                    attributes: ['artcdartn', 'artdsartc', 'ivacdivan'],
                },
            ],
        });

        res.status(200).json({
            detalles,
            cambios
        });

    } catch (error) {
        console.error('Error al consultar detalles del pedido:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};




exports.pedidoCaptura = async (req, res, next) => {
    try {

        const { clicdclic } = req.query;

        const pedidoEnCaptura = await Pedidos.findAll({
            where:
            {
                clicdclic: clicdclic,
                [Op.or]: [
                    { pdistatuc: 'E' },
                ],
                empcdempn: 20
            }
        })


        return res.status(200).json({
            pedidoEnCaptura: pedidoEnCaptura,
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Hubo un problema.',
            details: error.message
        });
    }
};
exports.pedidoCotizacion = async (req, res, next) => {
    try {

        const { clicdclic } = req.query;

        const pedidoEnCotizacion = await Pedidos.findAll({
            where:
            {
                clicdclic: clicdclic,
                [Op.or]: [
                    { pdistatuc: 'Z' }
                ],
                empcdempn: 20
            }
        })


        return res.status(200).json({
            pedidoEnCotizacion: pedidoEnCotizacion,
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Hubo un problema.',
            details: error.message
        });
    }
};

exports.procesarPedidoAgente = async (req, res, next) => {
    const { clienteId, pdicdpdin, today, hora, paqueteriaSeleccionada } = req.body;
    try {
        const { clinomcoc } = await Clientes.findByPk(clienteId)
        const tieneAbarrote = clinomcoc.toLowerCase().includes("abarrote");
        if (tieneAbarrote) {
            const remisiones = await Remision.findAll({
                where: {
                    clicdclic: clienteId,
                    empcdempn: 20,
                    remstatuc: 'A'
                },
                order: [['remfecred', 'DESC']],
                limit: 20
            })

            for (const remision of remisiones) {
                const facturasRem = await CuentasxCobrar.findAll({
                    attributes: [
                        'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                        'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                        'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
                        [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
                    ],
                    where: {
                        cxcnudocn: remision.remnufacn,
                        empcdempn: 20,
                        cxcstatuc: 'C',
                        cxcfevend: { [Op.lte]: new Date(new Date() - 1000 * 24 * 60 * 60 * 1000) }, //CAMBIAR A 10 DIAS 
                    },
                    group: [
                        'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                        'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                        'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
                    ]
                });

                if (facturasRem.length > 0) {
                    return res.status(403).json({
                        mensaje: 'No puedes realizar un pedido debido a que tienes remisiones vencidas con más de 10 días vencida.',
                    });
                }
            }
        } else {
            const facturasVencidas = await CuentasxCobrar.findAll({
                attributes: [
                    'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                    'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                    'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn',
                    [Sequelize.fn('SUM', Sequelize.literal('cxcsubton + cxcimivan')), 'total_suma']
                ],
                where: {
                    clicdclic: clienteId,
                    empcdempn: 20,
                    cxcstatuc: 'C',
                    cxcfevend: { [Op.lte]: new Date(new Date() - 1000 * 24 * 60 * 60 * 1000) },
                },
                group: [
                    'empcdempn', 'clicdclic', 'cxctpdocc', 'cxcnudocn', 'cxcfolfin',
                    'cxcfedocd', 'cxcfeulpd', 'cxcporcon', 'cxcfevend', 'cxcfecand',
                    'cxcstatuc', 'agecdagen', 'cxcivapon', 'cxcpagvic', 'cxcfoldic', 'cxctocivn'
                ]
            });

            if (facturasVencidas.length > 0) {
                return res.status(403).json({
                    mensaje: 'No puedes realizar un pedido debido a que tienes facturas vencidas con más de 10 días vencidas.',
                });
            }
        }

        await Pedidos.update(
            {
                pdistatuc: 'C',
                pdifecped: today,
                pdihorrec: hora,
                paqcdpaqn: paqueteriaSeleccionada
            },
            {
                where: {
                    pdicdpdin,
                    empcdempn: 20
                }
            }
        )


        res.json({ mensaje: 'Pedido procesado correctamente.' });
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }
}

exports.cambiarEnCaptura = async (req, res, next) => {
    const { pdicdpdin, clienteId } = req.body;
    try {
        const pedidosEnCaptura = await Pedidos.findAll(
            {
                where: {
                    clicdclic: clienteId,
                    pdistatuc: 'E',
                    empcdempn: 20
                }
            }
        )
        if (pedidosEnCaptura.length > 0) {
            return res.status(404).json({ message: 'Ya tiene un pedido en captura' });
        }
        await Pedidos.update(
            {
                pdistatuc: 'E',
            },
            {
                where: {
                    pdicdpdin,
                    empcdempn: 20
                }
            }
        )

        res.status(200).json({ mensaje: 'Estatus actualizado correctamente' });

    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }
}

exports.cambiarACotizacion = async (req, res, next) => {
    const { pdicdpdin } = req.body;
    try {

        await Pedidos.update(
            {
                pdistatuc: 'Z',
            },
            {
                where: {
                    pdicdpdin,
                    empcdempn: 20
                }
            }
        )

        res.status(200).json({ mensaje: 'Estatus actualizado correctamente' });

    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }
}

exports.nuevoPedidoAgente = async (req, res, next) => {
    const { empcdempn, pdifecped, pdihorrec, clicdclic, carrito } = req.body;

    try {
        const resultado = await numerador.findOne({
            attributes: ['numfolcon'],
            where: {
                numcdnumn: 14,
                empcdempn: 20,
            },
        });
        let sigRegistro = 0;

        if (resultado) {
            const numfolcon = resultado.numfolcon;
            const numEnter = parseInt(numfolcon, 10);
            sigRegistro = numEnter + 1;
        }
        const nuevoPedido = {
            empcdempn: empcdempn,
            pdicdpdin: sigRegistro,
            pdifecped: pdifecped,
            pdifecfad: '0001-01-01',
            pdistatuc: 'E',
            pdifolpec: '',
            pdipaquec: '',
            pdinumguc: '',
            pditelmac: 'N',
            clicdclic: clicdclic,
            pdihorrec: pdihorrec,
            pdihorfac: '',
            pdihorauc: '',
            paqcdpaqn: 0,
            pdiimguan: 0,
            pdiimguin: 0,
            pdiussurc: '',
            pdihosurc: '',
            pdiuschec: '',
            pdihochec: '',
            pdiusempc: '',
            pdihoempc: '',
        };

        const pedidoEncabezado = await Pedidos.create(nuevoPedido);

        const pedidos = carrito.map((item) => {
            const { almexistn, articulo, precioGrupo, caducidad, grppreofn, grpfecofd, precioReal, cantidad } = item;
            const { artcdartn, artdsartc, artdsgenc, artemporn } = articulo;


            const pdidescrc = artdsartc.substring(0, 5);


            const pdiaplofc = grppreofn !== '0.00' && grppreofn !== precioReal ? 'S' : 'N';


            return {
                empcdempn: 20,
                pdicdpdin: sigRegistro,
                artcdartn,
                pdiaplofc,
                pdidescrc,
                pdicntpdn: cantidad,
                pdicntsun: cantidad,
                pdicntchn: 0,
                pdiprevtn: precioReal,
                pdipranon: precioReal,
                pdiaplagc: '',
                pdipasilc: '',
                pdianaqun: 0,
                pdiniveln: 0,
                pdiposicn: 0,
                pdipesokn: 0,
            };
        });

        await Pedido1.bulkCreate(pedidos);


        const ulti = sigRegistro
        await numerador.update(
            { numfolcon: ulti },
            { where: { numcdnumn: 14, empcdempn: 20 } }
        )
        res.status(200).json({ mensaje: sigRegistro });
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }

}

exports.nuevoPedidoCliente = async (req, res, next) => {
    const { empcdempn, pdifecped, pdihorrec, clicdclic, carrito } = req.body;

    try {
        const resultado = await numerador.findOne({
            attributes: ['numfolcon'],
            where: {
                numcdnumn: 14,
                empcdempn: 20,
            },
        });
        let sigRegistro = 0;

        if (resultado) {
            const numfolcon = resultado.numfolcon;
            const numEnter = parseInt(numfolcon, 10);
            sigRegistro = numEnter + 1;
        }
        const nuevoPedido = {
            empcdempn: empcdempn,
            pdicdpdin: sigRegistro,
            pdifecped: pdifecped,
            pdifecfad: '0001-01-01',
            pdistatuc: 'E',
            pdifolpec: '',
            pdipaquec: '',
            pdinumguc: '',
            pditelmac: 'T',
            clicdclic: clicdclic,
            pdihorrec: pdihorrec,
            pdihorfac: '',
            pdihorauc: '',
            paqcdpaqn: 0,
            pdiimguan: 0,
            pdiimguin: 0,
            pdiussurc: '',
            pdihosurc: '',
            pdiuschec: '',
            pdihochec: '',
            pdiusempc: '',
            pdihoempc: '',
        };
        //
        const pedidoEncabezado = await Pedidos.create(nuevoPedido);

        const pedidos = carrito.map((item) => {
            const { almexistn, articulo, precioGrupo, caducidad, grppreofn, grpfecofd, precioReal, cantidad } = item;
            const { artcdartn, artdsartc, artdsgenc, artemporn } = articulo;


            const pdidescrc = artdsartc.substring(0, 5);


            const pdiaplofc = grppreofn !== '0.00' && grppreofn !== precioReal ? 'S' : 'N';


            return {
                empcdempn: 20,
                pdicdpdin: sigRegistro,
                artcdartn,
                pdiaplofc,
                pdidescrc,
                pdicntpdn: cantidad,
                pdicntsun: cantidad,
                pdicntchn: 0,
                pdiprevtn: precioReal,
                pdipranon: precioReal,
                pdiaplagc: '',
                pdipasilc: '',
                pdianaqun: 0,
                pdiniveln: 0,
                pdiposicn: 0,
                pdipesokn: 0,
            };
        });

        await Pedido1.bulkCreate(pedidos);


        const ulti = sigRegistro
        await numerador.update(
            { numfolcon: ulti },
            { where: { numcdnumn: 14, empcdempn: 20 } }
        )
        res.status(200).json({ mensaje: sigRegistro });
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).json({ mensaje: 'Error al procesar el pedido.', error: error.message });
        next(error);
    }

}


exports.paqueterias = async (req, res, next) => {
    const paqueterias = await Paqueterias.findAll({
        attributes: ['paqcdpaqn', 'paqnomcoc'],
        where: {
            paqstatuc: 'A'
        }
    });
    const paqueteriaLimpia = paqueterias.map(paquete => ({
        paqcdpaqn: paquete.paqcdpaqn,
        paqnomcoc: paquete.paqnomcoc.toUpperCase()
    }))

    res.status(200).json(paqueteriaLimpia);
}