const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// REEMPLAZA CON TUS TOKENS REALES
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com';
const CHATWOOT_API_TOKEN = 'NnagcztzUX8BcAmKcEE9SSo4';
const WEBCHAT_CLIENT_ID = '6f30aa3c-4cd2-45e9-9f24-61d6d4d9a17f';

app.get('/', (req, res) => {
  res.send('Servidor Webhook Puente Activo');
});

// Función para esperar la respuesta de Botpress
async function pollBotpressResponse(userKey, conversationId, afterMessageId, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Esperar 1.5s entre intentos

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
      // Buscar mensajes generados por el bot posteriores al mensaje del usuario
      const botMessages = messages.filter(m => m.userId !== res.data?.userId && m.payload?.text);

      if (botMessages.length > 0) {
        // Tomar el mensaje más reciente del bot
        return botMessages[botMessages.length - 1].payload.text;
      }
    } catch (e) {
      // Reintentar si aún no procesa
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
      console.log(`[1/4] Procesando mensaje: "${userMessage}" (Chatwoot Conv: ${conversationId})`);

      // 1. Obtener / Crear usuario de Webchat
      const userRes = await axios.post(
        'https://chat.botpress.cloud/v1/users',
        {},
        {
          headers: {
            'x-user-key': `cw_user_${ shameEl bridge entregó el mensaje a Botpress con éxito `[2/3]`, pero el flujo se detiene porque Botpress aún no envía su respuesta de regreso al bridge (webhook) o el agente no generó salida. 

Revisa estos puntos clave para resolverlo:

* **Webhook de salida en Botpress:** En tu flujo o bot de Botpress, debes asegurarte de que el mensaje de respuesta se envíe de vuelta a tu URL pública de Railway:
  `https://chatwoot-botpress-bridge-production-d65a.up.railway.app/webhook` (o la ruta que tenga configurada tu script para escuchar las respuestas del bot).
* **Logs del Bot en Botpress Cloud/Studio:** Entra a la consola de Botpress y revisa los logs de ejecución. Verifica si el mensaje `"Hola quiero información"` activó un nodo de respuesta o si ocurrió un error interno al procesar el mensaje.
* **Cambios sin desplegar en Railway:** En la esquina superior izquierda aparece un botón morado que dice **"Apply 4 changes"**. Si modificaste variables de entorno o configuraciones recientemente, dale clic a **Deploy** para aplicar los cambios en el contenedor activo.
