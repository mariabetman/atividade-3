// servico-notificacao-service.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let porta = 8085;
app.listen(porta, () => {
    console.log('Serviço de notificação em execução na porta: ' + porta);
});

const USUARIOS_SERVICE_URL = 'http://localhost:8081/usuarios';

// POST /notificacoes - simula envio de notificação com verificação de usuário
app.post('/notificacoes', async (req, res) => {
    const { idUsuario, mensagem } = req.body;

    if (!mensagem) {
        return res.status(400).json({ error: 'Mensagem obrigatória.' });
    }

    if (idUsuario) {
        try {
            const usuarioRes = await axios.get(`${USUARIOS_SERVICE_URL}/${idUsuario}`).catch(() => null);
            if (!usuarioRes || !usuarioRes.data) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
        } catch (err) {
            console.error('Erro ao verificar usuário:', err.message);
            return res.status(500).json({ error: 'Erro ao verificar usuário.' });
        }
    }

    console.log(`[NOTIFICAÇÃO] ${mensagem}` + (idUsuario ? ` (Usuário: ${idUsuario})` : ''));

    res.status(200).json({ status: 'Notificação enviada com sucesso (simulada).' });
});
