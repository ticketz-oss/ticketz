import React, { useState, useEffect, useCallback, useRef } from "react";
import { TextField, Chip } from "@material-ui/core";
import { useForkRef } from "@material-ui/core/utils";
import Autocomplete from "@material-ui/lab/Autocomplete";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const ContactListbox = React.forwardRef(function ContactListbox(
  { onListboxRef, ...props },
  ref
) {
  const listboxRef = useForkRef(ref, onListboxRef);
  return <ul {...props} ref={listboxRef} />;
});

export function ContactSelect({
  label,
  onSelected,
  allowCreate = false,
  onCreateContact,
  excludeId,
  margin
}) {
  const [contacts, setContacts] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [selected, setSelected] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [listbox, setListbox] = useState(null);
  const pagePending = useRef(false);

  useEffect(() => {
    pagePending.current = false;
    setPagination({ searchParam, excludeId, pageNumber: 1 });
    setContacts([]);
    setHasMore(false);
    setLoading(false);
  }, [searchParam, excludeId]);

  useEffect(() => {
    if (
      !pagination ||
      pagination.searchParam !== searchParam ||
      pagination.excludeId !== excludeId
    ) {
      return;
    }
    if (searchParam.length < 2) {
      return;
    }
    let active = true;
    const { pageNumber } = pagination;
    const fetchContacts = async () => {
      pagePending.current = true;
      setLoading(true);
      try {
        const { data } = await api.get("contacts", {
          params: { searchParam, pageNumber }
        });
        if (!active) return;
        let contactList = data.contacts.map(c => ({
          id: c.id,
          name: c.name,
          number: c.number
        }));
        if (excludeId) {
          contactList = contactList.filter(contact => contact.id !== excludeId);
        }
        setContacts(prev =>
          pageNumber === 1 ? contactList : [...prev, ...contactList]
        );
        setHasMore(data.hasMore);
      } catch (err) {
        if (active) {
          setHasMore(false);
          toastError(err);
        }
      } finally {
        if (active) {
          pagePending.current = false;
          setLoading(false);
        }
      }
    };
    fetchContacts();
    return () => {
      active = false;
    };
  }, [searchParam, pagination, excludeId]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || pagePending.current) return;
    pagePending.current = true;
    setPagination(prev => ({ ...prev, pageNumber: prev.pageNumber + 1 }));
  }, [loading, hasMore]);

  useEffect(() => {
    if (
      !open ||
      loading ||
      !hasMore ||
      !pagination ||
      pagination.searchParam !== searchParam ||
      pagination.excludeId !== excludeId
    ) {
      return;
    }
    if (
      (listbox &&
        listbox.clientHeight > 0 &&
        listbox.scrollHeight <= listbox.clientHeight) ||
      (!listbox && contacts.length === 0 && !allowCreate)
    ) {
      loadMore();
    }
  }, [
    open,
    loading,
    hasMore,
    listbox,
    contacts,
    allowCreate,
    loadMore,
    pagination,
    searchParam,
    excludeId
  ]);

  const handleChange = (event, value) => {
    if (value && value.inputValue && allowCreate && onCreateContact) {
      onCreateContact(value.inputValue);
      setSelected(null);
    } else {
      setSelected(value);
      onSelected(value ? value.id : null);
    }
  };

  const filterOptions = (options, params) => {
    const filtered = [...options];
    if (
      allowCreate &&
      params.inputValue !== "" &&
      !options.some(option => option.name === params.inputValue)
    ) {
      filtered.push({
        inputValue: params.inputValue,
        name: `${i18n.t("common.add")} "${params.inputValue}"`
      });
    }
    return filtered;
  };

  const handleListboxScroll = useCallback(
    event => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      if (scrollHeight - scrollTop - clientHeight < 50) {
        loadMore();
      }
    },
    [loadMore]
  );

  return (
    <Autocomplete
      size="small"
      options={contacts}
      value={selected}
      onChange={handleChange}
      filterOptions={filterOptions}
      noOptionsText=""
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      ListboxComponent={ContactListbox}
      ListboxProps={{ onScroll: handleListboxScroll, onListboxRef: setListbox }}
      getOptionLabel={option =>
        option.inputValue
          ? option.name
          : `${option.name}${option.number ? ` - ${option.number}` : ""}`
      }
      renderTags={(value, getTagProps) =>
        value
          ? [
              <Chip
                key={value.id || value.inputValue}
                variant="outlined"
                style={{
                  backgroundColor: "#bfbfbf",
                  textShadow: "1px 1px 1px #000",
                  color: "white"
                }}
                label={value.name}
                {...getTagProps({ index: 0 })}
                size="small"
              />
            ]
          : []
      }
      renderInput={params => (
        <TextField
          {...params}
          label={label || i18n.t("common.contact")}
          variant="outlined"
          margin={margin || "dense"}
          onChange={e => setSearchParam(e.target.value)}
        />
      )}
    />
  );
}
