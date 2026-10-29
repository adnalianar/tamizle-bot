
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

// Render üçün server (port xətasını aradan qaldırır)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!\n');
}).listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

const TOKEN = '8849538524:AAGmdJ0QvyXH2c0pK7ixmKheM9ITXIQSGJA';
const bot = new Telegraf(TOKEN);

// Sənin Telegram ID-n
const ADMIN_ID = 1580270121; 

bot.start((ctx) => {
  ctx.reply('Salam! Tamİzlə platformasının ödəniş təsdiq botuna xoş gəlmisiniz. Zəhmət olmasa ödəniş çəkini (şəklini) buraya göndərin.');
});

// İstifadəçi şəkil (çek) göndərəndə
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : 'Yoxdur';
  const photo = ctx.photo[ctx.photo.length - 1];
  if (!photo) return;
  const photoId = photo.file_id;

  try {
    // Çeki yalnız adminə (sənə) göndəririk
    await bot.telegram.sendPhoto(ADMIN_ID, photoId, {
      caption: `📦 **Yeni ödəniş çeki gəldi!**\n\n👤 İstifadəçi ID: \`${userId}\`\nİstifadəçi adı: ${username}`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Təsdiq Et', `approve_${userId}`),
          Markup.button.callback('❌ Rədd Et', `reject_${userId}`)
        ]
      ])
    });

    ctx.reply('✅ Çekiniz qəbul olundu! Admin tərəfindən yoxlanıldıqdan sonra abunəliyiniz aktivləşdiriləcək.');
  } catch (error) {
    console.error("Photo send error:", error);
    ctx.reply('❌ Çek göndərilərkən xəta baş verdi. Zəhmət olmasa əvvəlcə bota /start düyməsini vurduğunuzdan əmin olun.');
  }
});

// Admin "Təsdiq Et" düyməsinə basanda
bot.action(/approve_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];
  
  try {
    await bot.telegram.sendMessage(targetUserId, '🎉 Təbriklər! Ödənişiniz təsdiqləndi. Artıq platformadan istifadə edə bilərsiniz.');
    await ctx.editMessageCaption('✅ Bu ödəniş TƏSDİQLƏNDİ.');
    await ctx.answerCbQuery('Uğurla təsdiqləndi!');
  } catch (e) {
    console.error("Approve error:", e);
    await ctx.answerCbQuery('Xəta baş verdi! İstifadəçi bota start verməyib.');
  }
});

// Admin "Rədd Et" düyməsinə basanda
bot.action(/reject_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];
  
  try {
    await bot.telegram.sendMessage(targetUserId, '❌ Təəssüf ki, ödənişiniz təsdiqlənmədi. Məlumatları yoxlayıb yenidən cəhd edin.');
    await ctx.editMessageCaption('❌ Bu ödəniş RƏDD EDİLDİ.');
    await ctx.answerCbQuery('Ödəniş rədd edildi.');
  } catch (e) {
    console.error("Reject error:", e);
    await ctx.answerCbQuery('Xəta baş verdi! İstifadəçi bota start verməyib.');
  }
});

bot.launch();
console.log('Bot uğurla işə düşdü...');
