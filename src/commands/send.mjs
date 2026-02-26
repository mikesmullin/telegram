import { getClient, disconnectClient } from '../client.mjs';
import { ansi, color } from '../terminal-ui.mjs';
import { resolveEntityPreferDialogs } from '../recipient-resolver.mjs';

export const send = async (recipient, message) => {
  if (!recipient) {
    console.error('Usage: telegram send <username|phone|chat_id> <message>');
    console.error('Examples:');
    console.error('  telegram send @username "Hello there"');
    console.error('  telegram send +1234567890 "Hello there"');
    console.error('  telegram send -100123456789 "Hello group"');
    process.exit(1);
  }
  
  if (!message) {
    console.error('Error: Message is required');
    console.error('Usage: telegram send <recipient> <message>');
    process.exit(1);
  }

  try {
    const client = await getClient();
    const { entity, resolvedLabel } = await resolveEntityPreferDialogs(client, recipient);
    
    // Send the message
    const result = await client.sendMessage(entity, { message });

    console.log(color(`sent id=${result.id} to ${resolvedLabel}`, ansi.bold, ansi.fg(170, 235, 180)));
    
    await disconnectClient();
  } catch (error) {
    if (error.message?.includes('Cannot find any entity') || error.message?.includes('Cannot find user/chat')) {
      console.error(`Error: Cannot find user/chat: ${recipient}`);
      console.error('Make sure the username or phone number is correct.');
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
};
