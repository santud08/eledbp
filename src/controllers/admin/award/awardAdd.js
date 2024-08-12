import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * awardAdd
 * @param req
 * @param res
 */
export const awardAdd = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const type = reqBody.type ? reqBody.type : "";
    const awardNameKo = reqBody.award_name_ko ? reqBody.award_name_ko : "";
    const awardNameEn = reqBody.award_name_en ? reqBody.award_name_en : "";
    const country = reqBody.country ? reqBody.country : "";
    const cityName = reqBody.city_name ? reqBody.city_name : "";
    const place = reqBody.place ? reqBody.place : "";
    const eventMonth = reqBody.event_month ? reqBody.event_month : "";
    const newsSearchKeyword = reqBody.news_search_keyword ? reqBody.news_search_keyword : "";
    const websiteUrl = reqBody.website_url ? reqBody.website_url : "";
    const explanationEn = reqBody.explanation_en ? reqBody.explanation_en : "";
    const explanationKo = reqBody.explanation_ko ? reqBody.explanation_ko : "";
    let originalName = "";
    let fileLocation = "";
    let fileName = "";
    let filePath = "";

    if (req.file) {
      const fileDetails = req.file;
      originalName = fileDetails.originalname ? fileDetails.originalname : "";
      fileLocation = fileDetails.location ? fileDetails.location : "";
      fileName = fileDetails.key ? fileDetails.key : "";
      filePath = fileDetails.path ? fileDetails.path : "";
    }

    // check for award name existance in table
    const isExistsAwardName = await model.awardTranslation.findOne({
      attributes: ["award_name"],
      where: {
        [Op.or]: [{ award_name: awardNameEn }, { award_name: awardNameKo }],
        status: { [Op.ne]: "deleted" },
      },
    });

    if (isExistsAwardName) throw StatusError.badRequest(res.__("same award name already exists"));

    // add award details
    const awardDetails = {
      type: type,
      country_id: country,
      city_name: cityName,
      place: place,
      event_month: eventMonth,
      news_search_keyword: newsSearchKeyword,
      website_url: websiteUrl,
      avatar: fileLocation,
      created_by: loginUserId,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
    };
    const awardInformation = await model.awards.create(awardDetails);
    const awardId = awardInformation.id;
    if (awardId) {
      const bulkCreate = [];
      if (awardNameEn) {
        bulkCreate.push({
          award_id: awardId,
          award_name: awardNameEn,
          award_explanation: explanationEn,
          site_language: "en",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: loginUserId,
        });
      }
      if (awardNameKo) {
        bulkCreate.push({
          award_id: awardId,
          award_name: awardNameKo,
          award_explanation: explanationKo,
          site_language: "ko",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: loginUserId,
        });
      }
      if (bulkCreate.length > 0) await model.awardTranslation.bulkCreate(bulkCreate);
      if (fileName) {
        const uploadImage = {
          award_id: awardId,
          original_name: originalName,
          file_name: fileName,
          url: fileLocation,
          path: filePath,
          created_by: loginUserId,
          created_at: await customDateTimeHelper.getCurrentDateTime(),
        };
        await model.awardImages.create(uploadImage);
      }
      //add data in search db
      esService.esSchedularAddUpdate(awardId, "award", "add");
      res.ok({
        message: res.__("award added successfully"),
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    next(error);
  }
};
