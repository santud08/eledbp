import model from "../../../models/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { paginationService } from "../../../services/index.js";
import { Sequelize, Op, col } from "sequelize";

/**
 * userList
 * @param req
 * @param res
 */
export const userList = async (req, res, next) => {
  try {
    const reqBody = req.query;

    const searchType = reqBody.type ? reqBody.type : "";
    const searchName = reqBody.name ? reqBody.name.trim() : "";
    let resultData = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const sortOrder = reqBody.sort_order ? reqBody.sort_order : "desc";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "";

    let searchDateType = !reqBody.search_date_type ? "" : reqBody.search_date_type;
    const searchStartDate = reqBody.start_date ? reqBody.start_date : "";
    const searchEndDate = reqBody.end_date ? reqBody.end_date : "";

    const loginUserId = req.userDetails.userId;
    const searchParams = {
      page: page,
      limit: limit,
    };

    let dateFilter = "user.created_at";
    let condition = { status: { [Op.ne]: "deleted" }, id: { [Op.ne]: loginUserId } };
    if (searchDateType == "created_date") {
      dateFilter = "user.created_at";
    }
    if (searchDateType == "last_login_date") {
      dateFilter = "user.last_login";
    }
    let applyMoreand = false;
    // Add extra conditions for Startdate
    if (searchDateType && searchStartDate && !searchEndDate) {
      condition[Op.and] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
          [Op.gte]: searchStartDate,
        }),
      ];
      applyMoreand = true;
    }
    // Add extra conditions for Enddate
    if (searchDateType && searchEndDate && !searchStartDate) {
      condition[Op.and] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
          [Op.lte]: searchEndDate,
        }),
      ];
      applyMoreand = true;
    }
    // Add extra conditions for Startdate & EndDate
    if (searchDateType && searchStartDate && searchEndDate) {
      condition[Op.and] = [
        Sequelize.where(Sequelize.fn("DATE", Sequelize.col(dateFilter)), {
          [Op.between]: [searchStartDate, searchEndDate],
        }),
      ];
      applyMoreand = true;
    }

    const attributes = [
      "id",
      ["avatar", "user_image"],
      "email",
      [col("userRole.role.role_name"), "role"],
      "created_at",
      "last_login",
    ];

    if (sortOrder && sortBy == "type") {
      searchParams.sortOrderObj = [[col("userRole.role.role_name"), sortOrder]];
    } else if (sortOrder && sortBy == "email") {
      searchParams.sortOrderObj = [[Sequelize.literal("email"), sortOrder]];
    } else if (sortOrder && sortBy == "created_at") {
      searchParams.sortOrderObj = [[Sequelize.literal("created_at"), sortOrder]];
    } else {
      searchParams.sortOrderObj = [[Sequelize.literal("created_at"), sortOrder]];
    }

    const includeQuery = [
      {
        model: model.userRole,
        attributes: [],
        where: { status: "active" },
        required: true,
        include: [
          { model: model.role, attributes: [], where: { status: "active" }, required: true },
        ],
      },
    ];
    if (searchType) {
      if (applyMoreand) {
        condition[Op.and].push({ "$userRole.role_id$": searchType });
      } else {
        condition[Op.and] = { "$userRole.role_id$": searchType };
      }
    }
    if (searchName) {
      const arrName = searchName.split(" ");
      let orArr = [
        { first_name: { [Op.like]: `%${searchName}%` } },
        { last_name: { [Op.like]: `%${searchName}%` } },
      ];
      if (arrName.length > 1) {
        arrName.map((name) => {
          if (name) {
            orArr.push({ first_name: { [Op.like]: `%${name}%` } });
            orArr.push({ last_name: { [Op.like]: `%${name}%` } });
          }
        });
      }
      condition[Op.or] = orArr;
    }

    resultData = await paginationService.pagination(
      searchParams,
      model.user,
      includeQuery,
      condition,
      attributes,
    );
    if (resultData.rows && resultData.rows.length > 0) {
      resultData.rows = resultData.rows.map((role) => {
        role.dataValues.role = res.__(role.dataValues.role);
        return role;
      });
    }
    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.count,
      total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
      results: resultData.rows,
    });
  } catch (error) {
    next(error);
  }
};
