import { vi } from 'vitest';

/**
 * Setup consistent date and random mocks for repository tests
 * @param timestamp Optional timestamp to use (defaults to specific test date)
 * @param randomValue Optional random value to use (defaults to 0.123456789)
 */
export function setupDateAndRandomMocks(
    timestamp: number = new Date('2023-04-01T10:30:00Z').getTime(),
    randomValue: number = 0.123456789
): void {
    // Mock the Date constructor
    const mockDate = new Date(timestamp);
    const mockTimestamp = mockDate.getTime();
    vi.spyOn(globalThis, 'Date').mockImplementation(() => mockDate);

    // Important: Also mock Date.now static method
    Date.now = vi.fn(() => mockTimestamp);
    // Mock Math.random for consistent values
    vi.spyOn(Math, 'random').mockImplementation(() => randomValue);
}

/**
 * Clean up all date and random mocks
 */
export function cleanupDateAndRandomMocks(): void {
    vi.restoreAllMocks();
}
