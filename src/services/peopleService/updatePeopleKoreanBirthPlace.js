import model from "../../models/index.js";
import { Op } from "sequelize";
import { SOUTH_KOREA_COUNTRY } from "../../utils/constants.js";

export const updatePeopleKoreanBirthPlace = async (peopleId) => {
  let returnStr = false;
  const [getInformations, getKoCountry] = await Promise.all([
    model.people.findOne({
      attributes: ["id", "is_korean_birth_place"],
      where: { id: peopleId, status: "active" },
    }),
    model.peopleCountries.findOne({
      attributes: ["id", "people_id"],
      where: {
        people_id: peopleId,
        status: "active",
        birth_place: { [Op.like]: `%${SOUTH_KOREA_COUNTRY}%` },
      },
    }),
  ]);
  if (getInformations && getKoCountry) {
    await model.people.update(
      { is_korean_birth_place: 1 },
      {
        where: { id: peopleId },
      },
    );
    returnStr = true;
  } else {
    returnStr = false;
  }
  return returnStr;
};
