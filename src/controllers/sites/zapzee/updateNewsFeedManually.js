import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { zapzeeService } from "../../../services/index.js";
import { Op } from "sequelize";
/**
 * updateNewsFeedManually
 * used for developer purpose
 * @param  req
 * @param  res
 * @param  next
 */

export const updateNewsFeedManually = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type ? reqBody.type : "movie";
    const currentDate = await customDateTimeHelper.getCurrentDateTime("DD_MM_YYYY");
    const data = await zapzeeService.fetchNewsFeedManually(currentDate, type);
    if (data && data.length > 0) {
      for (const newsData of data) {
        if (newsData) {
          const lan = newsData.language ? newsData.language.replace("-", "_") : "en_US";
          const getLan = await model.localization.findOne({
            where: { status: "active", locale: lan },
          });
          const siteLanguage = getLan && getLan.code ? getLan.code : "en";
          const checkExt = await model.news.findOne({
            where: {
              title: newsData.title,
              type: type,
              site_language: siteLanguage,
              guid_text: newsData.guid_text,
              status: { [Op.ne]: "deleted" },
            },
          });
          if (checkExt) {
            const updateData = {
              title: newsData.title,
              body: newsData.description,
              slug: newsData.slug,
              meta: "",
              type: type,
              site_language: siteLanguage,
              published_date: newsData.published_date,
              update_period: newsData.update_period,
              update_frequency: newsData.update_frequency,
              rss_link: newsData.rss_link,
              category: newsData.category ? newsData.category.join(",") : "",
              creator_name: newsData.creator_name,
              list_image: newsData.list_image,
              guid_text: newsData.guid_text,
              updated_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.news.update(updateData, { where: { id: checkExt.id } });
          } else {
            const createData = {
              title: newsData.title,
              body: newsData.description,
              slug: newsData.slug,
              meta: "",
              type: type,
              site_language: siteLanguage,
              published_date: newsData.published_date,
              update_period: newsData.update_period,
              update_frequency: newsData.update_frequency,
              rss_link: newsData.rss_link,
              category: newsData.category ? newsData.category.join(",") : "",
              creator_name: newsData.creator_name,
              list_image: newsData.list_image,
              guid_text: newsData.guid_text,
              status: "active",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            await model.news.create(createData);
          }
        }
      }
    }
    res.ok({
      message: res.__("success"),
    });
  } catch (error) {
    next(error);
  }
};
