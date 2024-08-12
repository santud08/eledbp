import model from "../../models/index.js";
import { fn, col } from "sequelize";

export const updateTitleAvgRating = async (titleId) => {
  let returnStr = false;
  let getInformations = await model.title.findOne({
    attributes: ["id", "type", [fn("titleRatingCount", col("id")), "avg_rating"]],
    where: { id: titleId, record_status: "active" },
  });
  if (getInformations) {
    const avgRating = getInformations.dataValues.avg_rating
      ? getInformations.dataValues.avg_rating
      : 0;
    await model.title.update(
      { avg_rating: avgRating },
      {
        where: { id: titleId },
      },
    );
    returnStr = true;
  } else {
    returnStr = false;
  }
  return returnStr;
};
