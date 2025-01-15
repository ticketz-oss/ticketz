import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const useTickets = ({
  isSearch,
  searchParam,
  tags,
  users,
  pageNumber,
  status,
  groups,
  date,
  updatedAt,
  showAll,
  queueIds,
  withUnreadMessages,
  all,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTickets = async () => {
        try {
          const { data } = await api.get("/tickets", {
            params: {
              isSearch,
              searchParam,
              pageNumber,
              tags,
              users,
              status,
              groups,
              date,
              updatedAt,
              showAll,
              queueIds,
              withUnreadMessages,
              all,
            },
          });
          setTickets(data.tickets);
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchTickets();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [
    searchParam,
    tags,
    users,
    pageNumber,
    status,
    groups,
    date,
    updatedAt,
    showAll,
    queueIds,
    withUnreadMessages,
  ]);

  return { tickets, loading, hasMore };
};

export default useTickets;
