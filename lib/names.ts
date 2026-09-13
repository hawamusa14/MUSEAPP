export function titleCaseName(value: string) {
  return value
    .replace(/[;]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]{2,4}$/.test(word)) return word;
      return word
        .split(/([-'/])/)
        .map((part) => {
          if (!part || /^[-'/]$/.test(part)) return part;
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join("");
    })
    .join(" ");
}
