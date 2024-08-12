import model from "../../../models/index.js";
import { Sequelize, Op } from "sequelize";
import { generalHelper } from "../../../helpers/index.js";
import { userService } from "../../../services/index.js";

/**
 * topNews
 * @param req
 * @param res
 * @param next
 */
export const topNews = async (req, res, next) => {
  try {
    const [getSettingsDetails] = await Promise.all([
      // check for setting - whether the particular section is enabled
      model.settings.findOne({
        where: { name: "settings.front_lists.main", status: "active" },
      }),
    ]);

    const settingValue =
      getSettingsDetails && getSettingsDetails.value != null
        ? JSON.parse(getSettingsDetails.value)
        : null;

    //----------------------TOP NEWS SECTION-------------------------------
    // get information of the news
    let topNews = {};
    let newsList = {};

    if (settingValue != null && settingValue.top_news === true) {
      //find top one
      const newsCategory = "News";
      const getTopNewsInformation = await model.topNewsMapping.findOne({
        attributes: [
          [Sequelize.col("news.id"), "id"],
          [Sequelize.col("news.title"), "news_title"],
          [Sequelize.col("news.body"), "news_details"],
          [Sequelize.col("news.list_image"), "news_image"],
          [
            Sequelize.fn("date_format", Sequelize.col("news.published_date"), "%b %d,%Y"),
            "news_date",
          ],
          [Sequelize.fn("IFNULL", null, `${newsCategory}`), "news_category"],
          [Sequelize.col("news.slug"), "slug_name"],
          [Sequelize.col("news.rss_link"), "rss_link"],
        ],
        include: [
          {
            model: model.news,
            attributes: [],
            left: true,
            where: {
              status: { [Op.ne]: "deleted" },
              category: { [Op.like]: `%${newsCategory}%` },
            },
            required: true,
          },
        ],
        order: [[model.news, "published_date", "DESC"]],
        where: {
          status: "active",
        },
      });

      let topNewsId = null;
      if (getTopNewsInformation) {
        topNewsId = getTopNewsInformation.id;
        delete getTopNewsInformation.dataValues.id;

        topNews = getTopNewsInformation;
        topNews.dataValues.news_image =
          topNews.dataValues.news_image &&
          (await generalHelper.isImageURL(topNews.dataValues.news_image))
            ? topNews.dataValues.news_image
            : await generalHelper.generateImageUrl(req, "zapzee_n.png");
      }

      const getMovieNewsInformation = await model.news.findAll({
        attributes: [
          "id",
          [Sequelize.fn("IFNULL", null, `${newsCategory}`), "news_category"],
          ["title", "news_title"],
          ["creator_name", "news_creators"],
          ["list_image", "news_image"],
          [Sequelize.fn("date_format", Sequelize.col("published_date"), "%b %d,%Y"), "news_date"],
          ["slug", "slug_name"],
          "rss_link",
        ],
        order: [["published_date", "DESC"]],
        where: {
          status: "active",
          type: "movie",
          id: { [Op.ne]: topNewsId },
          category: { [Op.like]: `%${newsCategory}%` },
        },
        limit: 4,
        distinct: true,
      });
      if (getMovieNewsInformation && getMovieNewsInformation.length > 0) {
        let movieNewsData = [];
        let rssLink = "";
        for (const newsMovieData of getMovieNewsInformation) {
          if (newsMovieData) {
            rssLink = newsMovieData.rss_link ? newsMovieData.rss_link : "";
            newsMovieData.dataValues.news_image =
              newsMovieData.dataValues.news_image &&
              (await generalHelper.isImageURL(newsMovieData.dataValues.news_image))
                ? newsMovieData.dataValues.news_image
                : await generalHelper.generateImageUrl(req, "zapzee_n.png");
            delete newsMovieData.dataValues.rss_link;
            movieNewsData.push(newsMovieData);
          }
        }
        newsList.movies = {
          list: movieNewsData,
          movie_rss_link: rssLink,
        };
      }

      const getTvNewsInformation = await model.news.findAll({
        attributes: [
          "id",
          [Sequelize.fn("IFNULL", null, `${newsCategory}`), "news_category"],
          ["title", "news_title"],
          ["creator_name", "news_creators"],
          ["list_image", "news_image"],
          [Sequelize.fn("date_format", Sequelize.col("published_date"), "%b %d,%Y"), "news_date"],
          ["slug", "slug_name"],
          "rss_link",
        ],
        order: [["published_date", "DESC"]],
        where: {
          status: "active",
          type: "tv_show",
          id: { [Op.ne]: topNewsId },
          category: { [Op.like]: `%${newsCategory}%` },
        },
        limit: 4,
        distinct: true,
      });
      if (getTvNewsInformation && getTvNewsInformation.length > 0) {
        let tvNewsData = [];
        let rssLink = "";
        for (const newsTvData of getTvNewsInformation) {
          if (newsTvData) {
            rssLink = newsTvData.rss_link ? newsTvData.rss_link : "";
            newsTvData.dataValues.news_image =
              newsTvData.dataValues.news_image &&
              (await generalHelper.isImageURL(newsTvData.dataValues.news_image))
                ? newsTvData.dataValues.news_image
                : await generalHelper.generateImageUrl(req, "zapzee_n.png");
            delete newsTvData.dataValues.rss_link;
            tvNewsData.push(newsTvData);
          }
        }
        newsList.tv_shows = {
          list: tvNewsData,
          rss_link: rssLink,
        };
      }
      const webtoonHide = await userService.checkUserWebtoonMenu(req);
      let getWebtoonsNewsInformation = [];
      if (webtoonHide) {
        getWebtoonsNewsInformation = [];
      } else {
        getWebtoonsNewsInformation = await model.news.findAll({
          attributes: [
            "id",
            [Sequelize.fn("IFNULL", null, `${newsCategory}`), "news_category"],
            ["title", "news_title"],
            ["creator_name", "news_creators"],
            ["list_image", "news_image"],
            [Sequelize.fn("date_format", Sequelize.col("published_date"), "%b %d,%Y"), "news_date"],
            ["slug", "slug_name"],
            "rss_link",
          ],
          order: [["published_date", "DESC"]],
          where: {
            status: "active",
            type: "webtoon",
            id: { [Op.ne]: topNewsId },
            category: { [Op.like]: `%${newsCategory}%` },
          },
          limit: 4,
          distinct: true,
        });
      }
      if (getWebtoonsNewsInformation && getWebtoonsNewsInformation.length > 0) {
        let webtoonsNewsData = [];
        let rssLink = "";
        for (const newsWebtoonsData of getWebtoonsNewsInformation) {
          if (newsWebtoonsData) {
            rssLink = newsWebtoonsData.rss_link ? newsWebtoonsData.rss_link : "";
            newsWebtoonsData.dataValues.news_image =
              newsWebtoonsData.dataValues.news_image &&
              (await generalHelper.isImageURL(newsWebtoonsData.dataValues.news_image))
                ? newsWebtoonsData.dataValues.news_image
                : await generalHelper.generateImageUrl(req, "zapzee_n.png");
            delete newsWebtoonsData.dataValues.rss_link;
            webtoonsNewsData.push(newsWebtoonsData);
          }
        }
        newsList.webtoons = {
          list: webtoonsNewsData,
          rss_link: rssLink,
        };
      }
    }

    res.ok({
      top_news: topNews,
      news_list: newsList,
    });
  } catch (error) {
    next(error);
  }
};
