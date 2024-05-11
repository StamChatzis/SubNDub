export interface AllCountries {
  data: Countries;
}

export interface Countries {
  countries: Country[];
}

export interface Country {
  code: string;
  name: string;
}
