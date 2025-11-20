import React, { useState, useEffect } from "react";
import { TextField, Chip } from "@material-ui/core";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const filter = createFilterOptions();

export function ContactSelect({
  label,
  onSelected,
  allowCreate = false,
  onCreateContact,
  excludeId,
  initialContact,
  margin
}) {
  const [contacts, setContacts] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (searchParam.length < 2) {
      setContacts(initialContact ? [initialContact] : []);
      return;
    }
    const fetchContacts = async () => {
      try {
        const { data } = await api.get("contacts", { params: { searchParam } });
        let contactList = data.contacts.map(c => ({
          id: c.id,
          name: c.name,
          number: c.number
        }));
        if (excludeId) {
          contactList = contactList.filter(contact => contact.id !== excludeId);
        }
        setContacts(contactList);
      } catch (err) {
        toastError(err);
      }
    };
    fetchContacts();
  }, [searchParam, excludeId, initialContact]);

  useEffect(() => {
    if (initialContact) {
      setSelected(initialContact);
    }
  }, [initialContact]);

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
    const filtered = filter(options, params);
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

  return (
      <Autocomplete
        size="small"
        options={contacts}
        value={selected}
        onChange={handleChange}
        filterOptions={filterOptions}
        getOptionLabel={option =>
          option.inputValue ? option.name : `${option.name}${option.number ? ` - ${option.number}` : ""}`
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
                  color: "white",
                }}
                label={value.name}
                {...getTagProps({ index: 0 })}
                size="small"
              />,
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
