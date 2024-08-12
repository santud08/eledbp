import model from "../../../models/index.js";
import { Sequelize, col, fn, Op } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, TABLES } from "../../../utils/constants.js";

/**
 * videoList
 * @param req
 * @param res
 */
export const videoList = async (req, res, next) => {
  try {
    const reqBody = req.query;

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const listType = reqBody.type ? reqBody.type : "";

    let condition = {
      status: "active",
      [Op.and]: Sequelize.literal(`
    CASE
      WHEN video_for = 'title' THEN titleOne.id IS NOT NULL
      WHEN video_for = 'people' THEN person.id IS NOT NULL
      ELSE video_for IS NOT NULL
    END
  `),
    };

    const language = req.accept_language;

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
      subQuery: false,
    };
    if (listType == "newest") {
      condition.is_official_trailer = { [Op.ne]: "y" };
      searchParams.sortOrderObj = [["id", "desc"]];
    } else if (listType == "trailer") {
      condition.is_official_trailer = "y";
      searchParams.sortOrderObj = [["id", "desc"]];
    } else {
      searchParams.sortOrderObj = [
        [Sequelize.literal("no_of_views"), "desc"],
        ["id", "desc"],
      ];
    }
    const attributes = [
      ["id", "video_id"],
      [Sequelize.fn("IFNULL", Sequelize.col("url"), ""), "video_path"],
      ["thumbnail", "video_thumb"],
      ["video_duration", "video_time"],
      ["name", "video_title"],
      [fn("getEditListName", col("video.title_id"), col("video_for"), language), "title_name"],
      [
        Sequelize.literal(
          `(CASE WHEN no_of_view = 0 THEN ele_no_of_view
          ELSE no_of_view END)`,
        ),
        "no_of_views",
      ],
      ["created_at", "registration_date"],
      "video_source",
      ["title_id", "item_id"],
      "video_for",
      [
        Sequelize.literal(
          '( CASE WHEN `video`.`video_for`!="people" THEN `titleOne`.`type` ELSE "people" END)',
        ),
        "item_type",
      ],
    ];

    const includeQuery = [
      {
        model: model.title,
        as: "titleOne",
        attributes: [],
        where: { record_status: "active" },
        required: false,
        include: [
          {
            model: model.titleTranslation,
            attributes: [],
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.TITLE_TRANSLATION_TABLE} WHERE ${
                    TABLES.TITLE_TRANSLATION_TABLE
                  }.title_id = titleOne.id AND status='active' ORDER BY site_language ${
                    language == "ko" ? "DESC" : "ASC"
                  } LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
        ],
      },
      {
        model: model.people,
        attributes: [],
        where: { status: "active" },
        required: false,
        include: [
          {
            model: model.peopleTranslation,
            attributes: [],
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.PEOPLE_TRANSLATION_TABLE} WHERE ${
                    TABLES.PEOPLE_TRANSLATION_TABLE
                  }.people_id = person.id AND status='active' ORDER BY site_language ${
                    language == "ko" ? "DESC" : "ASC"
                  } LIMIT 1)`,
                ),
              },
            },
            required: false,
          },
        ],
      },
    ];

    const getVideoList = await paginationService.pagination(
      searchParams,
      model.video,
      includeQuery,
      condition,
      attributes,
    );

    res.ok({
      page: page,
      limit: limit,
      total_records: getVideoList.count,
      total_pages: getVideoList.count > 0 ? Math.ceil(getVideoList.count / limit) : 0,
      result: getVideoList.rows ? getVideoList.rows : [],
    });
  } catch (error) {
    next(error);
  }
};
