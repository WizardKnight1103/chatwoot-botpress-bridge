const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// REEMPLAZA CON TUS TOKENS REALES
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4';
const BOTPRESS_BOT_ID = '84e3f57b-7710-4c3e-a647-a46a637c1938';
const BOTPRESS_PAT = 'bp_pat_Y6G8i5hJnM6IBd26uCpZJLDOTRvuRBE30eQK';

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
      console.log(`[1/3] Enviando mensaje a Botpress: "${userMessage}"`);

      // 1. Enviar mensaje a Botpress Cloud
      const bpResponse = await axios.post(
        `https://webhook.botpress.cloud/${BOTPRESS_BOT_ID}`,
        {
          type: 'text',
          text: userMessage,
          conversationId: `chatwoot_conv_${conversationId}`,
          userId: `chatwoot_user_${senderId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${BOTPRESS_PAT}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[2/3] Respuesta bruta de Botpress:', JSON.stringify(bpResponse.data));

      // 2. Extraer el texto de la respuesta
      let replyText = '';
      if (bpResponse.data?.responses && Array.isArray(bpResponse.data.responses)) {
        replyText = bpResponse.data.responses
          .map(r => r.text || r.payload?.text)
          .filter(Boolean)
          .join('\n\n');
      } else if (bpResponse.data?.messages && Array.isArray(bpResponse.data.messages)) {
        replyText = bpResponse.data.messages
          .map(m => m.payload?.text || m.text)
          .filter(Boolean)
          .join('\n\n');
      } else if (typeof bpResponse.data === 'string') {
        replyText = bpResponse.data;
      }

      // 3. Enviar a Chatwoot si se obtuvo texto
      if (replyText) {
        console.log(`[3/3] Enviando respuesta a Chatwoot: "${replyText.substring(0, 40)}..."`);
        await axios.post(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
          {
            content: replyText,
            message_type: 'outgoing',
            private: false
          },
          {
            headers: {
              'api_access_token': CHATWOOT_API_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`¡Mensaje entregado con éxito en Chatwoot (Conv: ${conversationId})!`);
      } else {
        console.log('Botpress no retornó texto directo en la llamada.');
      }
    } catch (err) {
      console.error('Error en el flujo del puente:', err.response?.data || err.message);
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
