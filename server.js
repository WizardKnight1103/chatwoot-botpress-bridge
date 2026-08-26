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

// Función de polling para esperar la respuesta generada por el agente
async function pollBotpressResponse(userKey, conversationId, userMessageId, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
      // Filtrar mensajes que provengan del bot y tengan contenido de texto
      const botMessages = messages.filter(
        (m) => m.id !== userMessageId && m.userId !== res.data?.userId && m.payload?.text
      );

      if (botMessages.length > 0) {
        return botMessages[0].payload.text;
      }
    } catch (e) {
      // Continuar esperando si la respuesta aún no termina de generarse
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

      // 1. Obtener / Crear usuario de Webchat vinculado al Client ID
      const userRes = await axios.post(
        'https://chat.botpress.cloud/v1/users',
        {},
        {
          headers: {
            'x-user-key': `cw_user_${senderId}`,
            'x-bp-client': WEBCHAT_CLIENT_ID,
            'Content-Type': 'application/json'
          }
        }
      );
      const userKey = userRes.data?.key;

      // 2. Obtener / Crear conversación
      const convRes = await axios.post(
        'https://chat.botpress.cloud/v1/conversations',
        {},
        {
          headers: {
            'x-user-key': userKey,
            'x-bp-client': WEBCHAT_CLIENT_ID,
            'Content-Type': 'application/json'
          }
        }
      );
      const bpConvId = convRes.data?.conversation?.id;

      // 3. Enviar mensaje del usuario a Botpress
      const msgRes = await axios.post(
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
      const sentMsgId = msgRes.data?.message?.id;
      console.log(`[2/4] Mensaje entregado a Botpress. Esperando respuesta del agente...`);

      // 4. Esperar y recoger la respuesta del bot
      const botReply = await pollBotpressResponse(userKey, bpConvId, sentMsgId);

      if (botReply) {
        console.log(`[3/4] Respuesta generada por Botpress: "${botReply.substring(0, 45)}..."`);
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
        console.log(`[4/4] ¡Mensaje entregado a Chatwoot con éxito!`);
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
