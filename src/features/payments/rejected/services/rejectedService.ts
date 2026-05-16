import { fetchRejected } from "../api/rejectedApi";
import { mapRejected } from "../mappers/rejectedMapper";
import type { GmvErrors, GmvErrorsQuery } from "../types/gmvError";

export const getRejected = async (query: GmvErrorsQuery): Promise<GmvErrors> => {
  const payload = await fetchRejected(query);
  return mapRejected(payload);
};
