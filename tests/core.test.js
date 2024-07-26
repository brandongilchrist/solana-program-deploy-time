"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const web3_js_1 = require("@solana/web3.js");
const index_js_1 = require("../dist/index.js");
describe('Core Functionality', () => {
    let connectionStub;
    beforeEach(() => {
        connectionStub = sinon_1.default.createStubInstance(web3_js_1.Connection);
    });
    it('should fetch the first deployment timestamp', async () => {
        const mockSignatures = [
            { signature: 'mockSignature1', blockTime: 1620000000, slot: 123, err: null, memo: null },
            { signature: 'mockSignature2', blockTime: 1620000001, slot: 124, err: null, memo: null }
        ];
        connectionStub.getSignaturesForAddress.resolves(mockSignatures);
        const mockTransactionResponse = {
            blockTime: 1620000000,
            slot: 123,
            transaction: {}, // Provide appropriate mock data
            meta: {} // Provide appropriate mock data
        };
        connectionStub.getTransaction.resolves(mockTransactionResponse);
        const programId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const result = await (0, index_js_1.getFirstTransactionTimestamp)(programId, false);
        (0, chai_1.expect)(result).to.equal('2021-05-03T00:00:00.000Z');
        sinon_1.default.assert.calledOnce(connectionStub.getSignaturesForAddress);
        sinon_1.default.assert.calledOnce(connectionStub.getTransaction);
    });
    it('should handle no transactions found', async () => {
        connectionStub.getSignaturesForAddress.resolves([]);
        const programId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        try {
            await (0, index_js_1.getFirstTransactionTimestamp)(programId, false);
        }
        catch (err) {
            (0, chai_1.expect)(err.message).to.equal(`No transactions found for the program ID: ${programId}`);
        }
    });
    // Additional tests...
});
