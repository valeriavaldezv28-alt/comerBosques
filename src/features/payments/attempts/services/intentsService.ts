import { fetchIntents } from "../api/intentsApi";
import { mapIntents } from "../mappers/intentsMapper";
import type { PaymentIntents, PaymentIntentsQuery } from "../types/paymentIntent";

export const getIntents = async (query: PaymentIntentsQuery): Promise<PaymentIntents> => {
  const payload = await fetchIntents(query);
  return mapIntents(payload);
};
