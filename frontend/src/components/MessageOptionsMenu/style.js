import { makeStyles } from '@material-ui/core'

export const useStyles = makeStyles(theme => ({
  emojiButton: {
    cursor: "pointer",
    borderRadius: 5,
    '&:hover': {
      backgroundColor: '#888a'
    }
  }
}))