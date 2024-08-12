export const validateDivisionNameCheck = (valueObj) => {
  const { division_name_ko, division_name_en } = valueObj;
  if (!division_name_ko && !division_name_en) {
    return "Division name both can not be empty.";
  }
  return true;
};
