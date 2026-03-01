import fs from 'fs';
import path from 'path';
<<<<<<< HEAD
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
dotenv.config();
=======
>>>>>>> bb0ab2e (Recommit)
import { REST, Routes } from 'discord.js';

const commands = [];
const foldersPath = path.join(process.cwd(), 'commands');
const commandFolders = fs.readdirSync(foldersPath);

export default async() => {
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
<<<<<<< HEAD
      await import(pathToFileURL(filePath).href).then(module => {
=======
      await import(filePath).then(module => {
>>>>>>> bb0ab2e (Recommit)
        commands.push(module.data.toJSON());
      });
    }
  }
<<<<<<< HEAD
  // 必須環境変数チェック
  if (!process.env.TOKEN) {
    console.error('[regist-commands] process.env.TOKEN が設定されていません。');
    process.exit(1);
  }
  if (!process.env.APPLICATION_ID) {
    console.error('[regist-commands] process.env.APPLICATION_ID が設定されていません。');
    process.exit(1);
  }

  const rest = new REST().setToken(process.env.TOKEN);

  try {
    console.log(`[INIT] ${commands.length}つのスラッシュコマンドを更新します（グローバル登録）。`);

    // 重複するコマンド名を除去（Discord は同名を許可しない）
    const uniqueByNameMap = new Map();
    for (const cmd of commands) {
      if (!uniqueByNameMap.has(cmd.name)) uniqueByNameMap.set(cmd.name, cmd);
    }
    const uniqueCommands = Array.from(uniqueByNameMap.values());
    if (uniqueCommands.length !== commands.length) {
      console.warn(`[regist-commands] 重複コマンドを除去しました: ${commands.length - uniqueCommands.length} 件`);
    }

    await rest.put(
      Routes.applicationCommands(process.env.APPLICATION_ID),
      { body: uniqueCommands },
    );

    console.log(`[INIT] ${uniqueCommands.length} 件をグローバルに登録しました。`);
    return { success: true };
  } catch (error) {
    console.error('[regist-commands] コマンド登録時にエラーが発生しました:', error);
    process.exit(1);
  }
=======

  const rest = new REST().setToken(process.env.TOKEN);

  (async () => {
    try {
      console.log(`[INIT] ${commands.length}つのスラッシュコマンドを更新します。`);

      const data = await rest.put(
        Routes.applicationCommands(process.env.APPLICATION_ID),
        { body: commands },
      );
      
      const dataGuild = await rest.put(
        Routes.applicationCommands(process.env.APPLICATION_ID),
        { body: commands },
      );

      console.log(`[INIT] ${commands.length}つのスラッシュコマンドを更新しました。`);
    } catch (error) {
      console.error(error);
    }
  })();
>>>>>>> bb0ab2e (Recommit)
};
