// servico-notificacao-service.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let porta = 8085;
app.listen(porta, () => {
    console.log('Serviço de notificação em execução na porta: ' + porta);
});

// POST /notificacoes - simula envio de notificação
app.post('/notificacoes', (req, res) => {
    const { idUsuario, mensagem } = req.body;

    if (!mensagem) {
        return res.status(400).json({ error: 'Mensagem obrigatória.' });
    }

    console.log(`[NOTIFICAÇÃO] ${mensagem}` + (idUsuario ? ` (Usuário: ${idUsuario})` : ''));

    res.status(200).json({ status: 'Notificação enviada com sucesso (simulada).' });
});
