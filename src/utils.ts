export function* searchDict(partial: any, searchKey: string): Generator<any> {
  const stack: any[] = [partial];

  while (stack.length > 0) {
    const currentItem = stack.pop();

    if (currentItem && typeof currentItem === 'object') {
      if (Array.isArray(currentItem)) {
        stack.push(...currentItem);
      } else {
        for (const [key, value] of Object.entries(currentItem)) {
          if (key === searchKey) {
            yield value;
          } else {
            stack.push(value);
          }
        }
      }
    }
  }
}

export function regexSearch(
  text: string,
  pattern: string | RegExp,
  group: number = 1,
  defaultValue: string | null = null,
): string | null {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  const match = text.match(regex);
  return match && match[group] ? match[group] : defaultValue;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
