const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// REEMPLAZA CON TUS TOKENS REALES
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
      // 1. Crear usuario asegurando el campo 'tags'
      const userRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/users',
        {
          key: `chatwoot_user_${senderId}`,
          tags: {
            sender_id: String(senderId)
          }
        },
        { headers: bpHeaders }
      );
      const bpUserId = userRes.data?.user?.id;

      // 2. Crear conversación asegurando el campo 'tags'
      const convRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/conversations',
        {
          tags: {
            conversation_id: String(conversationId),
            account_id: String(accountId)
          }
        },
        { headers: bpHeaders }
      );
      const bpConvId = convRes.data?.conversation?.id;

      // 3. Enviar mensaje incluyendo el conversation_id en el texto para el agente
      await axios.post(
        'https://api.botpress.cloud/v1/chat/messages',
        {
          conversationId: bpConvId,
          userId: bpUserId,
          type: 'text',
          payload: {
            text: `[Chatwoot conv_id: ${conversationId}] ${userMessage}`
          },
          tags: {
            source: 'chatwoot',
            chatwoot_conversation_id: String(conversationId)
          }
        },
        { headers: bpHeaders }
      );

      console.log(`Mensaje procesado con éxito para Chatwoot (Conversación: ${conversationId})`);
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
