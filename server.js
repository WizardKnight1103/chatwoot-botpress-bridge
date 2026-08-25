const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// REEMPLAZA CON TUS TOKENS REALES ENTRE COMILLAS
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4';
const BOTPRESS_BOT_ID = '84e3f57b-7710-4c3e-a647-a46a637c1938';
const BOTPRESS_PAT = 'bp_pat_Y6G8i5hJnM6IBd26uCpZJLDOTRvuRBE30eQK';

const bpHeaders = {
  Authorization: `Bearer ${BOTPRESS_PAT}`,
  'x-bot-id': BOTPRESS_BOT_ID,
  'Content-Type': 'application/json'
};

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
      // 1. Crear o asegurar usuario en el canal 'chat'
      const userRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/users',
        {
          integrationName: 'chat',
          tags: { chatwoot_sender_id: String(senderId) }
        },
        { headers: bpHeaders }
      );
      const bpUserId = userRes.data?.user?.id;

      // 2. Crear o asegurar conversación en el canal 'chat'
      const convRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/conversations',
        {
          integrationName: 'chat',
          tags: { chatwoot_conversation_id: String(conversationId) }
        },
        { headers: bpHeaders }
      );
      const bpConvId = convRes.data?.conversation?.id;

      // 3. Enviar mensaje al agente
      const msgRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/messages',
        {
          conversationId: bpConvId,
          userId: bpUserId,
          type: 'text',
          payload: { text: userMessage },
          tags: { source: 'chatwoot' }
        },
        { headers: bpHeaders }
      );

      // Extraer el texto devuelto por el agente
      const botReply =
        msgRes.data?.message?.payload?.text ||
        msgRes.data?.payload?.text ||
        msgRes.data?.responses?.[0]?.text;

      if (botReply) {
        // 4. Enviar respuesta a Chatwoot
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
      }
    } catch (err) {
      console.error(
        'Error procesando webhook:',
        err.response?.data || err.message
      );
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
