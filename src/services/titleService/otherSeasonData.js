import model from "../../models/index.js";
/**
 * otherSeasonData - search keyword and news search keyword
 * @param titleId
 * @param titleType
 * @param language
 * @param seasonId
 */

export const otherSeasonData = async (titleId, titleType, language = "en", seasonId) => {
  try {
    let otherDataResposnse = {};
    let getSearchKeywordList = [],
      getNewsSearchKeywordList = [];
    const titleValid = await model.title.findOne({
      where: {
        id: titleId,
        type: titleType,
        record_status: "active",
      },
    });
    if (titleValid) {
      // Get the details from the Title - Check for tmdb and kobis id in title
      let dbTitleInformation = await model.title.findOne({
        attributes: [
          "id",
          "tiving_id",
          "odk_id",
          "kobis_id",
          "is_rerelease",
          "footfalls",
          "rating",
        ],
        include: [
          {
            model: model.titleTranslation,
            attributes: ["name", "aka", "plot_summary", "description"],
            left: true,
            where: { status: "active" },
          },
        ],
        where: {
          id: titleId,
          record_status: "active",
          type: titleType,
        },
      });
      if (dbTitleInformation) {
        // language dependent fields:
        // Get the details from the Title - Check for tmdb and kobis id in title
        const keywords = await model.titleKeyword.findAll({
          attributes: ["id", "keyword", "keyword_type"],
          where: {
            title_id: titleId,
            status: "active",
            season_id: seasonId,
          },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        });

        // Get search  and news search keyword details
        if (keywords) {
          for (const eachValue of keywords) {
            if (eachValue && eachValue.keyword_type == "search") {
              getSearchKeywordList.push({ search_keyword: eachValue.keyword });
            } else if (eachValue && eachValue.keyword_type == "news") {
              getNewsSearchKeywordList.push({ news_keyword: eachValue.keyword });
            }
          }
        }

        otherDataResposnse.search_keyword_details = getSearchKeywordList;
        otherDataResposnse.news_keyword_details = getNewsSearchKeywordList;
      }
    }
    return otherDataResposnse;
  } catch (e) {
    console.log("error", e);
    return {};
  }
};
