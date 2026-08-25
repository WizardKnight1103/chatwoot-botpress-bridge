const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// REEMPLAZA CON TUS TOKENS REALES
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4';

// Client ID del canal Webchat obtenido de Advanced
const WEBCHAT_CLIENT_ID = '6f30aa3c-4cd2-45e9-9f24-61d6d4d9a17f';

app.get('/', (req, res) => {
  res.send('Servidor Webhook Puente Activo');
});

app.post('/chatwoot-webhook', async (req, res) => {
  res.status(200).send('OK');

  const event = req.body;

  if (
    event &&
    event.event === 'message_created' &&
    event.message_type === 'incoming' &&
    !event.private
  ) {
    const userMessage = event.content;
    const conversationId = event.conversation?.id;
    const accountId = event.account?.id;
    const senderId = event.sender?.id || conversationId;

    if (!userMessage || !conversationId || !accountId) return;

    try {
      console.log(`[1/3] Procesando mensaje: "${userMessage}" (Chatwoot Conv: ${conversationId})`);

      // 1. Obtener / Crear usuario de Webchat con el Client ID
      const userRes = await axios.post(
        'https://chat.botpress.cloud/v1/users',
        {},
        {
          headers: {
            'x-user-key': `cw_user_${senderId}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const userKey = userRes.data?.key;
      const bpUserToken = userRes.data?.user?.id;

      // 2. Obtener / Crear conversación
      const convRes = await axios.post(
        'https://chat.botpress.cloud/v1/conversations',
        {},
        {
          headers: {
            'x-user-key': userKey,
            'Content-Type': 'application/json'
          }
        }
      );
      const bpConvId = convRes.data?.conversation?.id;

      // 3. Enviar el mensaje adjuntando el ID de la conversación de Chatwoot
      const messageContent = `[Chatwoot conv_id: ${conversationId}] ${userMessage}`;

      await axios.post(
        'https://chat.botpress.cloud/v1/messages',
        {
          conversationId: bpConvId,
          payload: {
            type: 'text',
            text: messageContent
          }
        },
        {
          headers: {
            'x-user-key': userKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`[2/3] Mensaje entregado al agente de Botpress correctamente.`);
    } catch (err) {
      console.error(
        'Error en el flujo del puente:',
        err.response?.data || err.message
      );
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
