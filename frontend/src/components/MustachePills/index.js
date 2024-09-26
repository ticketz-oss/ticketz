
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  pill: {
    backgroundColor: theme.palette.primary.main,
    border: 'none',
    borderRadius: '5px',
    color: theme.palette.primary.contrastText,
    padding: '5px 10px',
    margin: '5px',
    cursor: 'pointer',
  },
}));

const MustachePills = React.forwardRef(({ value, setValue }, ref) => {
  const classes = useStyles();
  const pills = [
    { label: 'name', code: '{{ name }}' },
    { label: 'user', code: '{{ user }}' },
    { label: 'queue', code: '{{ queue }}' },
  ];

  const handleClick = (code) => {
    const textarea = ref.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.substring(0, start) + code + value.substring(end);
    setValue(newValue);
  };

  return (
    <div>
      {pills.map((pill, index) => (
        <button key={index} onClick={(event) => handleClick(event, pill.code)} className={classes.pill}>
          {pill.label}
        </button>
      ))}
    </div>
  );
});

export default MustachePills;
