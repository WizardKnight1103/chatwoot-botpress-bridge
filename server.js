const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configuración con tus credenciales
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4'; // Chatwoot -> Tu perfil -> Token de acceso
const BOTPRESS_BOT_ID = '84e3f57b-7710-4c3e-a647-a46a637c1938';
const BOTPRESS_PAT = 'bp_pat_Y6G8i5hJnM6IBd26uCpZJLDOTRvuRBE30eQK'; // Botpress Cloud -> User Profile -> Personal Access Tokens

app.post('/chatwoot-webhook', async (req, res) => {
  res.status(200).send('OK'); // Responder rápido a Chatwoot para evitar timeout

  const event = req.body;

  // Filtrar solo mensajes entrantes creados por el usuario final
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
      // 1. Enviar el mensaje al agente de Botpress
      const botpressResponse = await axios.post(
        `https://api.botpress.cloud/v1/chat/messages`,
        {
          botId: BOTPRESS_BOT_ID,
          conversationId: `cw_${conversationId}`,
          userId: `user_${senderId}`,
          type: 'text',
          payload: { text: userMessage }
        },
        {
          headers: {
            'Authorization': `Bearer ${BOTPRESS_PAT}`,
            'x-bot-id': BOTPRESS_BOT_ID,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extraer el texto de respuesta del agente
      const botReply = botpressResponse.data?.message?.payload?.text || 
                       botpressResponse.data?.payload?.text;

      if (botReply) {
        // 2. Publicar la respuesta en la conversación de Chatwoot
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
      console.error('Error procesando mensaje entre Botpress y Chatwoot:', err.response?.data || err.message);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor webhook corriendo en el puerto ${PORT}`));
