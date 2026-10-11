import api from '../../../config/api';

import type { P2PTransferRequest, P2PTransferResponse } from '../types/transfer.types';

export const executeP2PTransfer = async (
  transferData: P2PTransferRequest
): Promise<P2PTransferResponse> => {
 
  const response = await api.post<P2PTransferResponse>(
    '/transfers/p2p',
    transferData
  );
  return response.data;
};
