import model from "../../../models/index.js";
import { Sequelize } from "sequelize";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";

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
    const searchContentId = reqBody.content_id ? reqBody.content_id : "";
    const searchTitleStatus = reqBody.search_title_status ? reqBody.search_title_status : "";
    const searchEditorName = reqBody.search_editor_name ? reqBody.search_editor_name : "";
    const searchStartDate = reqBody.search_start_date ? reqBody.search_start_date : "";
    const searchEndDate = reqBody.search_end_date ? reqBody.search_end_date : "";
    const searchOperation = reqBody.search_operation ? reqBody.search_operation : "";
    let searchDateType = !reqBody.search_date_type ? "" : reqBody.search_date_type;

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "";

    const language = req.accept_language;

    const lanOrd = language == "ko" ? "DESC" : "ASC";
    let rawQuery =
      "SELECT  DISTINCT(`edb_edits`.`id`) as `edit_id`, `edb_edits`.`editable_id`, `edb_edits`.`type`, CONCAT(`edb_users`.`first_name`,' ',`edb_users`.`last_name`) as `editor_name`, `edb_users`.`email` as `email_id`, CONCAT(( CASE WHEN `edb_edits`.`type`!='people' THEN `edb_title_translations`.`name` ELSE `edb_people_translations`.`name` END),' (',`edb_edits`.`editable_id`,')') As `title_name`,`operation`, `modified_date`,( CASE WHEN `edb_edits`.`type`!='people' THEN `edb_titles`.`title_status` ELSE '' END) AS `status`,`registration_date`, ( CASE WHEN `edb_edits`.`type`!='people' THEN `edb_titles`.`record_status` ELSE `edb_people`.`status` END) AS `active_inactive`" +
      "FROM `edb_edits` LEFT JOIN `edb_editors` ON `edb_editors`.`id`=`edb_edits`.`editor_id` AND `edb_editors`.`current_status`='allocate' AND `edb_editors`.`status`!='deleted' " +
      "LEFT JOIN `edb_users` ON `edb_editors`.`user_id`=`edb_users`.`id` LEFT JOIN `edb_titles` ON `edb_titles`.`id` = `edb_edits`.`editable_id` AND `edb_edits`.`type`!='people' LEFT JOIN `edb_title_translations` ON `edb_title_translations`.`title_id`=`edb_titles`.`id` AND `edb_title_translations`.`id`=(SELECT id FROM `edb_title_translations` WHERE `edb_title_translations`.`title_id` = `edb_titles`.`id` AND status='active' ORDER BY site_language " +
      lanOrd +
      " LIMIT 1) LEFT JOIN `edb_people` ON `edb_people`.`id` = `edb_edits`.`editable_id` AND `edb_edits`.`type`='people' LEFT JOIN `edb_people_translations` ON `edb_people_translations`.`people_id`=`edb_people`.`id` AND `edb_people_translations`.`id`=(SELECT id FROM `edb_people_translations` WHERE edb_people_translations.people_id = edb_people.id AND status='active' ORDER BY site_language " +
      lanOrd +
      " LIMIT 1) ";
    let rawQueryCount =
      "SELECT  count(DISTINCT(`edb_edits`.`id`)) as cnt " +
      "FROM `edb_edits` LEFT JOIN `edb_editors` ON `edb_editors`.`id`=`edb_edits`.`editor_id` AND `edb_editors`.`current_status`='allocate' AND `edb_editors`.`status`!='deleted' " +
      "LEFT JOIN `edb_users` ON `edb_editors`.`user_id`=`edb_users`.`id` LEFT JOIN `edb_titles` ON `edb_titles`.`id` = `edb_edits`.`editable_id` AND `edb_edits`.`type`!='people' LEFT JOIN `edb_title_translations` ON `edb_title_translations`.`title_id`=`edb_titles`.`id` AND `edb_title_translations`.`id`=(SELECT id FROM `edb_title_translations` WHERE `edb_title_translations`.`title_id` = `edb_titles`.`id` AND status='active' ORDER BY site_language " +
      lanOrd +
      " LIMIT 1) LEFT JOIN `edb_people` ON `edb_people`.`id` = `edb_edits`.`editable_id` AND `edb_edits`.`type`='people' LEFT JOIN `edb_people_translations` ON `edb_people_translations`.`people_id`=`edb_people`.`id` AND `edb_people_translations`.`id`=(SELECT id FROM `edb_people_translations` WHERE edb_people_translations.people_id = edb_people.id AND status='active' ORDER BY site_language " +
      lanOrd +
      " LIMIT 1) ";
    let rawOrderQuery = " `modified_date` DESC ";
    let rawWhereQuery = " `edb_edits`.`status`!='deleted' ";
    if (sortOrder && sortBy == "type") {
      rawOrderQuery = "`edb_edits`.`type` " + sortOrder;
    } else if (sortOrder && sortBy == "title_name") {
      rawOrderQuery =
        "(CASE WHEN `edb_edits`.`type`!='people' THEN `edb_title_translations`.`name` ELSE `edb_people_translations`.`name` END) " +
        sortOrder;
    } else if (sortOrder && sortBy == "editor_name") {
      rawOrderQuery = "CONCAT(`edb_users`.`first_name`,' ',`edb_users`.`last_name`) " + sortOrder;
    } else if (sortOrder && sortBy == "operation") {
      rawOrderQuery = `operation ${sortOrder}`;
    } else if (sortOrder && sortBy == "email_id") {
      rawOrderQuery = "`edb_users`.`email` " + sortOrder;
    } else if (sortOrder && sortBy == "status") {
      rawOrderQuery =
        "( CASE WHEN `edb_edits`.`type`!='people' THEN `edb_titles`.`title_status` ELSE '' END) " +
        sortOrder;
    } else if (sortOrder && sortBy == "registration_date") {
      rawOrderQuery = "`edb_edits`.`registration_date` " + sortOrder;
    } else if (sortOrder && sortBy == "activeInactive") {
      rawOrderQuery =
        "( CASE WHEN `edb_edits`.`type`!='people' THEN `edb_titles`.`record_status` ELSE `edb_people`.`status` END) " +
        sortOrder;
    } else if (sortOrder && sortBy == "modified_date") {
      rawOrderQuery = "`edb_edits`.`modified_date` " + sortOrder;
    } else {
      rawOrderQuery = "`modified_date` DESC";
    }

    // Title table search data condition add
    if (searchTitleStatus) {
      rawWhereQuery +=
        " AND ( CASE WHEN `edb_edits`.`type`!='people' THEN `edb_titles`.`title_status` ELSE '' END)='" +
        searchTitleStatus +
        "'";
    }

    // Title-translation table search data condition add
    if (searchTitle) {
      rawWhereQuery +=
        " AND (CASE WHEN `edb_edits`.`type`!='people' THEN `edb_title_translations`.`name` ELSE `edb_people_translations`.`name` END) LIKE '%" +
        searchTitle +
        "%'";
    }

    // Title id/people id table search data condition add
    if (searchContentId) {
      rawWhereQuery += " AND `edb_edits`.`editable_id`=" + searchContentId + "";
    }

    // user table search data condition add
    if (searchEmailId) {
      rawWhereQuery += " AND `edb_users`.`email`='" + searchEmailId + "'";
    }
    if (searchEditorName) {
      rawWhereQuery +=
        " AND CONCAT(`edb_users`.`first_name`,' ',`edb_users`.`last_name`) LIKE '%" +
        searchEditorName +
        "%'";
    }

    // Add extra conditions for Startdate
    if (searchDateType && searchStartDate && !searchEndDate) {
      if (searchDateType == "modified_date") {
        rawWhereQuery +=
          " AND DATE(`edb_edits`.`modified_date`) >= DATE('" + searchStartDate + "')";
      } else {
        rawWhereQuery +=
          " AND DATE(`edb_edits`.`registration_date`) >= DATE('" + searchStartDate + "')";
      }
    }
    // Add extra conditions for Enddate
    if (searchDateType && searchEndDate && !searchStartDate) {
      if (searchDateType == "modified_date") {
        rawWhereQuery += " AND DATE(`edb_edits`.`modified_date`) <= DATE('" + searchEndDate + "')";
      } else {
        rawWhereQuery +=
          " AND DATE(`edb_edits`.`registration_date`) <= DATE('" + searchEndDate + "')";
      }
    }
    // Add extra conditions for Startdate & EndDate
    if (searchDateType && searchStartDate && searchEndDate) {
      if (searchDateType == "modified_date") {
        rawWhereQuery +=
          " AND DATE(`edb_edits`.`modified_date`) between DATE('" +
          searchStartDate +
          "') AND DATE('" +
          searchEndDate +
          "')";
      } else {
        rawWhereQuery +=
          " AND DATE(`edb_edits`.`registration_date`) between DATE('" +
          searchStartDate +
          "') AND DATE('" +
          searchEndDate +
          "')";
      }
    }
    // Add extra conditions for Operation
    if (searchOperation) {
      rawWhereQuery += " AND `edb_edits`.`operation`='" + searchOperation + "'";
    }
    // Add extra conditions for search type(movie/tv/webtoon/people)
    if (searchType) {
      rawWhereQuery += " AND `edb_edits`.`type`='" + searchType + "'";
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitQ = parseInt(limit);
    const limitQuery = ` LIMIT ${limitQ} OFFSET ${offset}`;

    const rawQueryWithLimit =
      rawQuery + " Where " + rawWhereQuery + " Order By " + rawOrderQuery + limitQuery;
    //console.log(rawQueryWithLimit);
    // let resultData1 = await model.sequelize.query(rawQueryWithLimit, {
    //   //replacements: { value: "someValue" },
    //   type: Sequelize.QueryTypes.SELECT,
    //   raw: true,
    // });
    rawQueryCount += " Where " + rawWhereQuery;
    // let resultDataCount = await model.sequelize.query(rawQueryCount, {
    //   //replacements: { value: "someValue" },
    //   type: Sequelize.QueryTypes.SELECT,
    //   raw: true,
    // });
    let resultData = { rows: [], count: 0 };
    let resultDataCount = [];

    resultData.rows = await model.sequelize.query(rawQueryWithLimit, {
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
    });
    resultDataCount = await model.sequelize.query(rawQueryCount, {
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (
      resultDataCount &&
      resultDataCount.length > 0 &&
      resultDataCount[0] &&
      resultDataCount[0].cnt
    ) {
      resultData.count = resultDataCount[0].cnt;
    }

    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      result: resultData.rows ? resultData.rows : [],
      //resultDataCount,
    });
  } catch (error) {
    next(error);
  }
};
