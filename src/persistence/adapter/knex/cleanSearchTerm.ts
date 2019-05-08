// Remove not allowed characters in MYSQL fulltext boolean search (https://dev.mysql.com/doc/refman/8.0/en/fulltext-boolean.html)

export default function(text: string) {
  return (
    text
      .replace(/[()<>~"*+-]/g, " ")
      .trim()
      .split(" ")
      .filter(w => !!w)
      .map(word => `+${word.trim()}*`)
      .join(", ") || ""
  );
}
