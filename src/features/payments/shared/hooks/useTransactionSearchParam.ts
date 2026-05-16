import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getPaymentSearchTermType } from "../paymentSearch";

const TRANSACTION_ID_SEARCH_PARAM = "transactionId";
const ORDER_ID_SEARCH_PARAM = "orderId";

export const useTransactionSearchParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const transactionIdParam = searchParams.get(TRANSACTION_ID_SEARCH_PARAM) ?? "";
  const orderIdParam = searchParams.get(ORDER_ID_SEARCH_PARAM) ?? "";
  const searchParam = transactionIdParam || orderIdParam;
  const [searchTerm, setSearchTerm] = useState(searchParam);

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  const updateSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
    setSearchParams((currentSearchParams) => {
      const nextSearchParams = new URLSearchParams(currentSearchParams);
      const trimmedValue = value.trim();

      nextSearchParams.delete(TRANSACTION_ID_SEARCH_PARAM);
      nextSearchParams.delete(ORDER_ID_SEARCH_PARAM);

      if (trimmedValue) {
        const searchParamName = getPaymentSearchTermType(trimmedValue) ?? "transactionId";
        nextSearchParams.set(searchParamName, trimmedValue);
      }

      return nextSearchParams;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    searchTerm,
    setSearchTerm: updateSearchTerm,
  };
};
