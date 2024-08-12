import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { Op } from "sequelize";

export const createSeasonRequestId = async (
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
        "release_date_to",
        "poster",
        "number",
        "title_id",
        "episode_count",
        "site_language",
      ],
      where: {
        id: { [Op.ne]: seasonPkId },
        title_id: titleId,
        // site_language: siteLanguage,
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
        // Watch On Details
        let watch_on_stream_list = [];
        let watch_on_rent_list = [];
        let watch_on_buy_list = [];
        const watchOnDetails = await model.titleWatchOn.findAll({
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
        });
        if (watchOnDetails) {
          for (const eachRow of watchOnDetails) {
            if (eachRow) {
              if (eachRow.type && eachRow.type == "stream") {
                if (eachRow.ottServiceProvider) {
                  const provider_id = eachRow.ottServiceProvider.id
                    ? eachRow.ottServiceProvider.id
                    : "";
                  const element = {
                    id: eachRow.id ? eachRow.id : "",
                    title_id: seasonValues.id.title_id,
                    movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                    url: "",
                    type: "stream",
                    provider_id: provider_id,
                    season_id: seasonValues.id,
                    episode_id: "",
                    status: "",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    updated_at: "",
                    created_by: userId,
                    updated_by: "",
                  };
                  watch_on_stream_list.push(element);
                }
              }
              if (eachRow.type && eachRow.type == "rent") {
                if (eachRow.ottServiceProvider) {
                  const provider_id = eachRow.ottServiceProvider.id
                    ? eachRow.ottServiceProvider.id
                    : "";
                  const element = {
                    id: eachRow.id ? eachRow.id : "",
                    title_id: seasonValues.id.title_id,
                    movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                    url: "",
                    type: "rent",
                    provider_id: provider_id,
                    season_id: seasonValues.id,
                    episode_id: "",
                    status: "",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    updated_at: "",
                    created_by: userId,
                    updated_by: "",
                  };
                  watch_on_rent_list.push(element);
                }
              }
              if (eachRow.type && eachRow.type == "buy") {
                if (eachRow.ottServiceProvider) {
                  const provider_id = eachRow.ottServiceProvider.id
                    ? eachRow.ottServiceProvider.id
                    : "";
                  const element = {
                    id: eachRow.id ? eachRow.id : "",
                    title_id: seasonValues.id.title_id,
                    movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                    url: "",
                    type: "buy",
                    provider_id: provider_id,
                    season_id: seasonValues.id,
                    episode_id: "",
                    status: "",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    updated_at: "",
                    created_by: userId,
                    updated_by: "",
                  };
                  watch_on_buy_list.push(element);
                }
              }
            }
          }
        }
        data.season_watch_on_stream_details = { list: watch_on_stream_list };
        data.season_watch_on_rent_details = { list: watch_on_rent_list };
        data.season_watch_on_buy_details = { list: watch_on_buy_list };
        // Get search keyword details
        let search_keyword = [];
        let news_search_keyword = [];
        const keywords = await model.titleKeyword.findAll({
          where: {
            title_id: titleId,
            season_id: seasonValues.id,
            status: "active",
          },
          attributes: ["id", "keyword", "keyword_type", "season_id"],
        });
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
        let relatedChannelList = await model.titleChannelList.findAll({
          attributes: ["id", "tv_network_id", "title_id", "season_id"],
          where: {
            season_id: seasonValues.id,
            title_id: titleId,
            status: "active",
          },
        });
        if (relatedChannelList) {
          for (const eachRow of relatedChannelList) {
            if (eachRow) {
              const element = {
                id: eachRow.id,
                title_id: titleId,
                url: "",
                tv_network_id: eachRow.tv_network_id,
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
