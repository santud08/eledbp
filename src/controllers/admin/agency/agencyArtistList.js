import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { Sequelize, Op } from "sequelize";
import { envs } from "../../../config/index.js";

/**
 * agencyArtistList
 * @param req
 * @param res
 */
export const agencyArtistList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const artistName = reqBody.artist_name ? reqBody.artist_name : "";
    const language = req.accept_language;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };
    const conditions = {
      status: { [Op.ne]: "deleted" },
      site_language: language,
    };
    if (artistName) {
      conditions.name = { [Op.like]: `%${artistName}%` };
    }

    const attributes = [
      ["id", "artist_id"],
      [Sequelize.fn("IFNULL", Sequelize.col("peopleTranslationOne.name"), ""), "artist_name"],
      [
        Sequelize.fn(
          "REPLACE",
          Sequelize.col("peopleImagesOne.path"),
          `${envs.s3.BUCKET_URL}`,
          `${envs.aws.cdnUrl}`,
        ),
        "profile_picture",
      ],
    ];
    const includeQuery = [
      {
        model: model.peopleTranslation,
        as: "peopleTranslationOne",
        attributes: [],
        left: true,
        where: conditions,
        required: true,
      },
      {
        model: model.peopleImages,
        as: "peopleImagesOne",
        attributes: [],
        left: true,
        where: {
          site_language: language,
          image_category: "poster_image",
          is_main_poster: "y",
          status: "active",
        },
        required: false,
        order: [["id", "DESC"]],
      },
    ];

    const condition = {
      status: { [Op.ne]: "deleted" },
    };

    const getArtistList = await paginationService.pagination(
      searchParams,
      model.people,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getArtistList.count,
      total_pages: getArtistList.count > 0 ? Math.ceil(getArtistList.count / limit) : 0,
      results: getArtistList.rows,
    });
  } catch (error) {
    next(error);
  }
};
