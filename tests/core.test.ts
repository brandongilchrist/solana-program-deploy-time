import { expect } from 'chai';
import sinon from 'sinon';
import { Connection, PublicKey, ConfirmedSignatureInfo, VersionedTransactionResponse } from '@solana/web3.js';
import { getFirstTransactionTimestamp } from '../dist/index.js';

describe('Core Functionality', () => {
    let connectionStub: sinon.SinonStubbedInstance<Connection>;

    beforeEach(() => {
        connectionStub = sinon.createStubInstance(Connection);
    });

    it('should fetch the first deployment timestamp', async () => {
        const mockSignatures: ConfirmedSignatureInfo[] = [
            { signature: 'mockSignature1', blockTime: 1620000000, slot: 123, err: null, memo: null },
            { signature: 'mockSignature2', blockTime: 1620000001, slot: 124, err: null, memo: null }
        ];

        connectionStub.getSignaturesForAddress.resolves(mockSignatures);

        const mockTransactionResponse: VersionedTransactionResponse = {
            blockTime: 1620000000,
            slot: 123,
            transaction: {}, // Provide appropriate mock data
            meta: {} // Provide appropriate mock data
        };

        connectionStub.getTransaction.resolves(mockTransactionResponse);

        const programId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        const result = await getFirstTransactionTimestamp(programId, false);

        expect(result).to.equal('2021-05-03T00:00:00.000Z');
        sinon.assert.calledOnce(connectionStub.getSignaturesForAddress);
        sinon.assert.calledOnce(connectionStub.getTransaction);
    });

    it('should handle no transactions found', async () => {
        connectionStub.getSignaturesForAddress.resolves([]);
        
        const programId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        
        try {
            await getFirstTransactionTimestamp(programId, false);
        } catch (err) {
            expect(err.message).to.equal(`No transactions found for the program ID: ${programId}`);
        }
    });

    // Additional tests...
});