const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Bot tokeni
const TOKEN = '8742739069:AAFUmNYXtAS2cDhB_sGy-rMgaoq-F7VNgOE';
const bot = new Telegraf(TOKEN);

// Sənin Telegram ID-n koda əlavə olundu
const ADMIN_ID = 8896331803; 

bot.start((ctx) => {
  ctx.reply('Salam! Tamİzlə platformasının ödəniş təsdiq botuna xoş gəlmisiniz. Zəhmət olmasa ödəniş çəkini (şəklini) buraya göndərin.');
});

// İstifadəçi şəkil (çek) göndərəndə
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : 'Yoxdur';
  const photoId = ctx.photo[ctx.photo.length - 1].file_id;

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
    console.error(error);
    ctx.reply('❌ Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
  }
});

// Admin "Təsdiq Et" düyməsinə basanda
bot.action(/approve_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];
  
  try {
    await ctx.telegram.sendMessage(targetUserId, '🎉 Təbriklər! Ödənişiniz təsdiqləndi. Artıq platformadan istifadə edə bilərsiniz.');
    await ctx.editMessageCaption('✅ Bu ödəniş TƏSDİQLƏNDİ.');
    ctx.answerCbQuery('Uğurla təsdiqləndi!');
  } catch (e) {
    ctx.answerCbQuery('Xəta baş verdi!');
  }
});

// Admin "Rədd Et" düyməsinə basanda
bot.action(/reject_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];
  
  try {
    await ctx.telegram.sendMessage(targetUserId, '❌ Təəssüf ki, ödənişiniz təsdiqlənmədi. Məlumatları yoxlayıb yenidən cəhd edin.');
    await ctx.editMessageCaption('❌ Bu ödəniş RƏDD EDİLDİ.');
    ctx.answerCbQuery('Ödəniş rədd edildi.');
  } catch (e) {
    ctx.answerCbQuery('Xəta baş verdi!');
  }
});

bot.launch();
console.log('Bot uğurla işə düşdü...');
