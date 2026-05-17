import { Chip, Paper, TextField, makeStyles } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useRef, useState } from "react";
import { isArray, isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
  root: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 10,
      backgroundColor: theme.palette.background.paper
    },
    "& .MuiInputBase-input": {
      fontSize: "0.82rem"
    }
  },
  chip: {
    color: "white",
    border: "none",
    fontWeight: 600,
    textShadow:
      "-1px 0 rgba(0,0,0,0.16), 0 1px rgba(0,0,0,0.16), 1px 0 rgba(0,0,0,0.16), 0 -1px rgba(0,0,0,0.16)"
  },
  paper: {
    width: 400,
    marginLeft: 12,
    borderRadius: 10,
    border: `1px solid ${theme.palette.backgroundContrast.border}`
  }
}));

export function TagsContainer({ ticket, contact }) {
  const classes = useStyles();
  const [tags, setTags] = useState([]);
  const [selecteds, setSelecteds] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ticket) return;

    if (isMounted.current) {
      loadTags().then(() => {
        if (Array.isArray(ticket.tags)) {
          setSelecteds(ticket.tags);
        } else {
          setSelecteds([]);
        }
      });
    }
  }, [ticket]);

  useEffect(() => {
    if (!contact) return;

    if (isMounted.current) {
      loadTags().then(() => {
        if (Array.isArray(contact.tags)) {
          setSelecteds(contact.tags);
        } else {
          setSelecteds([]);
        }
      });
    }
  }, [contact]);

  const createTag = async data => {
    try {
      const { data: responseData } = await api.post(`/tags`, data);
      return responseData;
    } catch (err) {
      toastError(err);
    }
  };

  const loadTags = async () => {
    try {
      const { data } = await api.get(`/tags/list`);
      setTags(data);
    } catch (err) {
      toastError(err);
    }
  };

  const syncTags = async data => {
    try {
      const { data: responseData } = await api.post(`/tags/sync`, data);
      return responseData;
    } catch (err) {
      toastError(err);
    }
  };

  const onChange = async (value, reason) => {
    let optionsChanged = [];
    if (reason === "create-option") {
      if (isArray(value)) {
        for (let item of value) {
          if (isString(item)) {
            if (item.length > 2) {
              const newTag = await createTag({ name: item });
              optionsChanged.push(newTag);
            }
          } else {
            optionsChanged.push(item);
          }
        }
      }
      await loadTags();
    } else {
      optionsChanged = value;
    }
    setSelecteds(optionsChanged);
    await syncTags({
      ticketId: ticket?.id,
      contactId: contact?.id,
      tags: optionsChanged
    });
  };

  return (
    <Autocomplete
      className={classes.root}
      multiple
      size="small"
      options={tags}
      value={selecteds}
      freeSolo
      onChange={(e, v, r) => onChange(v, r)}
      getOptionLabel={option => option.name}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            className={classes.chip}
            style={{ backgroundColor: option.color || "#9ca3af" }}
            label={option.name}
            {...getTagProps({ index })}
            size="small"
          />
        ))
      }
      renderInput={params => (
        <TextField {...params} variant="outlined" placeholder="Tags" />
      )}
      PaperComponent={({ children }) => (
        <Paper className={classes.paper}>{children}</Paper>
      )}
    />
  );
}
