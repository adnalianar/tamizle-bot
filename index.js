const { Telegraf, Markup } = require('telegraf');
const http = require('http');

// Render üçün port serveri (7/24 işlək saxlayır)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!\n');
}).listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

const TOKEN = '8849538524:AAGmdJ0QvyXH2c0pK7ixmKheM9ITXIQSGJA';
const bot = new Telegraf(TOKEN);

// Sənin Telegram ID-n (bütün təsdiq/inkar paneli yalnız sənə gələcək)
const ADMIN_ID = 1580270121; 

bot.start((ctx) => {
  try {
    ctx.reply('Salam! Tamİzlə platformasının ödəniş təsdiq botuna xoş gəlmisiniz. Zəhmət olmasa ödəniş çəkini (şəklini) buraya göndərin.');
  } catch (e) {
    console.error("Start error:", e);
  }
});

// İstifadəçi (məsələn, ana səhifədən və ya başqa telefondan) şəkil/çek göndərəndə
bot.on('photo', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : 'Yoxdur';
    const fullName = ctx.from.first_name + (ctx.from.last_name ? " " + ctx.from.last_name : "");
    const photo = ctx.photo[ctx.photo.length - 1];
    if (!photo) return;
    const photoId = photo.file_id;

    // Şəkli və təsdiq düymələrini birbaşa SƏNİN ID-nə göndəririk
    await bot.telegram.sendPhoto(ADMIN_ID, photoId, {
      caption: `📦 **Yeni ödəniş çeki gəldi!**\n\n👤 Adı: ${fullName}\n🆔 İstifadəçi ID: \`${userId}\`\n🔗 İstifadəçi adı: ${username}`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Təsdiq Et (VIP Ver)', `approve_${userId}`),
          Markup.button.callback('❌ Rədd Et', `reject_${userId}`)
        ]
      ])
    });

    await ctx.reply('✅ Çekiniz qəbul olundu! Admin (müəllim) tərəfindən yoxlanıldıqdan sonra abunəliyiniz aktivləşdiriləcək.');
  } catch (error) {
    console.error("Photo error:", error);
    try {
      await ctx.reply('❌ Xəta baş verdi. Zəhmət olmasa əvvəlcə bota /start düyməsini vurduğunuzdan əmin olun.');
    } catch (err) {}
  }
});

// Sən (Admin) "Təsdiq Et" düyməsinə basanda
bot.action(/approve_(.+)/, async (ctx) => {
  try {
    const targetUserId = ctx.match[1];
    
    // İstifadəçiyə uğurlu bildiriş göndəririk
    await bot.telegram.sendMessage(targetUserId, '🎉 Təbriklər! Ödənişiniz təsdiqləndi. Artıq platformadan istifadə edə bilərsiniz.');
    
    // Admin panelindəki şəklin altındakı yazını dəyişirik ki, təsdiqləndiyi görünsün
    await ctx.editMessageCaption('✅ Bu ödəniş TƏSDİQLƏNDİ və istifadəçiyə VIP icazəsi verildi.');
    await ctx.answerCbQuery('Uğurla təsdiqləndi!');
  } catch (e) {
    console.error("Approve error:", e);
    try { await ctx.answerCbQuery('Xəta baş verdi!'); } catch(err){}
  }
});

// Sən (Admin) "Rədd Et" düyməsinə basanda
bot.action(/reject_(.+)/, async (ctx) => {
  try {
    const targetUserId = ctx.match[1];
    
    // İstifadəçiyə rədd cavabı göndəririk
    await bot.telegram.sendMessage(targetUserId, '❌ Təəssüf ki, ödənişiniz təsdiqlənmədi. Məlumatları yoxlayıb yenidən cəhd edin.');
    
    // Admin panelindəki şəkli yeniləyirik
    await ctx.editMessageCaption('❌ Bu ödəniş RƏDD EDİLDİ.');
    await ctx.answerCbQuery('Ödəniş rədd edildi.');
  } catch (e) {
    console.error("Reject error:", e);
    try { await ctx.answerCbQuery('Xəta baş verdi!'); } catch(err){}
  }
});

bot.catch((err, ctx) => {
  console.error(`Telegraf error for ${ctx.updateType}:`, err);
});

bot.launch();
console.log('Bot uğurla işə düşdü...');
