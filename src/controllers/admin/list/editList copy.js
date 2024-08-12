import model from "../../../models/index.js";
//import { Sequelize, Op, fn, col } from "sequelize";
import { Sequelize, Op } from "sequelize";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT, TABLES } from "../../../utils/constants.js";

/**
 * editList
 * @param req
 * @param res
 */
export const editList = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const searchType = reqBody.search_type ? reqBody.search_type : "";
    const searchTitle = reqBody.search_title ? reqBody.search_title : "";
    const searchEmailId = reqBody.search_email ? reqBody.search_email : "";
    const searchTitleStatus = reqBody.search_title_status ? reqBody.search_title_status : "";
    const searchEditorName = reqBody.search_editor_name ? reqBody.search_editor_name : "";
    const searchStartDate = reqBody.search_start_date ? reqBody.search_start_date : "";
    const searchEndDate = reqBody.search_end_date ? reqBody.search_end_date : "";
    const searchOperation = reqBody.search_operation ? reqBody.search_operation : "";

    let includeQuery = [];
    let condition = { status: { [Op.ne]: "deleted" } };
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "";

    const language = req.accept_language;
    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "modified_date",
      sortOrder: "desc",
      //subQuery: false,
      //raw: true,
      queryLog: true,
    };

    if (sortOrder && sortBy == "type") {
      searchParams.sortOrderObj = [[Sequelize.literal("type"), sortOrder]];
    } else if (sortOrder && sortBy == "title_name") {
      //searchParams.sortOrderObj = [[Sequelize.literal("title_name"), sortOrder]];
      //searchParams.sortOrderObj = [[Sequelize.literal("title_name"), sortOrder]];
    } else if (sortOrder && sortBy == "editor_name") {
      searchParams.sortOrderObj = [[model.editor, model.user, "first_name", sortOrder]];
    } else if (sortOrder && sortBy == "operation") {
      searchParams.sortOrderObj = [[Sequelize.literal("operation"), sortOrder]];
    } else if (sortOrder && sortBy == "email_id") {
      searchParams.sortOrderObj = [[model.editor, model.user, "email", sortOrder]];
    } else if (sortOrder && sortBy == "status") {
      //searchParams.sortOrderObj = [[Sequelize.literal("status_all"), sortOrder]];
      searchParams.sortOrderObj = [[model.title, "title_status", sortOrder]];
    } else if (sortOrder && sortBy == "registration_date") {
      searchParams.sortOrderObj = [[Sequelize.literal("registration_date"), sortOrder]];
    } else if (sortOrder && sortBy == "activeInactive") {
      searchParams.sortOrderObj = [
        [
          Sequelize.literal(
            '( CASE WHEN `edit`.`type`!="people" THEN "title.record_status" ELSE "person.status" END)',
          ),
          sortOrder,
        ],
      ];
      //searchParams.sortOrderObj = [[Sequelize.literal("active_inactive"), sortOrder]];
    } else if (sortOrder && sortBy == "modified_date") {
      searchParams.sortOrderObj = [[Sequelize.literal("modified_date"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[Sequelize.literal("modified_date"), "desc"]];
    }

    const attributes = [
      "id",
      "editable_id",
      "editor_id",
      "type",
      //[fn("getEditListName", col("edit.editable_id"), col("edit.type"), language), "title_name"],
      //   [
      //     Sequelize.literal(
      //       '( CASE WHEN `edit`.`type`!="people" THEN `title->titleTranslations`.`name` ELSE `person->peopleTranslations`.`name` END)',
      //     ),
      //     "title_name",
      //   ],
      "operation",
      "modified_date",
      //[fn("getEditListStatus", col("edit.editable_id"), col("edit.type")), "status_all"],
      //   [
      //     Sequelize.literal(
      //       '( CASE WHEN `edit`.`type`!="people" THEN `title`.`title_status` ELSE "" END)',
      //     ),
      //     "status_all",
      //   ],
      "registration_date",
      // [
      //   fn("getEditListActiveInactive", col("edit.editable_id"), col("edit.type")),
      //   "active_inactive",
      // ],
      //   [
      //     Sequelize.literal(
      //       '( CASE WHEN `edit`.`type`!="people" THEN `title`.`record_status` ELSE `person`.`status` END)',
      //     ),
      //     "active_inactive",
      //   ],
    ];

    // Title table search data condition add
    const titleCondition = { record_status: { [Op.ne]: "deleted" } };
    let isTitleTranslationRequired = false;
    if (searchTitleStatus) {
      isTitleTranslationRequired = true;
      titleCondition.title_status = searchTitleStatus;
    }

    // Title-translation table search data condition add
    let isPeoplTranslationRequired = false;
    //const titleTransCondition = { status: { [Op.ne]: "deleted" } };
    //let tvCon = { status: { [Op.ne]: "deleted" } };
    if (searchTitle) {
      if (searchType == "people") {
        isPeoplTranslationRequired = true;
      }
      if (searchType == "movie" || searchType == "tv" || searchType == "webtoons") {
        isTitleTranslationRequired = true;
      }
      condition[Op.and] = Sequelize.literal(
        '( CASE WHEN `edit`.`type`!="people" THEN `title->titleTranslations`.`name` ELSE `person->peopleTranslations`.`name` END) LIKE "%' +
          searchTitle +
          '%"',
      );
    }

    // user table search data condition add
    let isUserRequired = false;
    const userCondition = { status: "active" };
    if (searchEmailId) {
      userCondition.email = searchEmailId;
      isUserRequired = true;
    }
    if (searchEditorName) {
      userCondition.first_name = { [Op.like]: `%${searchEditorName}%` };
      isUserRequired = true;
    }

    // Add extra conditions for Startdate
    if (searchStartDate && !searchEndDate) {
      condition[Op.or] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("registration_date")), {
          [Op.gte]: searchStartDate,
        }),
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("modified_date")), {
          [Op.gte]: searchStartDate,
        }),
      ];
    }
    // Add extra conditions for Enddate
    if (searchEndDate && !searchStartDate) {
      condition[Op.or] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("registration_date")), {
          [Op.lte]: searchEndDate,
        }),
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("modified_date")), {
          [Op.lte]: searchEndDate,
        }),
      ];
    }
    // Add extra conditions for Startdate & EndDate
    if (searchStartDate && searchEndDate) {
      condition[Op.or] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("registration_date")), {
          [Op.between]: [searchStartDate, searchEndDate],
        }),
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col("modified_date")), {
          [Op.between]: [searchStartDate, searchEndDate],
        }),
      ];
    }
    // Add extra conditions for Operation
    if (searchOperation) {
      condition.operation = searchOperation;
    }
    // Add extra conditions for search type(movie/tv/webtoon/people)
    if (searchType) {
      condition.type = searchType;
    }

    includeQuery = [
      {
        model: model.editor,
        left: true,
        attributes: ["id", "user_id"],
        include: {
          model: model.user,
          attributes: ["id", "first_name", "email"],
          left: true,
          where: userCondition,
          required: isUserRequired,
        },
        where: { current_status: "allocate", status: { [Op.ne]: "deleted" } },
        required: isUserRequired,
      },
      {
        model: model.title,
        attributes: ["id", "title_status", "record_status"],
        left: true,
        where: titleCondition,
        required: isTitleTranslationRequired,
        include: {
          model: model.titleTranslation,
          attributes: ["id", "title_id", "name", "site_language"],
          left: true,
          //where: titleTransCondition,
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
          required: isTitleTranslationRequired,
          //separate: true,
          //order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      },
      {
        model: model.people,
        attributes: ["id", "status"],
        left: true,
        where: { status: { [Op.ne]: "deleted" } },
        required: isPeoplTranslationRequired,
        include: {
          model: model.peopleTranslation,
          attributes: ["id", "people_id", "name", "site_language"],
          left: true,
          //where: tvCon,
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
          required: isPeoplTranslationRequired,
          //separate: true,
          //order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      },
    ];

    let resultData = await paginationService.pagination(
      searchParams,
      model.edit,
      includeQuery,
      condition,
      attributes,
      //["edit.id"],
    );
    let listData = [];
    if (resultData) {
      const resCount =
        typeof resultData.count == "object" ? resultData.count.length : resultData.count;
      delete resultData.count;
      resultData.count = resCount;
      for (const ed of resultData.rows) {
        if (ed) {
          let record = {
            edit_id: ed.dataValues.id ? ed.dataValues.id : "",
            editable_id: ed.dataValues.editable_id ? ed.dataValues.editable_id : "",
            type: ed.dataValues.type ? ed.dataValues.type : "",
            editor_name:
              ed.dataValues.editor && ed.dataValues.editor.user
                ? ed.dataValues.editor.user.first_name
                : "",
            email_id:
              ed.dataValues.editor && ed.dataValues.editor.user
                ? ed.dataValues.editor.user.email
                : "",
            title_name: "",
            //title_name: ed.dataValues.title_name ? ed.dataValues.title_name : "",
            operation: ed.dataValues.operation ? ed.dataValues.operation : "",
            modified_date: ed.dataValues.modified_date ? ed.dataValues.modified_date : "",
            status: "",
            //status: ed.dataValues.status_all ? ed.dataValues.status_all : "",
            registration_date: ed.dataValues.registration_date
              ? ed.dataValues.registration_date
              : "",
            active_inactive: "",
            //active_inactive: ed.dataValues.active_inactive ? ed.dataValues.active_inactive : "",
          };
          record.title_name = record.editable_id
            ? `${record.title_name} (${record.editable_id})`
            : record.title_name;
          if (record.type == "people") {
            record.title_name =
              ed.dataValues.person &&
              ed.dataValues.person.peopleTranslations &&
              ed.dataValues.person.peopleTranslations.length > 0 &&
              ed.dataValues.person.peopleTranslations[0] &&
              ed.dataValues.person.peopleTranslations[0].name
                ? ed.dataValues.person.peopleTranslations[0].name
                : "";
            record.status = "";
            record.active_inactive =
              ed.dataValues.person && ed.dataValues.person.status
                ? ed.dataValues.person.status
                : "";
          } else {
            record.title_name =
              ed.dataValues.title &&
              ed.dataValues.title.titleTranslations &&
              ed.dataValues.title.titleTranslations.length > 0 &&
              ed.dataValues.title.titleTranslations[0] &&
              ed.dataValues.title.titleTranslations[0].name
                ? ed.dataValues.title.titleTranslations[0].name
                : "";
            record.status =
              ed.dataValues.title && ed.dataValues.title.title_status
                ? ed.dataValues.title.title_status
                : "";
            record.active_inactive =
              ed.dataValues.title && ed.dataValues.title.record_status
                ? ed.dataValues.title.record_status
                : "";
          }
          listData.push(record);
        }
      }
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      result: listData,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
