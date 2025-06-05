// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor na porta 8080
let porta = 8083;
app.listen(porta, () => {
    console.log('Servidor em execução na porta: ' + porta);
});

const CADASTRO_ALARMES_SERVICE_URL = 'http://localhost:8082';
const LOGGING_SERVICE_URL = 'http://localhost:8084/logs';
const NOTIFICACAO_SERVICE_URL = 'http://localhost:8085/notificacoes';

// Função helper para obter o alarme via proxy
async function getAlarme(id) {
    try {
        const res = await axios.get(`${CADASTRO_ALARMES_SERVICE_URL}/alarmes/${id}`);
        return res.data;
    } catch (error) {
        throw new Error('Erro ao buscar estado do alarme');
    }
}

// Função helper para verificar se o usuário tem permissão para acionar/desligar o alarme
function usuarioTemPermissao(alarme, idUsuario) {
    return alarme.usuarios_permitidos.includes(idUsuario);
}

// Função helper para atualizar o estado acionado do alarme via proxy
async function atualizarEstadoAlarme(id) {
    try {
        const res = await axios.patch(`${CADASTRO_ALARMES_SERVICE_URL}/alarmes/${id}/acionado`);
        return res.data;
    } catch (error) {
        throw new Error('Erro ao atualizar estado do alarme');
    }
}

// Função helper para enviar notificação via proxy
async function enviarNotificacao(data) {
    try {
        await axios.post(`${NOTIFICACAO_SERVICE_URL}/notificacoes;`, {
            idUsuario,
            mensagem
        });
    } catch (error) {
        console.error('Erro ao enviar notificação:', error.message);
    }
}

// Função para registrar evento no serviço de log
async function registrarLog(idAlarme, idUsuario, evento) {
    try {
        await axios.post(`${LOGGING_SERVICE_URL}/logs;`, {
            idAlarme,
            idUsuario,
            evento,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao registrar log:', error.message);
    }
}

// Método HTTP POST /acionamento/acionar/:id - aciona um alarme
app.post('/acionamento/acionar/:id', async (req, res) => {
    const id = req.params.id;
    const idUsuario = req.body.idUsuario;

    if (!idUsuario) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    try {
        const alarme = await getAlarme(id);

        if (!alarme) return res.status(404).json({ error: 'Alarme não encontrado' });
        if (!usuarioTemPermissao(alarme, idUsuario)) return res.status(403).json({ error: 'Usuário não tem permissão para acionar este alarme' });
        if (alarme.acionado) return res.status(400).json({ error: 'Alarme já está acionado' });

        await atualizarEstadoAlarme(id);
        await enviarNotificacao(idUsuario, `O alarme ${id} foi acionado com sucesso.`);
        await registrarLog(id, idUsuario, 'Acionamento');

        return res.status(200).json({ message: 'Alarme acionado com sucesso' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Método HTTP POST /acionamento/desligar/:id - desliga um alarme
app.post('/acionamento/desligar/:id', async (req, res) => {
    const id = req.params.id;
    const idUsuario = req.body.idUsuario;

    if (!idUsuario) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    try {
        const alarme = await getAlarme(id);

        if (!alarme) return res.status(404).json({ error: 'Alarme não encontrado' });
        if (!usuarioTemPermissao(alarme, idUsuario)) return res.status(403).json({ error: 'Usuário não tem permissão para desligar este alarme' });
        if (!alarme.acionado) return res.status(400).json({ error: 'Alarme já está desligado' });

        await atualizarEstadoAlarme(id);
        await enviarNotificacao(idUsuario, `O alarme ${id} foi desligado com sucesso.`);
        await registrarLog(id, idUsuario, 'Desligamento');

        return res.status(200).json({ message: 'Alarme desligado com sucesso' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
    });