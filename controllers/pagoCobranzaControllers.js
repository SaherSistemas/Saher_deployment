const Bancos = require('../models/PAGO-COBRANZA/Bancos');
const { Op } = require('sequelize');
const Sequelize = require('../database/index')
const Blorecibos = require('../models/PAGO-COBRANZA/Blorecibos');
const Recibos = require('../models/PAGO-COBRANZA/Recibos');
const Recibos1 = require('../models/PAGO-COBRANZA/Recibos1');
const Recibos2 = require('../models/PAGO-COBRANZA/Recibos2')

exports.bancos = async (req, res, next) => {
    try {
        const bancos = await Bancos.findAll({
            attributes: ['bancdbann', 'bandsbann'],
            where: { bancdbann: { [Op.ne]: 0 } },
            order: [['bancdbann', 'ASC']],
            raw: true
        });

        const bancosLimpio = bancos.map(banco => ({
            bancdbann: banco.bancdbann,
            bandsbann: banco.bandsbann.trim().toUpperCase(),
        }));

        res.status(200).json(bancosLimpio);
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
};


exports.registrarPago = async (req, res, next) => {
    const { numeroRecibo, fechaDeposito, clienteId, tipodoc, banco, totaldepositado, facturas } = req.body;
    const agente = facturas[0].agecdagen;
    try {
        const blocRecibos = await Blorecibos.findAll({
            where: {
                agecdagen: agente,
                blostatuc: 'V',
                empcdempn: 20
            }
        });

        const reciboValido = blocRecibos.some(blorecibo =>
            numeroRecibo >= blorecibo.blofolinn && numeroRecibo <= blorecibo.blofolfin
        );

        if (!reciboValido) {
            return res.status(400).json({ message: "El recibo no pertenece al Agente" });
        }

        const reciboExiste = await Recibos.findAll({
            where: {
                empcdempn: 20,
                rbocdrbon: numeroRecibo,
            }
        });

        if (reciboExiste.length > 0) {
            return res.status(400).json({ message: "El recibo ya está registrado" });
        }

        const infoRecibo = {
            empcdempn: 20,
            rbocdrbon: numeroRecibo,
            rbofecred: fechaDeposito,
            rbofeccad: '0001-01-01',
            rbofecapD: '0001-01-01',
            rboimpden: totaldepositado,
            rbototren: totaldepositado,
            rbostatuc: 'C',
            rboctnfan: facturas.length,
            rbofecpad: '0001-01-01',
            clicdclic: facturas[0].clicdclic,
            rbofolfic: '',
            rbouuidrc: ''
        };

        const infoRecibo1 = {
            empcdempn: 20,
            rbocdrbon: numeroRecibo,
            rbonummon: 1,
            rbotipdocc: tipodoc,
            rbocdbann: banco,
            rboimdepn: totaldepositado
        };
        const infoRecibo2 = facturas.map((factura, index) => ({
            empcdempn: factura.empcdempn,
            rbocdrbon: parseFloat(numeroRecibo),
            rbonofacn: index + 1,
            rbofactun: parseFloat(factura.cxcnudocn),
            rboimpfac: parseFloat(factura.total_suma),
            rbontcren: null,
            rboimpntn: null,
            rboimppan: parseFloat(factura.abono),
            rbofdigc: factura.cxcfoldic.trim(),
            rbosaldon: 0
        }));

        try {
            await Recibos.create(infoRecibo);
            await Recibos1.create(infoRecibo1);

            if (infoRecibo2.length === 1) {
                await Recibos2.create(infoRecibo2[0]); // Para un solo registro
            } else if (infoRecibo2.length > 1) {
                await Recibos2.bulkCreate(infoRecibo2); // Para múltiples registros
            }


            res.status(200).json({ message: "Pago recibido correctamente" });
        } catch (error) {
            console.error("Error al registrar el pago:", error);
            res.status(500).json({ message: "Error al registrar el pago" });
        }
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


exports.blocksRecibos = async (req, res) => {
    try {
        const { claveAgente } = req.query;

        if (!claveAgente) {
            return res.status(400).json({ mensaje: "Falta el claveAgente en la petición." });
        }

        const blocRecibos = await Blorecibos.findAll({
            where: {
                agecdagen: claveAgente,
                empcdempn: 20
            },
            order: [
                ["blofecend", "DESC"]
            ]
        });

        // Verifica si se encontraron registros
        if (blocRecibos.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron recibos para este agente." });
        }

        res.json({ mensaje: "Datos recibidos correctamente", recibos: blocRecibos || [] });


    } catch (error) {
        console.error("Error al obtener los recibos:", error);
        res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
    }
};



exports.obtenerRecibosDetalle = async (req, res) => {
    try {
        const { folioIni } = req.query;
        if (!folioIni) {
            return res.status(400).json({ message: "Se requiere folioIni" });
        }

        // Obtener el folio final desde blorecibos
        const blorecibo = await Blorecibos.findOne({
            where: {
                blofolinn: folioIni,
                empcdempn: 20
            }
        });
        if (!blorecibo) {
            return res.json([]);
        }

        const folioFin = blorecibo.dataValues.blofolfin;

        const recibos = await Recibos.findAll({
            where: {
                rbocdrbon: {
                    [Op.between]: [folioIni, folioFin]
                },
                empcdempn: 20
            },
        });
        res.json(recibos.length > 0 ? recibos : []);
    } catch (error) {
        console.error("Error al obtener recibos", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


exports.eliminarRecibos = async (req, res) => {
    const { rbocdrbon } = req.query;
    try {
        await Recibos.destroy({
            where: { rbocdrbon },
        });
        await Recibos1.destroy({
            where: { rbocdrbon },
        });
        await Recibos2.destroy({
            where: { rbocdrbon },
        });
        res.status(200).json({ message: 'Recibos eliminados exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar recibos', details: error })
    }
}