import model from "../../models/index.js";
import { Sequelize, Op } from "sequelize";

/**
 * calculateWebtoonsRating
 * @param titleId
 * @param userInputRating
 */

export const calculateWebtoonsRating = async (titleId, userInputRating) => {
  try {
    let retRating = 0;
    if (titleId) {
      const getUserRating = await model.ratings.findOne({
        attributes: [[Sequelize.fn("AVG", Sequelize.col("rating")), "avg_rating"]],
        where: { ratingable_id: titleId, ratingable_type: "title", status: { [Op.ne]: "deleted" } },
      });
      if (getUserRating && userInputRating) {
        if (getUserRating.dataValues.avg_rating) {
          retRating =
            (parseFloat(getUserRating.dataValues.avg_rating) + parseFloat(userInputRating)) / 2;
        } else {
          retRating = parseFloat(userInputRating);
        }
      } else if (!getUserRating && userInputRating) {
        retRating = parseFloat(userInputRating);
      } else if (getUserRating && !userInputRating) {
        if (getUserRating.dataValues.avg_rating) {
          retRating = parseFloat(getUserRating.dataValues.avg_rating);
        }
      }
    }
    if (userInputRating && !titleId) {
      retRating = parseFloat(userInputRating);
    }
    return retRating;
  } catch (e) {
    console.log("error", e);
    return 0;
  }
};
