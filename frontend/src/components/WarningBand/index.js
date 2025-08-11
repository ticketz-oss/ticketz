const WarningBand = ({ message, backgroundColor = "yellow" }) => {
  return (
    <div style={{
      width: '100%',
      backgroundColor,
      color: 'black',
      textAlign: 'center',
      padding: '10px',
      borderRadius: '5px',
      fontWeight: 'bold',
    }}>
      {message}
    </div>
  );
};

export default WarningBand;
