const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const crypto = require('crypto'); // Unikal şifrə/hash yaratmaq üçün

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!\n');
}).listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

const TOKEN = '8849538524:AAGmdJ0QvyXH2c0pK7ixmKheM9ITXIQSGJA';
const bot = new Telegraf(TOKEN);
const ADMIN_ID = 8896331803; 

// Hər istifadəçi üçün aktiv və təsdiqlənmiş unikal açarları yadda saxlamaq üçün yaddaş (baza)
global.activeVipKeys = global.activeVipKeys || new Map();

bot.start((ctx) => {
  try {
    ctx.reply('Salam! Tamİzlə platformasının ödəniş təsdiq botuna xoş gəlmisiniz. Zəhmət olmasa ödəniş çəkini (şəklini) buraya göndərin.');
  } catch (e) {
    console.error("Start error:", e);
  }
});

// İstifadəçi şəkil VƏ YA sənəd (fayl) şəklində çek göndərəndə
bot.on(['photo', 'document'], async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : 'Yoxdur';
    const fullName = ctx.from.first_name + (ctx.from.last_name ? " " + ctx.from.last_name : "");
    
    let fileId = null;
    if (ctx.message.photo && ctx.message.photo.length > 0) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    } else if (ctx.message.document) {
      fileId = ctx.message.document.file_id;
    }

    if (!fileId) {
      await ctx.reply('⚠️ Zəhmət olmasa şəkli düzgün formatda göndərin.');
      return;
    }

    // Şəkli birbaşa sənə (adminə) göndəririk
    await bot.telegram.sendPhoto(ADMIN_ID, fileId, {
      caption: `📦 **Yeni ödəniş çeki gəldi!**\n\n👤 Adı: ${fullName}\n🆔 İstifadəçi ID: \`${userId}\`\n🔗 İstifadəçi adı: ${username}`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Təsdiq Et (VIP Ver)', `approve_${userId}`),
          Markup.button.callback('❌ Rədd Et', `reject_${userId}`)
        ]
      ])
    });

    await ctx.reply('✅ Çekiniz qəbul olundu! Admin tərəfindən yoxlanıldıqdan sonra abunəliyiniz aktivləşdiriləcək.');
  } catch (error) {
    console.error("Photo/Document error:", error);
    try {
      await ctx.reply('❌ Xəta baş verdi. Zəhmət olmasa əvvəlcə bota /start düyməsini vurduğunuzdan əmin olun.');
    } catch (err) {}
  }
});

// Admin "Təsdiq Et" düyməsinə basanda - Uzun, heşlənmiş və unikal açar yaradılır
bot.action(/approve_(.+)/, async (ctx) => {
  try {
    const targetUserId = ctx.match[1];
    
    // Unikal, uzun və heşlənmiş açar yaradırıq (məsələn: TAMIZLE-VIP-9f8e7d... formatında)
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const uniqueKey = `TAMIZLE-VIP-${crypto.createHash('sha256').update(targetUserId + randomBytes + Date.now()).digest('hex').substring(0, 24).toUpperCase()}`;
    
    // Açarı yaddaşda həmin istifadəçiyə bağlayırıq
    global.activeVipKeys.set(uniqueKey, targetUserId);

    // İstifadəçiyə yalnız ona özəl uzun açarı göndəririk
    await bot.telegram.sendMessage(targetUserId, 
      `🎉 Təbriklər! Ödənişiniz təsdiqləndi.\n\n` +
      `🔑 Sizin unikal 1 aylıq VIP açarınız:\n<code>${uniqueKey}</code>\n\n` +
      `Bu kodu saytdakı VIP pəncərəsinə daxil edərək abunəliyinizi aktivləşdirə bilərsiniz! (Bu açar yalnız sizə məxsusdur və bir dəfəlikdir).`, 
      { parse_mode: 'HTML' }
    );

    await ctx.editMessageCaption('✅ Bu ödəniş TƏSDİQLƏNDİ və istifadəçiyə unikal açar kodu göndərildi.');
    await ctx.answerCbQuery('Uğurla təsdiqləndi və unikal açar yaradıldı!');
  } catch (e) {
    console.error("Approve error:", e);
    try { await ctx.answerCbQuery('Xəta baş verdi!'); } catch(err){}
  }
});

// Admin "Rədd Et" düyməsinə basanda
bot.action(/reject_(.+)/, async (ctx) => {
  try {
    const targetUserId = ctx.match[1];
    await bot.telegram.sendMessage(targetUserId, '❌ Təəssüf ki, ödənişiniz təsdiqlənmədi. Məlumatları yoxlayıb yenidən cəhd edin.');
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
