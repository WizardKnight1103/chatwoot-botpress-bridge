const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4'; // Pega tu token de Chatwoot
const BOTPRESS_BOT_ID = '84e3f57b-7710-4c3e-a647-a46a637c1938';
const BOTPRESS_PAT = 'bp_pat_Y6G8i5hJnM6IBd26uCpZJLDOTRvuRBE30eQK'; // Pega tu token de Botpress

const bpHeaders = {
  'Authorization': `Bearer ${BOTPRESS_PAT}`,
  'x-bot-id': BOTPRESS_BOT_ID,
  'Content-Type': 'application/json'
};

app.post('/chatwoot-webhook', async (req, res) => {
  res.status(200).send('OK');

  const event = req.body;

  // Procesar únicamente mensajes entrantes del usuario
  if (
    event.event === 'message_created' &&
    event.message_type === 'incoming' &&
    !event.private
  ) {
    const userMessage = event.content;
    const conversationId = event.conversation.id;
    const accountId = event.account.id;
    const senderId = event.sender ? event.sender.id : conversationId;

    try {
      // 1. Obtener o crear el usuario en Botpress
      const userRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/users',
        {
          tags: {
            chatwoot_sender_id: String(senderId)
          }
        },
        { headers: bpHeaders }
      );
      const bpUserId = userRes.data.user.id;

      // 2. Obtener o crear la conversación en Botpress
      const convRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/conversations',
        {
          tags: {
            chatwoot_conversation_id: String(conversationId)
          }
        },
        { headers: bpHeaders }
      );
      const bpConvId = convRes.data.conversation.id;

      // 3. Enviar el mensaje a Botpress
      const msgRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/messages',
        {
          conversationId: bpConvId,
          userId: bpUserId,
          type: 'text',
          payload: { text: userMessage },
          tags: {
            source: 'chatwoot'
          }
        },
        { headers: bpHeaders }
      );

      // Extraer la respuesta generada
      const botReply =
        msgRes.data?.message?.payload?.text ||
        msgRes.data?.payload?.text ||
        msgRes.data?.responses?.[0]?.text;

      if (botReply) {
        // 4. Devolver la respuesta a Chatwoot
        await axios.post(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
          {
            content: botReply,
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
      }
    } catch (err) {
      console.error(
        'Error procesando mensaje entre Botpress y Chatwoot:',
        err.response?.data || err.message
      );
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor webhook corriendo en el puerto ${PORT}`));const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'TU_CHATWOOT_USER_API_TOKEN'; // Pega tu token de Chatwoot
const BOTPRESS_BOT_ID = '84e3f57b-7710-4c3e-a647-a46a637c1938';
const BOTPRESS_PAT = 'TU_BOTPRESS_PERSONAL_ACCESS_TOKEN'; // Pega tu token de Botpress

const bpHeaders = {
  'Authorization': `Bearer ${BOTPRESS_PAT}`,
  'x-bot-id': BOTPRESS_BOT_ID,
  'Content-Type': 'application/json'
};

app.post('/chatwoot-webhook', async (req, res) => {
  res.status(200).send('OK');

  const event = req.body;

  // Procesar únicamente mensajes entrantes del usuario
  if (
    event.event === 'message_created' &&
    event.message_type === 'incoming' &&
    !event.private
  ) {
    const userMessage = event.content;
    const conversationId = event.conversation.id;
    const accountId = event.account.id;
    const senderId = event.sender ? event.sender.id : conversationId;

    try {
      // 1. Obtener o crear el usuario en Botpress
      const userRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/users',
        {
          tags: {
            chatwoot_sender_id: String(senderId)
          }
        },
        { headers: bpHeaders }
      );
      const bpUserId = userRes.data.user.id;

      // 2. Obtener o crear la conversación en Botpress
      const convRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/conversations',
        {
          tags: {
            chatwoot_conversation_id: String(conversationId)
          }
        },
        { headers: bpHeaders }
      );
      const bpConvId = convRes.data.conversation.id;

      // 3. Enviar el mensaje a Botpress
      const msgRes = await axios.post(
        'https://api.botpress.cloud/v1/chat/messages',
        {
          conversationId: bpConvId,
          userId: bpUserId,
          type: 'text',
          payload: { text: userMessage },
          tags: {
            source: 'chatwoot'
          }
        },
        { headers: bpHeaders }
      );

      // Extraer la respuesta generada
      const botReply =
        msgRes.data?.message?.payload?.text ||
        msgRes.data?.payload?.text ||
        msgRes.data?.responses?.[0]?.text;

      if (botReply) {
        // 4. Devolver la respuesta a Chatwoot
        await axios.post(
          `${CHATWOOT_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
          {
            content: botReply,
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
      }
    } catch (err) {
      console.error(
        'Error procesando mensaje entre Botpress y Chatwoot:',
        err.response?.data || err.message
      );
    }
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor webhook corriendo en el puerto ${PORT}`));
