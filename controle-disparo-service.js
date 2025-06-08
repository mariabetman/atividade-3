// controle-disparo-service.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let porta = 8086;
app.listen(porta, () => {
    console.log('Servidor de controle de disparo em execução na porta: ' + porta);
});

const LOGGING_SERVICE_URL = 'http://localhost:8084/logs';
const NOTIFICACAO_SERVICE_URL = 'http://localhost:8085/notificacoes';

// POST /disparo - simula o disparo do alarme
app.post('/disparo', async (req, res) => {
    const { idAlarme, ponto, idUsuario } = req.body;

    if (!idAlarme || !ponto) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios: idAlarme, ponto.' });
    }

    try {
        // Envia notificação
        await axios.post(`${NOTIFICACAO_SERVICE_URL}`, {
            idUsuario,
            mensagem: `DISPARO DETECTADO! Alarme ${idAlarme} - Ponto: ${ponto}`
        });

        // Registra o evento no log
        await axios.post(`${LOGGING_SERVICE_URL}`, {
            idAlarme,
            idUsuario: idUsuario || null,
            evento: `Disparo no ponto ${ponto}`,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({ message: 'Disparo registrado com sucesso.' });
    } catch (err) {
        console.error('Erro no controle de disparo:', err.message);
        res.status(500).json({ error: 'Erro ao processar disparo.' });
    }
});
