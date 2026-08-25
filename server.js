const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// REEMPLAZA CON TUS VALORES REALES
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4';
const WEBCHAT_CLIENT_ID = '6f30aa3c-4cd2-45e9-9f24-61d6d4d9a17f';

app.get('/', (req, res) => {
  res.send('Servidor Webhook Puente Activo');
});

// Función para consultar la respuesta generada por Botpress (Polling)
async function pollBotpressResponse(userKey, conversationId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res = await axios.get(
        `https://chat.botpress.cloud/v1/conversations/${conversationId}/messages`,
        {
          headers: {
            'x-user-key': userKey
          }
        }
      );

      const messages = res.data?.messages || [];
      // Filtrar mensajes que no sean del usuario y que tengan texto
      const botMessages = messages.filter(
        (m) => m.userId !== res.data?.userId && m.payload?.text
      );

      if (botMessages.length > 0) {
        return botMessages[botMessages.length - 1].payload.text;
      }
    } catch (e) {
      // Continuar reintentando si aún no está lista la respuesta
    }
  }
  return null;
}

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
      console.log(`[1/4] Mensaje entrante: "${userMessage}" (Chatwoot Conv: ${conversationId})`);

      // 1. Obtener / Crear usuario en Botpress Webchat
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

      // 2. Obtener / Crear conversación en Botpress
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

      // 3. Enviar mensaje a Botpress
      await axios.post(
        'https://chat.botpress.cloud/v1/messages',
        {
          conversationId: bpConvId,
          payload: {
            type: 'text',
            text: userMessage
          }
        },
        {
          headers: {
            'x-user-key': userKey,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[2/4] Mensaje entregado a Botpress. Esperando respuesta...`);

      // 4. Polling para obtener la respuesta del bot y enviarla a Chatwoot
      const botReply = await pollBotpressResponse(userKey, bpConvId);

      if (botReply) {
        console.log(`[3/4] Respuesta generada por Botpress: "${botReply.substring(0, 40)}..."`);
        await axios.post(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
          {
            content: botReply,
            message_type: 'outgoing',
            private: false
          },
          {
            headers: {
              api_access_token: CHATWOOT_API_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`[4/4] ¡Respuesta enviada a Chatwoot con éxito!`);
      } else {
        console.log('Botpress no generó respuesta a tiempo.');
      }
    } catch (err) {
      console.error('Error en el puente:', err.response?.data || err.message);
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
