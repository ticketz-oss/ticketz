export const emojiNumbers = (number: number): string => {
  const numEmojis = [
    "0️⃣",
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
    "🔟"
  ];

  return number <= 10 ? numEmojis[number] : `[ ${number} ]`;
};
