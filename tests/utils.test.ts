import { expect } from 'chai';
import { delay } from '../dist/index.js';

describe('Utility Functions', () => {
    it('should delay execution by specified milliseconds', async () => {
        const start = Date.now();
        await delay(100);
        const end = Date.now();
        expect(end - start).to.be.at.least(100);
    });
});