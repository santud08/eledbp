import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { zapzeeService } from "../../../services/index.js";
import { Op } from "sequelize";

export const updateNews = async (type = "movie") => {
  try {
    const currentDate = await customDateTimeHelper.getCurrentDateTime();
    const data = await zapzeeService.fetchNewsFeed(type);
    if (data && data.length > 0) {
      let lastTopNewsId = null;
      for (const newsData of data) {
        if (newsData) {
          const lan = newsData.language ? newsData.language.replace("-", "_") : "en_US";
          const getLan = await model.localization.findOne({
            where: { status: "active", locale: lan },
          });
          const siteLanguage = getLan && getLan.code ? getLan.code : "en";
          const guidText = newsData.guid_text.trim();
          const checkExt = await model.news.findOne({
            where: {
              type: type,
              site_language: siteLanguage,
              guid_text: guidText,
              status: { [Op.ne]: "deleted" },
            },
          });
          let newsId = null;
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
            newsId = checkExt.id;
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
              guid_text: guidText,
              status: "active",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            const addNews = await model.news.create(createData);
            if (addNews && addNews.id > 0) newsId = addNews.id;
          }
          //updating top news
          if (
            newsId > 0 &&
            newsData.category &&
            newsData.category.length > 0 &&
            newsData.category.includes("News") === true &&
            lastTopNewsId == null
          ) {
            lastTopNewsId = newsId;
          }
        }
      }
      //
      if (lastTopNewsId && lastTopNewsId > 0) {
        const checkTopNews = await model.topNewsMapping.findOne({
          where: { news_id: lastTopNewsId, status: { [Op.ne]: "deleted" } },
        });
        if (!checkTopNews) {
          const topNewsCreateData = {
            news_id: lastTopNewsId,
            status: "active",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
          };
          await model.topNewsMapping.create(topNewsCreateData);
        }
      }
    }
    console.log("service update News from Zapzee runs at: ", currentDate);
  } catch (error) {
    console.log(error);
  }
};
