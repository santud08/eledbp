import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { v4 as uuidv4 } from "uuid";

export const requestIdForAnotherLanguage = async (
  draftRequestId,
  newLanguage,
  alreadyRequestLanguage,
) => {
  try {
    let requiredFormat = {};
    let newTitleRequest = await model.titleRequestPrimaryDetails.findOne({
      where: {
        id: draftRequestId,
        site_language: alreadyRequestLanguage,
        request_status: "draft",
      },
    });

    const findRequest = await model.titleRequestPrimaryDetails.findOne({
      where: {
        relation_id: newTitleRequest.relation_id,
        site_language: newLanguage,
        request_status: "draft",
      },
    });
    if (!findRequest) {
      const element = {
        uuid: uuidv4(),
        relation_id: newTitleRequest.relation_id,
        name: newTitleRequest.name,
        title_id: newTitleRequest.title_id ? newTitleRequest.title_id : null,
        aka: newTitleRequest.aka ? newTitleRequest.aka : null,
        type: newTitleRequest.type,
        tmdb_vote_average: newTitleRequest.tmdb_vote_average
          ? newTitleRequest.tmdb_vote_average
          : null,
        release_date: newTitleRequest.release_date ? newTitleRequest.release_date : null,
        release_date_to: newTitleRequest.release_date_to ? newTitleRequest.release_date_to : null,
        year: newTitleRequest.year ? newTitleRequest.year : null,
        description: newTitleRequest.description ? newTitleRequest.description : null,
        runtime: newTitleRequest.runtime ? newTitleRequest.runtime : null,
        budget: newTitleRequest.budget ? newTitleRequest.budget : null,
        revenue: newTitleRequest.revenue ? newTitleRequest.revenue : null,
        imdb_id: newTitleRequest.imdb_id ? newTitleRequest.imdb_id : null,
        tmdb_id: newTitleRequest.tmdb_id ? newTitleRequest.tmdb_id : null,
        kobis_id: newTitleRequest.kobis_id ? newTitleRequest.kobis_id : null,
        tiving_id: newTitleRequest.tiving_id ? newTitleRequest.tiving_id : null,
        odk_id: newTitleRequest.odk_id ? newTitleRequest.odk_id : null,
        language: newTitleRequest.language ? newTitleRequest.language : null,
        original_title: newTitleRequest.original_title ? newTitleRequest.original_title : null,
        affiliate_link: newTitleRequest.affiliate_link ? newTitleRequest.affiliate_link : null,
        tmdb_vote_count: newTitleRequest.tmdb_vote_count ? newTitleRequest.tmdb_vote_count : null,
        certification: newTitleRequest.certification ? newTitleRequest.certification : null,
        local_vote_average: newTitleRequest.local_vote_average
          ? newTitleRequest.local_vote_average
          : null,
        is_rerelease: newTitleRequest.is_rerelease ? newTitleRequest.is_rerelease : 0,
        is_cookie: newTitleRequest.is_cookie ? newTitleRequest.is_cookie : null,
        cookie_num: newTitleRequest.cookie_num ? newTitleRequest.cookie_num : null,
        plot_summary: newTitleRequest.plot_summary ? newTitleRequest.plot_summary : null,
        synopsis: newTitleRequest.synopsis ? newTitleRequest.synopsis : null,
        format: newTitleRequest.format ? newTitleRequest.format : null,
        title_status: newTitleRequest.title_status ? newTitleRequest.title_status : null,
        footfalls: newTitleRequest.footfalls ? newTitleRequest.footfalls : null,
        rating: newTitleRequest.rating ? newTitleRequest.rating : null,
        record_status: newTitleRequest.record_status ? newTitleRequest.record_status : null,
        site_language: newLanguage,
        user_id: newTitleRequest.user_id ? newTitleRequest.user_id : null,
        request_status: "draft",
        status: "active",
        created_at: await customDateTimeHelper.getCurrentDateTime(),
        created_by: newTitleRequest.created_by ? newTitleRequest.created_by : null,
      };
      // 1.Search Keyword
      const searchKeywordDetails = newTitleRequest.search_keyword_details
        ? JSON.parse(newTitleRequest.search_keyword_details)
        : "";
      let search_keyword = [];
      if (searchKeywordDetails) {
        for (const searchKeyword of searchKeywordDetails.list) {
          if (searchKeyword) {
            const data = {
              id: "",
              title_id: "",
              site_language: newLanguage,
              keyword: searchKeyword.keyword,
              keyword_type: "search",
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: searchKeyword.created_by,
              updated_by: "",
            };
            search_keyword.push(data);
          }
        }
      }
      element.search_keyword_details = { list: search_keyword };
      // 2.Country Details
      let country_list = [];
      const countryDetails = newTitleRequest.country_details
        ? JSON.parse(newTitleRequest.country_details)
        : "";
      if (countryDetails) {
        for (const eachCountry of countryDetails.list) {
          if (eachCountry) {
            const data = {
              id: "",
              title_id: "",
              country_id: eachCountry.country_id,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: eachCountry.created_by,
              updated_by: "",
            };
            country_list.push(data);
          }
        }
      }
      element.country_details = { list: country_list };
      // 3.Original Work Details
      let original_work_list = [];
      const originalWorkDetails =
        newTitleRequest && newTitleRequest.original_work_details
          ? JSON.parse(newTitleRequest.original_work_details)
          : "";
      if (originalWorkDetails) {
        for (const originalWork of originalWorkDetails.list) {
          if (originalWork) {
            const data = {
              id: "",
              title_id: "",
              ow_type: originalWork.ow_type,
              ow_title: originalWork.ow_title,
              ow_original_artis: originalWork.ow_original_artis,
              site_language: newLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: originalWork.created_by,
              updated_by: "",
            };
            original_work_list.push(data);
          }
        }
      }
      element.original_work_details = { list: original_work_list };
      // 4. Connection Details
      let connection_list = [];
      const connectionDetails = newTitleRequest.connection_details
        ? JSON.parse(newTitleRequest.connection_details)
        : "";
      if (connectionDetails) {
        for (const connection of connectionDetails.list) {
          if (connection) {
            const data = {
              id: "",
              title_id: "",
              related_title_id: connection.related_title_id,
              site_language: newLanguage,
              season_id: "",
              episode_id: "",
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: connection.created_by,
              updated_by: "",
            };
            connection_list.push(data);
          }
        }
      }
      element.connection_details = { list: connection_list };
      //5.News Keyword Details
      let news_search_keyword = [];
      const newsKeywordDetails = newTitleRequest.news_keyword_details
        ? JSON.parse(newTitleRequest.news_keyword_details)
        : "";
      if (newsKeywordDetails) {
        for (const newsKeyword of newsKeywordDetails.list) {
          if (newsKeyword) {
            const data = {
              id: "",
              title_id: "",
              site_language: newLanguage,
              keyword: newsKeyword.keyword,
              keyword_type: "news",
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: newsKeyword.created_by,
              updated_by: "",
            };
            news_search_keyword.push(data);
          }
        }
      }
      element.news_keyword_details = { list: news_search_keyword };
      // 6. Re Release Details
      let re_release_list = [];
      const reReleaseDetails = newTitleRequest.re_release_details
        ? JSON.parse(newTitleRequest.re_release_details)
        : "";
      if (reReleaseDetails) {
        for (const releaseDate of reReleaseDetails.list) {
          if (releaseDate) {
            const data = {
              id: "",
              title_id: "",
              re_release_date: releaseDate.re_release_date,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: releaseDate.created_by,
              updated_at: "",
              updated_by: "",
            };
            re_release_list.push(data);
          }
        }
      }
      element.re_release_details = { list: re_release_list };

      // 7. Stream Details
      const streamDetails = newTitleRequest.watch_on_stream_details
        ? JSON.parse(newTitleRequest.watch_on_stream_details)
        : "";
      if (streamDetails) {
        element.watch_on_stream_details = streamDetails;
      } else {
        element.watch_on_stream_details = { list: [] };
      }

      //8.Rent Details
      const rentDetails = newTitleRequest.watch_on_rent_details
        ? JSON.parse(newTitleRequest.watch_on_rent_details)
        : "";
      if (rentDetails) {
        element.watch_on_rent_details = rentDetails;
      } else {
        element.watch_on_rent_details = { list: [] };
      }

      //9.Buy Details
      const buyDetails = newTitleRequest.watch_on_buy_details
        ? JSON.parse(newTitleRequest.watch_on_buy_details)
        : "";
      if (buyDetails) {
        element.watch_on_buy_details = buyDetails;
      } else {
        element.watch_on_buy_details = { list: [] };
      }

      //10.Series Details
      let series_list = [];
      const seriesDetails = newTitleRequest.series_details
        ? JSON.parse(newTitleRequest.series_details)
        : "";
      if (seriesDetails) {
        for (const series of seriesDetails.list) {
          if (series) {
            const data = {
              id: "",
              title_id: "",
              related_title_id: series.related_title_id,
              site_language: newLanguage,
              season_id: "",
              episode_id: "",
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: series.created_by,
              updated_by: "",
              tmdb_id: series.tmdb_id,
            };
            series_list.push(data);
          }
        }
      }
      element.series_details = { list: series_list };

      const createdRequest = await model.titleRequestPrimaryDetails.create(element);
      // generating the response data
      const findRequestId = await model.titleRequestPrimaryDetails.findOne({
        attributes: ["id", "relation_id", "user_id", "site_language"],
        where: {
          id: createdRequest.id,
          status: "active",
        },
      });
      requiredFormat.user_id = findRequestId.user_id;
      requiredFormat.draft_request_id = findRequestId.id;
      requiredFormat.draft_relation_id = findRequestId.relation_id;
      requiredFormat.draft_site_language = findRequestId.site_language;
    } else {
      requiredFormat.user_id = findRequest.user_id;
      requiredFormat.draft_request_id = findRequest.id;
      requiredFormat.draft_relation_id = findRequest.relation_id;
      requiredFormat.draft_site_language = findRequest.site_language;
    }
    return requiredFormat;
  } catch (error) {
    console.log(error);
  }
};
