import model from "../../models/index.js";
import { fn, col, Op } from "sequelize";
import { envs } from "../../config/index.js";
import { TITLE_SETTINGS } from "../../utils/constants.js";

export const getLatestTvPosterImage = async (titleId) => {
  let returnStr = "";
  if (titleId) {
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    let getInformations = await model.titleImage.findOne({
      attributes: [
        "id",
        [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
      ],
      where: {
        title_id: titleId,
        status: "active",
        image_category: "poster_image",
        is_main_poster: "y",
        episode_id: null,
        original_name: {
          [Op.ne]: null,
        },
        [Op.and]: [{ path: { [Op.ne]: null } }, { path: { [Op.ne]: "" } }],
      },
      order: [["id", "DESC"]],
    });
    if (getInformations) {
      returnStr = getInformations.dataValues.path
        ? getInformations.dataValues.path.replace("p/original", `p/${tittleImageW}`)
        : "";
    } else {
      returnStr = "";
    }
  }
  return returnStr;
};
