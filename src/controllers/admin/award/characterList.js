import model from "../../../models/index.js";
import { envs } from "../../../config/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, PEOPLE_SETTINGS } from "../../../utils/constants.js";

/**
 * characterList
 * @param req
 * @param res
 */
export const characterList = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const searchText = reqBody.search_text ? reqBody.search_text : "";
    const language = req.accept_language;
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;

    let data = [];
    let getCharacterList = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    const includeQuery = [
      {
        model: model.peopleTranslation,
        as: "peopleTranslationOne",
        attributes: [],
        left: true,
        where: {
          site_language: "en",
          status: "active",
        },
        required: false,
      },
      {
        model: model.peopleTranslation,
        as: "peopleTranslationOnel",
        attributes: [],
        left: true,
        where: {
          site_language: "ko",
          status: "active",
        },
        required: false,
      },
      {
        model: model.peopleImages,
        as: "peopleImagesOne",
        attributes: [],
        left: true,
        where: {
          image_category: "poster_image",
          is_main_poster: "y",
          status: "active",
          original_name: {
            [Op.ne]: null,
          },
        },
        required: false,
        order: [["id", "DESC"]],
      },
    ];

    const attributes = [
      ["id", "character_id"],
      [
        Sequelize.literal(
          `( CASE WHEN "${language}"="en" 
          THEN CASE 
          WHEN  peopleTranslationOne.name IS NOT NULL THEN peopleTranslationOne.name 
          WHEN peopleTranslationOnel.name IS NOT NULL THEN peopleTranslationOnel.name
          ELSE "" END 
          ELSE CASE 
          WHEN peopleTranslationOnel.name IS NOT NULL THEN peopleTranslationOnel.name
          WHEN  peopleTranslationOne.name IS NOT NULL THEN peopleTranslationOne.name
          ELSE "" END END)`,
        ),
        "character_name",
      ],
      [
        fn(
          "REPLACE",
          fn("REPLACE", col("peopleImagesOne.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
          "p/original",
          `p/${peopleImageW}`,
        ),
        "thumbnail",
      ],
    ];
    let conditions = { status: "active" };
    if (searchText) {
      conditions[Op.or] = [
        { "$peopleTranslationOne.name$": { [Op.like]: `%${searchText}%` } },
        { "$peopleTranslationOnel.name$": { [Op.like]: `%${searchText}%` } },
      ];
    } else {
      conditions[Op.or] = [
        { "$peopleTranslationOne.name$": { [Op.ne]: null } },
        { "$peopleTranslationOnel.name$": { [Op.ne]: null } },
      ];
    }
    getCharacterList = await paginationService.pagination(
      searchParams,
      model.people,
      includeQuery,
      conditions,
      attributes,
    );
    data = getCharacterList.rows ? getCharacterList.rows : [];
    res.ok({
      page: page,
      limit: limit,
      total_records: getCharacterList.count,
      total_pages: getCharacterList.count > 0 ? Math.ceil(getCharacterList.count / limit) : 0,
      results: data ? data : [],
    });
  } catch (error) {
    next(error);
  }
};
