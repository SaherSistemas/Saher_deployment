const Bancos = require('../models/PAGO/Bancos');
const { Op, Sequelize } = require('sequelize');
const Blorecibos = require('../models/PAGO/Blorecibos');
const Recibos = require('../models/PAGO/Recibos');

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
    const { numeroRecibo, fechaDeposito, clienteId, tipodoc, banco, totaldepositado, facturas } = req.body

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
            return res.status(400).json({ message: "Número de recibo fuera del rango permitido" });
        }

        const reciboExiste = await Recibos.findAll({
            where: {
                empcdempn: 20,
                rbocdrbon: numeroRecibo,
            }
        })

        if (reciboExiste.length > 0) {
            return res.status(400).json({ message: "El recibo ya esta registrado" })
        }

        const infoRecibo = {
            empcdempn: 20,
            rbocdrbon: numeroRecibo,
            rbofechred: fechaDeposito,
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
        }
        //console.log("Recibos: ", infoRecibo)

        const infoRecibo1 = {
            empcdempn: 20,
            rbocdrbon: numeroRecibo,
            rbonummon: 1,
            rbotipdocc: tipodoc,
            rbocdbann: banco,
            rboimdepn: totaldepositado
        }
        // console.log("Recibo1: ", infoRecibo1)

        const facturasTransformadas = facturas.map(factura => ({
            empcdempn: factura.empcdempn,
            rbocdrbon: parseFloat(factura.cxcnudocn), // Puedes usar `cxcnudocn` para obtener `rbocdrbon`
            rbonofacn: 1, // Asumimos que cada factura representa una sola factura pagada
            rbofactun: parseFloat(factura.total_suma),
            rbontcren: null,
            rboimpntn: null,
            rboimppan: parseFloat(factura.abono), // Puede que `total_suma` sea el total que necesitas
            rbofdigc: factura.cxcstatuc, // Asumimos que `cxcstatuc` es lo que quieres usar para `rbofdigc`
            rbosaldon: parseFloat(factura.total_deuda) // Total deuda
        }));

        console.log(facturasTransformadas)
        res.status(200).json({ message: "Pago recibido correctamente" });
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
