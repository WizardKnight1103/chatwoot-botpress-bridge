const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4'; // Pega tu token de Chatwoot
const BOTPRESS_BOT_ID = '84e3f57b-7710-4c3e-a647-a46a637c1938';
const BOTPRESS_PAT = 'bp_pat_Y6G8i5hJnM6IBd26uCpZJLDOTRvuRBE30eQK'; // Pega tu token de Botpress

app.post('/chatwoot-webhook', async (req, res) => {
  res.status(200).send('OK');

  const event = req.body;

  // Filtrar solo mensajes entrantes del usuario
  if (
    event.event === 'message_created' &&
    event.message_type === 'incoming' &&
    !event.private
  ) {
    const userMessage = event.content;
    const conversationId = event.conversation.id;
    const accountId = event.account.id;
    const senderId = event.sender ? event.sender.id : conversationId;

    // Asegurar IDs con longitud mínima requerida por Botpress (mínimo 28 caracteres)
    const formattedConvId = `chatwoot_conversation_${conversationId}`.padEnd(30, '_');
    const formattedUserId = `chatwoot_user_client_${senderId}`.padEnd(30, '_');

    try {
      // 1. Enviar el mensaje a Botpress con el payload corregido
      const botpressResponse = await axios.post(
        'https://api.botpress.cloud/v1/chat/messages',
        {
          conversationId: formattedConvId,
          userId: formattedUserId,
          type: 'text',
          payload: { text: userMessage },
          tags: {
            source: 'chatwoot',
            chatwoot_account_id: String(accountId),
            chatwoot_conversation_id: String(conversationId)
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${BOTPRESS_PAT}`,
            'x-bot-id': BOTPRESS_BOT_ID,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extraer el texto de respuesta devuelto por Botpress
      const botReply =
        botpressResponse.data?.message?.payload?.text ||
        botpressResponse.data?.payload?.text ||
        botpressResponse.data?.responses?.[0]?.text;

      if (botReply) {
        // 2. Enviar la respuesta de vuelta a la conversación en Chatwoot
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
