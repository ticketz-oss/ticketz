import { Box, Chip, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useState } from "react";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";

export function UsersFilter({ onFiltered, initialUsers, excludeId }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchData() {
      await loadUsers();
    }
    fetchData();
  }, []);

  useEffect(() => {
    setSelected(null);
    if (
      Array.isArray(initialUsers) &&
      Array.isArray(users) &&
      users.length > 0 &&
      initialUsers.length > 0
    ) {
      onChange(initialUsers[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUsers, users]);

  const loadUsers = async () => {
    try {
      const { data } = await api.get(`/users/list`);
      let userList = data.map((u) => ({ id: u.id, name: u.name }));
      if (excludeId) {
        userList = userList.filter(user => user.id !== excludeId);
      }
      setUsers(userList);
    } catch (err) {
      toastError(err);
    }
  };

  const onChange = async (value) => {
    setSelected(value);
    onFiltered(value ? [value] : []);
  };

  return (
    <Box style={{ padding: "0px 10px 10px" }}>
      <Autocomplete
        size="small"
        options={users}
        value={selected}
        onChange={(e, v, r) => onChange(v)}
        getOptionLabel={(option) => option.name}
        getOptionSelected={(option, value) => {
          return (
            option?.id === value?.id ||
            option?.name.toLowerCase() === value?.name.toLowerCase()
          );
        }}
        renderTags={(value, getUserProps) =>
          value
            ? [
              <Chip
                key={value.id}
                variant="outlined"
                style={{
                  backgroundColor: "#bfbfbf",
                  textShadow: "1px 1px 1px #000",
                  color: "white",
                }}
                label={value.name}
                {...getUserProps({ index: 0 })}
                size="small"
              />,
            ]
            : []
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder={i18n.t("tickets.search.filterByUsers")}
          />
        )}
      />
    </Box>
  );
}
