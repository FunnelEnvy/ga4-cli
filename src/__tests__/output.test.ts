import { describe, it, expect } from 'vitest';
import { formatOutput } from '../lib/output.js';

describe('formatOutput', () => {
  const sampleData = [
    { name: 'Alice', age: '30', city: 'New York' },
    { name: 'Bob', age: '25', city: 'London' },
  ];

  it('formats data as JSON', () => {
    const result = formatOutput(sampleData, 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(sampleData);
  });

  it('formats single object as JSON', () => {
    const single = { name: 'Alice', age: '30' };
    const result = formatOutput(single, 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(single);
  });

  it('formats data as CSV', () => {
    const result = formatOutput(sampleData, 'csv');
    expect(result).toContain('name');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  it('formats data as table', () => {
    const result = formatOutput(sampleData, 'table');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
    expect(result).toContain('New York');
  });

  it('handles empty array', () => {
    const result = formatOutput([], 'table');
    expect(result).toBe('No data');
  });

  it('handles empty array for CSV', () => {
    const result = formatOutput([], 'csv');
    expect(result).toBe('');
  });
});
