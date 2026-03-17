import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const Counts = new Map();

export default async (message) => {
  
  //特定のチャンネルでのみ反応させる場合は以下のコードを有効にしてください
  //const allowedChannelIds = ['123456789012345678'];
  //if (!allowedChannelIds.includes(message.channel.id)) return;

  // 特定の単語に反応してスレッド作成
  if (message.content.match(/募|@\d+/)) {

    if (message.content.match(/再/)) {
      return; // 再通知の際にスレッドを立てない
    } else {
      const Thread = await message.startThread({
        name: `${message.author.username}さんの募集`,
        autoArchiveDuration: 1440,
      });

      // スレッド内で「@何人」かを選択させるメッセージの送信
      await Thread.send({
        content: `<@${message.author.id}> 募集人数を選択してください。選択した人数が集まったら通知します。`,
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('notify-count')
              .setPlaceholder('人数を選択')
              .addOptions(
                [1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => ({
                  label: `@${num}`,
                  value: `${num}`,
                }))
              )
          )
        ]
      });
      
      Counts.set(Thread.id, {
        authorId: message.author.id,
        starterMessageId: message.id,
      });
      
    }
  }
};

//人数選択後および〆後の返信
export async function second(interaction) {
//人数選択後
  if (interaction.isStringSelectMenu?.() && interaction.customId === 'notify-count') {
    const selectedCount = parseInt(interaction.values[0]);

    const thread = interaction.channel?.isThread?.() ? interaction.channel : interaction.message?.thread;
    const threadId = thread?.id;
    const userId = interaction.user.id;

    if (!threadId) {
      console.log("[second] スレッドIDが取得できません。");
      return;
    }

    const threadData = Counts.get(threadId);
    if (!threadData) {
      console.log(`[second] Counts にデータがありません：${threadId}`);
      return;
    }
    
    if (userId !== threadData.authorId) {
      await interaction.reply({
        content: 'この操作は募集を作成した本人のみが可能です。',
        ephemeral: true,
      });
      return;
    }

  // 既に保存されてるデータにcountだけ追加
    Counts.set(interaction.channel.id, {
    ...threadData,
    count: selectedCount,
    });
    
    await interaction.reply({
      content: `了解！${selectedCount}人集まったら通知します。`,
      ephemeral: true,
    });
  }
//〆後
  if (interaction.isButton?.() && interaction.customId === 'close-thread') {
    if (!interaction.channel.isThread?.()) return;
    const thread = interaction.channel;

    // スレッドの親メッセージを取得
    const parentMessage = await thread.fetchStarterMessage();
    
    // 募集者以外が〆られないように
    const authorId = parentMessage?.author?.id;
    const userId = interaction.user.id;
    
    if (userId !== authorId) {
      await interaction.reply({
        content: 'この操作は募集を作成した本人のみが可能です。',
        ephemeral: true,
      });
      return;
    }

    // 親メッセージにリアクションを付ける
    await parentMessage.react('❌');
    
    // 押されたら〆済みに変更
    const closeMsgId = Counts.get(thread.id)?.closeMessageId;
    if (closeMsgId) {
      const closeMsg = await thread.messages.fetch(closeMsgId);
      await closeMsg.edit({
        content: '募集は〆られました。',
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('close-thread')
              .setLabel('〆済み')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          )
        ]
      });
    }
    
    await interaction.reply({
      content: '募集を〆ました。',
      ephemeral: false,
    });
  }
}

//集まった際の通知部分
export async function sime(thread, oldMembers, newMembers) {
  console.log(`[sime] called for thread: ${thread.name} (${thread.id})`);
  const data = Counts.get(thread.id);
  if (!data) {
    console.log(`[sime] No data for thread.`);
    return;
  }
  await thread.members.fetch();
  // 現在の参加人数を数える
  const currentCount = thread.members.cache.size;
  console.log(`[sime] currentCount=${currentCount}, target=${data.count + 2}`);
  
  const parentMessage = await thread.fetchStarterMessage();

  // 希望人数に達したら通知
  if (currentCount >= data.count + 2) {
    console.log(`[sime] Enough members! Sending notification.`);
    
    const sent = await thread.send({
      content: `<@${data.authorId}> 人数が集まりました！〆リアクションをする場合は以下のボタンを押してください。`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close-thread')
            .setLabel('〆')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });

    Counts.set(thread.id, {
      ...data,
      closeMessageId: sent.id,
    });
  } else {
    console.log(`[sime] Not enough members yet.`);
  }
}