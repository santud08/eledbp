import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * awardEdit
 * @param req
 * @param res
 */
export const awardEdit = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const loginUserId = req.userDetails.userId;
    const awardId = reqBody.id ? reqBody.id : "";
    const type = reqBody.type ? reqBody.type : "";
    const awardNameKo = reqBody.award_name_ko ? reqBody.award_name_ko : "";
    const awardNameEn = reqBody.award_name_en ? reqBody.award_name_en : "";
    const country = reqBody.country ? reqBody.country : "";
    const cityName = reqBody.city_name ? reqBody.city_name : "";
    const place = reqBody.place ? reqBody.place : "";
    const eventMonth = reqBody.event_month ? reqBody.event_month : "";
    const newsSearchKeyword = reqBody.news_search_keyword ? reqBody.news_search_keyword : "";
    const isPosterDeleted = reqBody.is_poster_deleted ? reqBody.is_poster_deleted : "";
    const websiteUrl = reqBody.website_url ? reqBody.website_url : "";
    const explanationEn = reqBody.explanation_en ? reqBody.explanation_en : "";
    const explanationKo = reqBody.explanation_ko ? reqBody.explanation_ko : "";
    let originalName = "";
    let fileLocation = "";
    let fileName = "";
    let filePath = "";

    // check for award exist in awards table
    const isExists = await model.awards.findOne({
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid award id"));

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
        award_id: { [Op.ne]: awardId },
        status: { [Op.ne]: "deleted" },
      },
    });

    if (isExistsAwardName) throw StatusError.badRequest(res.__("same award name already exists"));

    // Edit award details
    const updateAwardDetails = {
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
    await model.awards.update(updateAwardDetails, {
      where: { id: awardId, status: { [Op.ne]: "deleted" } },
    });

    if (awardId) {
      if (awardNameEn) {
        // edit award translation for English
        const updateAwardTranslation = {
          award_name: awardNameEn,
          award_explanation: explanationEn,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: loginUserId,
        };
        await model.awardTranslation.update(updateAwardTranslation, {
          where: { award_id: awardId, status: { [Op.ne]: "deleted" }, site_language: "en" },
        });
      }
      if (awardNameKo) {
        // edit award translation for Korean
        const updateAwardTranslation = {
          award_name: awardNameKo,
          award_explanation: explanationKo,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: loginUserId,
        };
        await model.awardTranslation.update(updateAwardTranslation, {
          where: { award_id: awardId, status: { [Op.ne]: "deleted" }, site_language: "ko" },
        });
      }

      // 1. to delete image isPosterDeleted = y and profile image is blank
      // 2. to update image isPosterDeleted = n and profile image is not blank
      if (isPosterDeleted === "y" && !req.file) {
        const updateAwardImage = {
          original_name: null,
          file_name: null,
          url: null,
          path: null,
          updated_at: await customDateTimeHelper.getCurrentDateTime(),
          updated_by: loginUserId,
        };
        await model.awardImages.update(updateAwardImage, {
          where: { award_id: awardId, status: { [Op.ne]: "deleted" } },
        });
      }
      if (isPosterDeleted === "n" && req.file) {
        let updateAwardImage = {
          award_id: awardId,
          original_name: originalName,
          file_name: fileName,
          url: fileLocation,
          path: filePath,
        };

        const awardDetails = await model.awardImages.findOne({
          where: {
            award_id: awardId,
            status: "active",
          },
        });

        if (awardDetails) {
          updateAwardImage.updated_at = await customDateTimeHelper.getCurrentDateTime();
          updateAwardImage.updated_by = loginUserId;
          await model.awardImages.update(updateAwardImage, {
            where: { award_id: awardId, status: { [Op.ne]: "deleted" } },
          });
        } else {
          updateAwardImage.created_at = await customDateTimeHelper.getCurrentDateTime();
          updateAwardImage.created_by = loginUserId;
          await model.awardImages.create(updateAwardImage);
        }
      }
      //edit data in search db
      esService.esSchedularAddUpdate(awardId, "award", "edit");

      res.ok({
        message: res.__("award updated successfully"),
      });
    } else {
      throw StatusError.badRequest(res.__("SomeThingWentWrong"));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
