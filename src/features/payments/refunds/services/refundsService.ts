import { fetchRefunds } from "../api/refundsApi";
import { mapRefunds } from "../mappers/refundsMapper";
import type { Refunds, RefundsQuery } from "../types/refund";

export const getRefunds = async (query: RefundsQuery): Promise<Refunds> => {
  const payload = await fetchRefunds(query);
  return mapRefunds(payload);
};
