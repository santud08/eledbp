import model from "../../models/index.js";
import { fn, col } from "sequelize";

export const updateAwardAvgRating = async (awardId) => {
  let returnStr = false;
  let getInformations = await model.awards.findOne({
    attributes: ["id", [fn("awardRatingCount", col("id")), "avg_rating"]],
    where: { id: awardId, status: "active" },
  });
  if (getInformations) {
    const avgRating = getInformations.dataValues.avg_rating
      ? getInformations.dataValues.avg_rating
      : 0;
    await model.awards.update(
      { avg_rating: avgRating },
      {
        where: { id: awardId },
      },
    );
    returnStr = true;
  } else {
    returnStr = false;
  }
  return returnStr;
};
