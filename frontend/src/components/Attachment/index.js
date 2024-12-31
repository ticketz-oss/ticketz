import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AttachmentIcon from '@material-ui/icons/Attachment';
import ImageIcon from '@material-ui/icons/Image';
import DescriptionIcon from '@material-ui/icons/Description';

const useStyles = makeStyles((theme) => ({
  attachmentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: theme.spacing(1),
    marginLeft: "auto"
  },
  attachmentIcon: {
    fontSize: 40,
  },
  attachmentName: {
    marginTop: theme.spacing(1),
    textAlign: 'center',
    wordBreak: 'break-word',
    fontSize: 10,
  },
  thumbnail: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
}));

const truncateFilename = (filename, maxLength = 15) => {
  if (filename.length <= maxLength) return filename;
  const extIndex = filename.lastIndexOf('.');
  const ext = filename.substring(extIndex);
  const name = filename.substring(0, extIndex);
  const truncatedName = name.substring(0, maxLength - ext.length - 3);
  return `${truncatedName}...${ext}`;
};

const Attachment = ({ media }) => {
  const classes = useStyles();
  const [thumbnail, setThumbnail] = useState(null);

  const isJpgPng = (file) => {
    const fileType = file.type.toLowerCase();
    return fileType === 'image/jpeg' || fileType === 'image/png';
  };
  
  const isImage = (file) => {
    return file.type.startsWith('image/');
  }

  const isDocument = (file) => {
    const fileType = file.type.toLowerCase();
    return fileType === 'application/pdf' || fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  };

  useEffect(() => {
    if (isJpgPng(media)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnail(e.target.result);
      };
      reader.readAsDataURL(media);
    } else {
      setThumbnail(null);
    }
    console.log(media);
  }, [media]);

  return (
    <div className={classes.attachmentWrapper} title={media.name}>
      {thumbnail ? (
        <img src={thumbnail} alt={media.name} className={classes.thumbnail} />
      ) : isImage(media) ? (
        <ImageIcon className={classes.attachmentIcon} />
      ) : isDocument(media) ? (
        <DescriptionIcon className={classes.attachmentIcon} />
      ) : (
        <AttachmentIcon className={classes.attachmentIcon} />
      )}
      <div className={classes.attachmentName}>{truncateFilename(media.name)}</div>
    </div>
  );
};

export default Attachment;
