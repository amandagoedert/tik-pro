const stripNonDigits = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/\D+/g, '');
};

const sanitizeCustomer = (customer = {}) => {
  const result = { ...customer };
  if (result.document) {
    result.document = stripNonDigits(result.document);
  }
  if (result.phone_number) {
    result.phone_number = stripNonDigits(result.phone_number);
  }
  if (result.zip_code) {
    result.zip_code = stripNonDigits(result.zip_code);
  }
  return Object.entries(result).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
};

module.exports = {
  stripNonDigits,
  sanitizeCustomer,
};
