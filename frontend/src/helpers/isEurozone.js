export function isEurozone(countryCode) {
  const eurozoneCountries = [
    "AT", // Austria
    "BE", // Belgium
    "CY", // Cyprus
    "EE", // Estonia
    "FI", // Finland
    "FR", // France
    "DE", // Germany
    "GR", // Greece
    "IE", // Ireland
    "IT", // Italy
    "LV", // Latvia
    "LT", // Lithuania
    "LU", // Luxembourg
    "MT", // Malta
    "NL", // Netherlands
    "PT", // Portugal
    "SK", // Slovakia
    "SI", // Slovenia
    "ES"  // Spain
  ];  

  return eurozoneCountries.includes(countryCode);
}
