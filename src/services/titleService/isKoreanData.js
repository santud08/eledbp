import { SOUTH_KOREA_COUNTRY_ID } from "../../utils/constants.js";
/**
 * isKoreanData
 * get the no of count
 * @param countryArr - Array
 * @return boolean
 */
export const isKoreanData = async (countryArr) => {
  try {
    let isKorean = false;

    if (countryArr.length > 0) {
      isKorean = countryArr.includes(SOUTH_KOREA_COUNTRY_ID);
      return isKorean;
    }

    return isKorean;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};
