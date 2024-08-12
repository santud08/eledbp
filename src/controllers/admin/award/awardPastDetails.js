import model from "../../../models/index.js";
import { Op, Sequelize } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";
import { PAGINATION_LIMIT, TABLES } from "../../../utils/constants.js";

/**
 * awardPastDetails
 * @param req
 * @param res
 */
export const awardPastDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    const awardId = reqBody.award_id ? reqBody.award_id : "";
    const roundId = reqBody.round_id ? reqBody.round_id : "";

    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "ASC";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "id";
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    // check for award exist in awards table
    const isExists = await model.awards.findOne({
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid award id"));

    // check for award round exist in round table
    if (roundId) {
      const isExistsRound = await model.awardRounds.findOne({
        where: { id: roundId, award_id: awardId, status: { [Op.ne]: "deleted" } },
      });
      if (!isExistsRound) throw StatusError.badRequest(res.__("Invalid round id"));
    }

    const language = req.accept_language;
    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "",
      sortOrder: "",
      subQuery: false,
    };

    if (sortOrder && sortBy == "division_name") {
      searchParams.sortOrderObj = [
        [model.awardSectors, model.awardSectorTranslations, "division_name", sortOrder],
      ];
    } else if (sortOrder && sortBy == "work") {
      searchParams.sortOrderObj = [[model.title, model.titleTranslation, "name", sortOrder]];
    } else if (sortOrder && sortBy == "character") {
      searchParams.sortOrderObj = [[model.people, model.peopleTranslation, "name", sortOrder]];
    } else if (sortOrder && sortBy == "status") {
      searchParams.sortOrderObj = [[Sequelize.literal("status"), sortOrder]];
    } else if (sortOrder && sortBy == "comment") {
      searchParams.sortOrderObj = [[Sequelize.literal("comment"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [
        [model.awardSectors, "list_order", "ASC"],
        ["nominee_type", "desc"],
        [model.title, model.titleTranslation, "name", "ASC"],
        [model.people, model.peopleTranslation, "name", "ASC"],
        //[model.awardSectors, model.awardSectorTranslations, "division_name", "ASC"],
      ];
    }

    const attributes = [
      ["id", "nominee_id"],
      "award_id",
      "round_id",
      [Sequelize.fn("IFNULL", Sequelize.col("awardRound.round_name"), ""), "round_name"],
      ["nominee_type", "status"],
      "comment",
    ];
    const includeQuery = [
      {
        model: model.awardRounds,
        attributes: ["award_id", "round_name"],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: true,
      },
      {
        model: model.awardSectors,
        attributes: ["id"],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: false,
        include: [
          {
            model: model.awardSectorTranslations,
            attributes: ["award_sector_id", "division_name", "site_language"],
            left: true,
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.AWARD_SECTOR_TRANSLATIONS_TABLE} WHERE ${
                    TABLES.AWARD_SECTOR_TRANSLATIONS_TABLE
                  }.award_sector_id = awardSector.id AND status='active' ORDER BY site_language ${
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
        model: model.title,
        attributes: ["id"],
        left: true,
        where: { record_status: { [Op.ne]: "deleted" } },
        required: false,
        include: [
          {
            model: model.titleTranslation,
            attributes: ["title_id", "name", "site_language"],
            left: true,
            where: {
              id: {
                [Op.eq]: Sequelize.literal(
                  `(SELECT id FROM ${TABLES.TITLE_TRANSLATION_TABLE} WHERE ${
                    TABLES.TITLE_TRANSLATION_TABLE
                  }.title_id = title.id AND status='active' ORDER BY site_language ${
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
        attributes: ["id"],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: false,
        include: [
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "site_language"],
            left: true,
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

    const condition = {
      status: { [Op.ne]: "deleted" },
      award_id: awardId,
      round_id: roundId,
    };

    const getAwardPastDetails = await paginationService.pagination(
      searchParams,
      model.awardNominees,
      includeQuery,
      condition,
      attributes,
    );
    let awardNomineeList = [];
    if (getAwardPastDetails && getAwardPastDetails.rows.length > 0) {
      for (const eachRecord of getAwardPastDetails.rows) {
        const record = {
          nominee_id: eachRecord.dataValues.nominee_id,
          award_id: eachRecord.dataValues.award_id,
          round_id: eachRecord.dataValues.round_id,
          round_name: eachRecord.dataValues.round_name,
          division_name: "",
          work: "",
          character: "",
          comment: eachRecord.dataValues.comment,
          status: eachRecord.dataValues.status,
        };
        record.division_name =
          eachRecord.dataValues.awardSector &&
          eachRecord.dataValues.awardSector.dataValues &&
          eachRecord.dataValues.awardSector.dataValues.awardSectorTranslations &&
          eachRecord.dataValues.awardSector.dataValues.awardSectorTranslations.length > 0 &&
          eachRecord.dataValues.awardSector.dataValues.awardSectorTranslations[0] &&
          eachRecord.dataValues.awardSector.dataValues.awardSectorTranslations[0].division_name
            ? eachRecord.dataValues.awardSector.dataValues.awardSectorTranslations[0].division_name
            : "";
        record.work =
          eachRecord.dataValues.title &&
          eachRecord.dataValues.title.dataValues &&
          eachRecord.dataValues.title.dataValues.titleTranslations &&
          eachRecord.dataValues.title.dataValues.titleTranslations.length > 0 &&
          eachRecord.dataValues.title.dataValues.titleTranslations[0] &&
          eachRecord.dataValues.title.dataValues.titleTranslations[0].name
            ? eachRecord.dataValues.title.dataValues.titleTranslations[0].name
            : "";
        record.character =
          eachRecord.dataValues.person &&
          eachRecord.dataValues.person.dataValues &&
          eachRecord.dataValues.person.dataValues.peopleTranslations &&
          eachRecord.dataValues.person.dataValues.peopleTranslations.length > 0 &&
          eachRecord.dataValues.person.dataValues.peopleTranslations[0] &&
          eachRecord.dataValues.person.dataValues.peopleTranslations[0].name
            ? eachRecord.dataValues.person.dataValues.peopleTranslations[0].name
            : "";
        awardNomineeList.push(record);
      }
    }
    res.ok({
      page: page,
      limit: limit,
      total_records: getAwardPastDetails.count,
      total_pages: getAwardPastDetails.count > 0 ? Math.ceil(getAwardPastDetails.count / limit) : 0,
      result: awardNomineeList,
    });
  } catch (error) {
    next(error);
  }
};
