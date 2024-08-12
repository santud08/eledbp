import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { Op } from "sequelize";

/** Creating season request internally at the edit webtoons
 * @params titleId - webtoons id
 * @params userId - user id
 * @params siteLanguage - Language for req creation
 * @params seasonPkId - Primary id of webtoon season
 * @params requestId - primary details request id
 */

export const createWtSeasonRequestId = async (
  titleId,
  userId,
  siteLanguage,
  requestId,
  seasonPkId,
) => {
  try {
    const data = {};
    let seasonDetails = {};
    let responseDetails = [];
    // Get the details from the Season - Check for tmdb and kobis id in title
    seasonDetails = await model.season.findAll({
      attributes: [
        "id",
        "release_date",
        "poster",
        "number",
        "title_id",
        "episode_count",
        "site_language",
      ],
      where: {
        id: { [Op.ne]: seasonPkId },
        title_id: titleId,
        status: "active",
      },
      include: [
        {
          attributes: ["id", "season_name", "summary", "aka", "site_language"],
          model: model.seasonTranslation,
          where: {
            site_language: siteLanguage,
            status: "active",
          },
          required: true,
        },
      ],
    });
    if (seasonDetails && seasonDetails.length > 0) {
      for (const seasonValues of seasonDetails) {
        const seasonName =
          seasonValues &&
          seasonValues.seasonTranslations &&
          seasonValues.seasonTranslations.length > 0 &&
          seasonValues.seasonTranslations[0].season_name
            ? seasonValues.seasonTranslations[0].season_name
            : "";
        const seasonSummary =
          seasonValues &&
          seasonValues.seasonTranslations &&
          seasonValues.seasonTranslations.length > 0 &&
          seasonValues.seasonTranslations[0].summary
            ? seasonValues.seasonTranslations[0].summary
            : "";
        const seasonAka =
          seasonValues &&
          seasonValues.seasonTranslations &&
          seasonValues.seasonTranslations.length > 0 &&
          seasonValues.seasonTranslations[0].aka
            ? seasonValues.seasonTranslations[0].aka
            : "";
        data.request_id = requestId;
        if (seasonValues) {
          data.season_no = seasonValues.number;
          data.season_details = {
            id: seasonValues.id,
            release_date: seasonValues.release_date,
            release_date_to: seasonValues.release_date_to,
            poster: seasonValues.poster,
            number: seasonValues.number,
            season_name: seasonName,
            title_id: seasonValues.title_id,
            title_tmdb_id: "",
            allow_update: "",
            summary: seasonSummary,
            aka: seasonAka,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            episode_count: seasonValues.episode_count,
            site_language: siteLanguage,
            status: "",
            created_by: userId,
            updated_by: "",
          };
        }

        const [readDetails, keywords, relatedChannelList] = await Promise.all([
          model.titleWatchOn.findAll({
            attributes: ["id", "title_id", "movie_id", "type", "provider_id", "season_id"],
            where: { title_id: titleId, season_id: seasonValues.id, status: "active" },
            include: [
              {
                model: model.ottServiceProvider,
                left: true,
                attributes: ["id", "ott_name", "provider_url", "logo_path"],
                where: { status: "active" },
              },
            ],
          }),
          model.titleKeyword.findAll({
            where: {
              title_id: titleId,
              season_id: seasonValues.id,
              status: "active",
            },
            attributes: ["id", "keyword", "keyword_type", "season_id"],
          }),
          model.webtoonsChannelList.findAll({
            attributes: ["id", "webtoons_channel_id", "title_id", "season_id"],
            where: {
              season_id: seasonValues.id,
              title_id: titleId,
              status: "active",
            },
          }),
        ]);

        // Watch On Details - read for webtoons
        let read_list = [];
        // Read List
        if (readDetails) {
          for (const eachRow of readDetails) {
            if (eachRow) {
              if (eachRow.type && eachRow.type == "read") {
                if (eachRow.ottServiceProvider) {
                  const provider_id = eachRow.ottServiceProvider.id
                    ? eachRow.ottServiceProvider.id
                    : "";
                  const element = {
                    id: eachRow.id ? eachRow.id : "",
                    title_id: seasonValues.id.title_id,
                    movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                    url: "",
                    type: "read",
                    provider_id: provider_id,
                    season_id: seasonValues.id,
                    episode_id: "",
                    status: "",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    updated_at: "",
                    created_by: userId,
                    updated_by: "",
                  };
                  read_list.push(element);
                }
              }
            }
          }
        }
        data.read_list_details = { list: read_list };
        // Get search keyword details
        let search_keyword = [];
        let news_search_keyword = [];
        if (keywords) {
          for (const eachValue of keywords) {
            if (eachValue && eachValue.keyword_type == "search") {
              const element = {
                id: eachValue.id,
                title_id: titleId,
                season_id: seasonValues.id,
                site_language: siteLanguage,
                keyword: eachValue.keyword,
                keyword_type: "search",
                status: "",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_at: "",
                created_by: userId,
                updated_by: "",
              };
              search_keyword.push(element);
            } else if (eachValue && eachValue.keyword_type == "news") {
              const element = {
                id: eachValue.id,
                title_id: titleId,
                season_id: seasonValues.id,
                site_language: siteLanguage,
                keyword: eachValue.keyword,
                keyword_type: "news",
                status: "",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_at: "",
                created_by: userId,
                updated_by: "",
              };
              news_search_keyword.push(element);
            }
          }
        }
        data.season_search_keyword_details = { list: search_keyword };
        data.season_news_search_keyword_details = { list: news_search_keyword };
        // Channel Details
        let channel_list = [];
        if (relatedChannelList) {
          for (const eachRow of relatedChannelList) {
            if (eachRow) {
              const element = {
                id: eachRow.id,
                title_id: titleId,
                url: "",
                webtoons_channel_id: eachRow.webtoons_channel_id,
                season_id: seasonValues.id,
                episode_id: "",
                site_language: siteLanguage,
                status: "",
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_at: "",
                created_by: userId,
                updated_by: "",
              };
              channel_list.push(element);
            }
          }
        }
        data.season_channel_details = { list: channel_list };
        data.season_id = seasonValues.id;
        data.created_at = await customDateTimeHelper.getCurrentDateTime();
        data.created_by = userId;

        // creating Season ID
        await model.titleRequestSeasonDetails.create(data);
      }

      const createdSeasonDetails = await model.titleRequestSeasonDetails.findAll({
        where: {
          request_id: requestId,
          status: "active",
        },
      });
      if (createdSeasonDetails) {
        for (const seasonValue of createdSeasonDetails) {
          const element = {
            draft_request_id: seasonValue.request_id,
            draft_season_id: seasonValue.id,
            season_id: seasonValue.season_id,
          };
          responseDetails.push(element);
        }
      }
    }
    return responseDetails;
  } catch (e) {
    console.log(e);
    return { responseDetails: [] };
  }
};
