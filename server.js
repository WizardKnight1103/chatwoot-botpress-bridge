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
      // Endpoint de ejecución directa para Botpress Viber / Cloud
      const response = await axios.post(
        `https://webhook.botpress.cloud/${BOTPRESS_BOT_ID}`,
        {
          type: 'text',
          text: userMessage,
          conversationId: `cw_conv_${conversationId}`,
          userId: `cw_user_${senderId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${BOTPRESS_PAT}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extraer la respuesta generada
      const botResponses = response.data?.responses || response.data?.messages || [];
      let botText = '';

      if (Array.isArray(botResponses)) {
        botText = botResponses
          .map(r => r.text || r.payload?.text)
          .filter(Boolean)
          .join('\n\n');
      } else if (typeof response.data === 'string') {
        botText = response.data;
      }

      if (botText) {
        // Enviar respuesta a Chatwoot
        await axios.post(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
          {
            content: botText,
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
        console.log(`Respuesta entregada a Chatwoot (Conv: ${conversationId})`);
      } else {
        console.log('Mensaje recibido en Botpress, procesando respuesta.');
      }
    } catch (err) {
      console.error(
        'Error en el puente:',
        err.response?.data || err.message
      );
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
