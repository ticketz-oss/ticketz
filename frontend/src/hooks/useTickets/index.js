import { useState, useEffect } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const useTickets = ({
  isSearch,
  searchParam,
  contactId,
  tags,
  users,
  nextUpdatedAt,
  nextTicketId,
  status,
  groups,
  date,
  updatedAt,
  showAll,
  queueIds,
  withUnreadMessages,
  notClosed,
  all
}) => {
  const [loading, setLoading] = useState(true);
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
              nextUpdatedAt,
              nextTicketId,
              contactId,
              tags,
              users,
              status,
              groups,
              date,
              updatedAt,
              showAll,
              queueIds,
              withUnreadMessages,
              notClosed,
              all
            }
          });
          setTickets(data.tickets);
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
    contactId,
    tags,
    users,
    nextUpdatedAt,
    nextTicketId,
    status,
    groups,
    date,
    updatedAt,
    showAll,
    queueIds,
    withUnreadMessages,
    isSearch,
    notClosed,
    all
  ]);

  return {
    tickets,
    loading
  };
};

export default useTickets;
