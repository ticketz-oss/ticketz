export async function loadCountries() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json");
    const data = await response.json();

    const language = localStorage.getItem("language") || "en";

    const countries = data.map(country => {
      let countryName = country.translations?.[language] || country.translations?.[language.slice(0, 2)] || country.name;
      return { iso2: country.iso2, phonecode: country.phonecode, name: countryName, emoji: country.emoji };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
};
