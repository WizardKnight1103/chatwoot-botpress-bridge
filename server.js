function procesarRespuesta(texto) {
  const msg = (texto || '').toLowerCase().trim();

  // 0. Comando inicial de Telegram o saludo directo
  if (msg === '/start' || msg === 'start' || msg === 'hola' || msg === 'inicio') {
    return `¡Hola! Bienvenido al canal de atención oficial de Bait. 💙\n\n` +
      `🔥 *Promoción Portabilidad:* 36 GB + Redes Ilimitadas por solo *$100 MXN* el primer mes.\n\n` +
      `Elige una opción respondiendo con el *número* o palabra:\n` +
      `1️⃣ *Portabilidad* (Cambiar tu línea conservando tu número)\n` +
      `2️⃣ *Recargas y Paquetes* (Ver catálogo de precios y vigencias)\n` +
      `3️⃣ *Cupón y Tiendas* (Dónde y cómo recoger tu chip)\n` +
      `4️⃣ *Hablar con un asesor*`;
  }

  // 1. Asesor / Humano / Ayuda
  if (msg.includes('asesor') || msg.includes('humano') || msg.includes('ayuda') || msg === '4') {
    return 'Entendido. Un asesor humano tomará el control de este chat de inmediato para brindarte atención personalizada. Por favor espera un momento.';
  }

  // 2. Portabilidad
  if (msg.includes('porta') || msg.includes('cambiar') || msg.includes('nip') || msg === '1') {
    return `📲 *Proceso de Portabilidad Bait (Conserva tu número)*\n\n` +
      `🔥 *Promoción:* 36 GB + Redes Sociales Ilimitadas por solo *$100 MXN* el primer mes (regular $200).\n\n` +
      `*Paso 1: Reúne estos 3 datos obligatorios:*\n` +
      `1. Tu compañía actual (Telcel, Movistar, AT&T, etc.)\n` +
      `2. Número a 10 dígitos que deseas conservar\n` +
      `3. Nombre completo del titular\n\n` +
      `*Paso 2: Obtén tu NIP de 4 dígitos:*\n` +
      `• Con tu chip actual insertado, envía un SMS con la palabra *NIP* al *051* (o llama al 051).\n` +
      `• Recibirás un SMS con tu NIP de 4 dígitos (vigencia 15 días).\n\n` +
      `*Paso 3:* Envíame esos datos y tu NIP por aquí para realizar el trámite (tarda de 24 a 48 hrs hábiles).\n\n` +
      `🎟️ *Recogida de Chip:* Presenta tu cupón en módulos de Walmart, Bodega Aurrera o Sam's Club:\n` +
      `${LINK_CUPON}\n*(No contamos con envío a domicilio).*`;
  }

  // 3. Recargas y Paquetes
  if (msg.includes('recarga') || msg.includes('paquete') || msg.includes('plan') || msg.includes('costo') || msg.includes('precio') || msg === '2') {
    return `📦 *Catálogo de Recargas y Planes Bait*\n\n` +
      `*Recargas Prepago (30 días):*\n` +
      `• *$200 MXN:* 12 GB + Comparte Datos + Redes Ilimitadas\n` +
      `• *$230 MXN:* Internet Ilimitado (15 GB máx. vel.) + Comparte Datos\n` +
      `• *$250 MXN:* Internet Ilimitado (15 GB) + Programa Salud\n` +
      `• *$299 MXN:* Internet Ilimitado + Curso de Inglés Tecmilenio\n` +
      `• *$300 MXN:* Internet Ilimitado (20 GB máx. vel.) + Comparte Datos\n` +
      `• *$349 MXN:* Internet Ilimitado + ViX Premium\n` +
      `• *$500 MXN:* 50 GB + Comparte Datos + Redes Ilimitadas\n` +
      `• *$649 MXN:* 50 GB + ViX Premium + Programa Salud\n\n` +
      `*Recargas Cortas:*\n` +
      `• *$50 MXN (7 días):* 2 GB + Redes Ilimitadas\n` +
      `• *$100 MXN (15 días):* 5 GB + Redes Ilimitadas\n` +
      `• *$125 MXN (20 días):* 8 GB + Redes Ilimitadas\n\n` +
      `*Planes Pospago (12 meses promo):*\n` +
      `• *Pospago 199:* $199/mes (38 GB + Redes + Sam's Club)\n` +
      `• *Pospago 249:* $249/mes (Ilimitado 22 GB + Salud)\n` +
      `• *Pospago 339:* $339/mes (Ilimitado 22 GB + Salud + Sam's Club)\n\n` +
      `Escribe *1* para iniciar portabilidad o *4* para hablar con un asesor.`;
  }

  // 4. Entrega / Cupón / Tiendas
  if (msg.includes('cupon') || msg.includes('cupón') || msg.includes('tienda') || msg.includes('domicilio') || msg.includes('donde') || msg.includes('dónde') || msg.includes('recoger') || msg === '3') {
    return `🏪 *Entrega de Chip Bait (Solo Tienda Física)*\n\n` +
      `• *No hacemos envíos a domicilio.*\n` +
      `• Puedes recogerlo en cajas y módulos de atención en: *Walmart, Bodega Aurrera y Sam's Club*.\n\n` +
      `*Requisitos para recoger:*\n` +
      `1. Presentar tu cupón digital o impreso descargado aquí:\n${LINK_CUPON}\n` +
      `2. Mencionar tu número telefónico registrado.\n\n` +
      `Escribe *Activar* si ya tienes tu chip y necesitas configurarlo.`;
  }

  // 5. Activación / Configurar APN
  if (msg.includes('activar') || msg.includes('configurar') || msg.includes('apn') || msg.includes('señal')) {
    return `⚙️ *Activación de tu Chip Bait*\n\n` +
      `1. Apaga tu celular e inserta el chip en la ranura *SIM 1*.\n` +
      `2. Enciende el equipo y espera a que tome la señal Bait.\n` +
      `3. Realiza una llamada de prueba.\n\n` +
      `Si tienes problemas con datos móviles o APN, escribe *ASESOR* para apoyarte.`;
  }

  // Menú por defecto si escribe cualquier otra cosa
  return `¡Hola! Bienvenido al canal de atención oficial de Bait. 💙\n\n` +
    `🔥 *Promoción Portabilidad:* 36 GB + Redes Ilimitadas por solo *$100 MXN* el primer mes.\n\n` +
    `Elige una opción respondiendo con el *número* o palabra:\n` +
    `1️⃣ *Portabilidad* (Cambiar tu línea conservando tu número)\n` +
    `2️⃣ *Recargas y Paquetes* (Ver catálogo de precios y vigencias)\n` +
    `3️⃣ *Cupón y Tiendas* (Dónde y cómo recoger tu chip)\n` +
    `4️⃣ *Hablar con un asesor*`;
}
