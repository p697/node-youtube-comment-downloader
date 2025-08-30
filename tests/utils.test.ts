import { searchDict, regexSearch, sleep } from '../src/utils';

describe('searchDict', () => {
  test('should yield nothing from empty dict', () => {
    const result = Array.from(searchDict({}, 'test'));
    expect(result).toEqual([]);
  });

  test('should yield correct value for simple dictionaries', () => {
    const result = Array.from(searchDict({ test: 'expected' }, 'test'));
    expect(result).toEqual(['expected']);
  });

  test('should yield correct value when dictionary is inside list', () => {
    const result = Array.from(searchDict([{ test: 'expected' }], 'test'));
    expect(result).toEqual(['expected']);
  });

  test('should yield two values if key is found twice in nested dictionaries', () => {
    const data = [{ test: 'expected' }, { test: 'expected' }];
    const result = Array.from(searchDict(data, 'test'));
    expect(result).toEqual(['expected', 'expected']);
  });

  test('should yield expected value when nesting dictionaries', () => {
    const data = {
      a: { test: 'expected' },
      b: { test: 'expected' },
    };
    const result = Array.from(searchDict(data, 'test'));
    expect(result.sort()).toEqual(['expected', 'expected']);
  });

  test('should handle deeply nested structures', () => {
    const data = {
      level1: {
        level2: {
          level3: {
            test: 'deep',
          },
        },
      },
    };
    const result = Array.from(searchDict(data, 'test'));
    expect(result).toEqual(['deep']);
  });

  test('should handle mixed arrays and objects', () => {
    const data = {
      items: [
        { test: 'first' },
        { nested: { test: 'second' } },
        'string',
        123,
        null,
        { test: 'third' },
      ],
    };
    const result = Array.from(searchDict(data, 'test'));
    expect(result.sort()).toEqual(['first', 'second', 'third']);
  });
});

describe('regexSearch', () => {
  test('should return matched group', () => {
    const text = 'Hello World 123';
    const pattern = /World (\d+)/;
    const result = regexSearch(text, pattern, 1);
    expect(result).toBe('123');
  });

  test('should return default value when no match', () => {
    const text = 'Hello World';
    const pattern = /Test (\d+)/;
    const result = regexSearch(text, pattern, 1, 'default');
    expect(result).toBe('default');
  });

  test('should handle string patterns', () => {
    const text = 'ytcfg.set({"key": "value"});';
    const pattern = 'ytcfg\\.set\\s*\\(\\s*({.+?})\\s*\\)\\s*;';
    const result = regexSearch(text, pattern, 1);
    expect(result).toBe('{"key": "value"}');
  });

  test('should return null by default when no match', () => {
    const text = 'Hello World';
    const pattern = /Test/;
    const result = regexSearch(text, pattern);
    expect(result).toBeNull();
  });
});

describe('sleep', () => {
  test('should delay execution', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(200);
  });

  test('should resolve without value', async () => {
    const result = await sleep(10);
    expect(result).toBeUndefined();
  });
});
