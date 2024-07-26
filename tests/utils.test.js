"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_js_1 = require("../dist/index.js");
describe('Utility Functions', () => {
    it('should delay execution by specified milliseconds', async () => {
        const start = Date.now();
        await (0, index_js_1.delay)(100);
        const end = Date.now();
        (0, chai_1.expect)(end - start).to.be.at.least(100);
    });
});
