import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { v4 as uuidv4 } from "uuid";
import { fn, col } from "sequelize";
import { envs } from "../../config/index.js";

export const createRequestIdForMovie = async (
  titleId,
  userId,
  siteLanguage,
  titleType,
  requestId,
) => {
  try {
    let titleDetails = {};
    let requestData = {};
    let responseDetails = [];
    //get title information
    let dbTitleInformation = await model.title.findOne({
      attributes: [
        "id",
        "imdb_id",
        "tmdb_id",
        "tiving_id",
        "kobis_id",
        "is_rerelease",
        "affiliate_link",
        "certification",
        "footfalls",
        "runtime",
        "tmdb_vote_average",
        "tmdb_vote_count",
        "popularity",
        "language",
        "title_status",
        "release_date",
      ],
      include: [
        {
          model: model.titleTranslation,
          attributes: ["name", "aka", "plot_summary", "description"],
          left: true,
          where: { status: "active", site_language: siteLanguage },
        },
      ],
      where: {
        id: titleId,
        record_status: "active",
        type: titleType,
      },
    });
    let dbTitleLangInformation = await model.title.findOne({
      attributes: ["id"],
      include: [
        {
          model: model.titleTranslation,
          attributes: ["aka"],
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
    if (dbTitleInformation && dbTitleInformation.titleTranslations.length > 0) {
      titleDetails.name = dbTitleInformation.titleTranslations[0].name
        ? dbTitleInformation.titleTranslations[0].name
        : "";
      titleDetails.aka = dbTitleLangInformation.titleTranslations[0].aka
        ? dbTitleLangInformation.titleTranslations[0].aka
        : "";
      titleDetails.plot_summary = dbTitleInformation.titleTranslations[0].plot_summary
        ? dbTitleInformation.titleTranslations[0].plot_summary
        : "";
      titleDetails.description = dbTitleInformation.titleTranslations[0].description
        ? dbTitleInformation.titleTranslations[0].description
        : "";
    }
    // Get search  and news search keyword details
    const keywords = await model.titleKeyword.findAll({
      where: {
        title_id: titleId,
        status: "active",
      },
      attributes: ["id", "keyword", "keyword_type"],
    });
    let search_keyword = [];
    let news_search_keyword = [];
    if (keywords) {
      for (const eachValue of keywords) {
        if (eachValue && eachValue.keyword_type == "search") {
          const element = {
            id: eachValue.id,
            title_id: titleId,
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
    // Get Re-release details
    let re_release_list = [];
    const reReleaseDate = await model.titleReRelease.findAll({
      where: { title_id: titleId, status: "active" },
      attributes: ["id", "re_release_date"],
    });
    if (reReleaseDate) {
      for (const value of reReleaseDate) {
        if (value) {
          const element = {
            id: value.id,
            title_id: titleId,
            re_release_date: value.re_release_date,
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: userId,
            updated_at: "",
            updated_by: "",
          };
          re_release_list.push(element);
        }
      }
    }
    // Get country details
    let country_list = [];
    const getCountry = await model.titleCountries.findAll({
      attributes: ["id", "title_id", "country_id"],
      where: { title_id: titleId, status: "active" },
      include: [
        {
          model: model.country,
          left: true,
          attributes: ["id", "country_name"],
          where: { status: "active" },
          required: true,
          include: {
            model: model.countryTranslation,
            attributes: ["country_id", "country_name", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
          },
        },
      ],
    });
    if (getCountry) {
      for (const eachRow of getCountry) {
        if (eachRow) {
          const id = eachRow.id ? eachRow.id : "";
          if (eachRow.country && eachRow.country.countryTranslations.length > 0) {
            const countryId = eachRow.country.countryTranslations[0].country_id
              ? eachRow.country.countryTranslations[0].country_id
              : "";
            const element = {
              id: id,
              title_id: titleId,
              country_id: countryId,
              site_language: siteLanguage,
              status: "",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              updated_at: "",
              created_by: userId,
              updated_by: "",
            };
            country_list.push(element);
          }
        }
      }
    }
    // Get Original By
    let original_work_list = [];
    const getOriginalBy = await model.originalWorks.findAll({
      attributes: ["id", "title_id", "ow_type", "ow_title", "ow_original_artis"],
      where: { title_id: titleId, status: "active", site_language: siteLanguage },
    });
    if (getOriginalBy) {
      for (const eachRow of getOriginalBy) {
        if (eachRow) {
          const id = eachRow.id ? eachRow.id : "";
          const type = eachRow.ow_type ? eachRow.ow_type : "";
          const title = eachRow.ow_title ? eachRow.ow_title : "";
          const artis = eachRow.ow_original_artis ? eachRow.ow_original_artis : "";
          const element = {
            id: id,
            title_id: titleId,
            ow_type: type,
            ow_title: title,
            ow_original_artis: artis,
            site_language: siteLanguage,
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          original_work_list.push(element);
        }
      }
    }
    // Watch On Details
    let watch_on_stream_list = [];
    let watch_on_rent_list = [];
    let watch_on_buy_list = [];
    const watchOnDetails = await model.titleWatchOn.findAll({
      attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
      where: { title_id: titleId, status: "active" },
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
              const id = eachRow.id ? eachRow.id : "";
              const provider_id = eachRow.ottServiceProvider.id
                ? eachRow.ottServiceProvider.id
                : "";
              const movie_id = eachRow.movie_id ? eachRow.movie_id : "";
              const element = {
                id: id,
                title_id: titleId,
                movie_id: movie_id,
                url: "",
                type: "stream",
                provider_id: provider_id,
                season_id: "",
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
              const id = eachRow.id ? eachRow.id : "";
              const provider_id = eachRow.ottServiceProvider.id
                ? eachRow.ottServiceProvider.id
                : "";
              const movie_id = eachRow.movie_id ? eachRow.movie_id : "";
              const element = {
                id: id,
                title_id: titleId,
                movie_id: movie_id,
                url: "",
                type: "rent",
                provider_id: provider_id,
                season_id: "",
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
              const id = eachRow.id ? eachRow.id : "";
              const provider_id = eachRow.ottServiceProvider.id
                ? eachRow.ottServiceProvider.id
                : "";
              const movie_id = eachRow.movie_id ? eachRow.movie_id : "";
              const element = {
                id: id,
                title_id: titleId,
                movie_id: movie_id,
                url: "",
                type: "buy",
                provider_id: provider_id,
                season_id: "",
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

    // connection Details
    let connection_list = [];
    let relatedTitleList = await model.relatedTitle.findAll({
      attributes: ["id", "related_title_id", "title_id"],
      where: { title_id: titleId, status: "active" },
      include: [
        {
          model: model.title,
          attributes: ["id", "record_status"],
          left: true,
          where: { record_status: "active" },
          required: true,
          include: [
            {
              model: model.titleTranslation,
              left: true,
              attributes: ["title_id", "name", "site_language"],
              where: { status: "active" },
              separate: true,
              order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
            },
          ],
        },
      ],
    });
    if (relatedTitleList) {
      for (const eachRow of relatedTitleList) {
        if (eachRow) {
          const id = eachRow.id ? eachRow.id : "";
          const title_id =
            eachRow.title &&
            eachRow.title.titleTranslations.length > 0 &&
            eachRow.title.titleTranslations[0].title_id
              ? eachRow.title.titleTranslations[0].title_id
              : "";
          const element = {
            id: id,
            title_id: titleId,
            related_title_id: title_id,
            site_language: siteLanguage,
            season_id: "",
            episode_id: "",
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          connection_list.push(element);
        }
      }
    }

    // Series Details
    let series_list = [];
    let relatedSeriesTitleList = await model.relatedSeriesTitle.findAll({
      attributes: ["id", "related_series_title_id", "title_id"],
      where: { title_id: titleId, status: "active" },
      include: [
        {
          model: model.title,
          attributes: ["id", "record_status"],
          left: true,
          where: { record_status: "active" },
          required: true,
          include: [
            {
              model: model.titleTranslation,
              left: true,
              attributes: ["title_id", "name", "site_language"],
              where: { status: "active" },
              separate: true,
              order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
            },
            {
              model: model.titleImage,
              attributes: [
                "title_id",
                "original_name",
                "file_name",
                "url",
                [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
              ],
              left: true,
              where: {
                status: "active",
                image_category: "poster_image",
                is_main_poster: "y",
              },
              required: false,
              separate: true,
              order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
            },
          ],
        },
      ],
    });
    if (relatedSeriesTitleList) {
      for (const eachRow of relatedSeriesTitleList) {
        if (eachRow) {
          const id = eachRow.id ? eachRow.id : "";
          const title_id =
            eachRow.title &&
            eachRow.title.titleTranslations.length > 0 &&
            eachRow.title.titleTranslations[0].title_id
              ? eachRow.title.titleTranslations[0].title_id
              : "";
          const element = {
            id: id,
            title_id: titleId,
            related_title_id: title_id,
            site_language: siteLanguage,
            season_id: "",
            episode_id: "",
            status: "",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          series_list.push(element);
        }
      }
    }

    requestData.user_id = userId;
    requestData.title_id = titleId;
    requestData.tmdb_id =
      dbTitleInformation && dbTitleInformation.tmdb_id ? dbTitleInformation.tmdb_id : null;
    requestData.kobis_id =
      dbTitleInformation && dbTitleInformation.kobis_id ? dbTitleInformation.kobis_id : null;
    requestData.tiving_id =
      dbTitleInformation && dbTitleInformation.tiving_id ? dbTitleInformation.tiving_id : null;
    requestData.imdb_id =
      dbTitleInformation && dbTitleInformation.imdb_id ? dbTitleInformation.imdb_id : null;
    requestData.type = "movie";
    requestData.name = titleDetails.name ? titleDetails.name : "";
    requestData.aka = titleDetails.aka ? titleDetails.aka : null;
    requestData.description = titleDetails.description ? titleDetails.description : null;
    requestData.plot_summary = titleDetails.plot_summary ? titleDetails.plot_summary : null;
    requestData.site_language = siteLanguage;
    requestData.affiliate_link =
      dbTitleInformation && dbTitleInformation.affiliate_link
        ? dbTitleInformation.affiliate_link
        : null;
    requestData.release_date =
      dbTitleInformation && dbTitleInformation.release_date
        ? dbTitleInformation.release_date
        : null;
    requestData.title_status =
      dbTitleInformation && dbTitleInformation.title_status
        ? dbTitleInformation.title_status
        : null;
    requestData.is_rerelease =
      dbTitleInformation && dbTitleInformation.is_rerelease ? dbTitleInformation.is_rerelease : 0;
    requestData.runtime =
      dbTitleInformation && dbTitleInformation.runtime ? dbTitleInformation.runtime : null;
    requestData.footfalls =
      dbTitleInformation && dbTitleInformation.footfalls ? dbTitleInformation.footfalls : null;
    requestData.certification =
      dbTitleInformation && dbTitleInformation.certification
        ? dbTitleInformation.certification
        : null;
    requestData.language =
      dbTitleInformation && dbTitleInformation.language ? dbTitleInformation.language : null;
    requestData.tmdb_vote_average =
      dbTitleInformation && dbTitleInformation.tmdb_vote_average
        ? dbTitleInformation.tmdb_vote_average
        : null;
    requestData.tmdb_vote_count =
      dbTitleInformation && dbTitleInformation.tmdb_vote_count
        ? dbTitleInformation.tmdb_vote_count
        : null;
    requestData.popularity =
      dbTitleInformation && dbTitleInformation.popularity ? dbTitleInformation.popularity : null;
    requestData.watch_on_stream_details = { list: watch_on_stream_list };
    requestData.watch_on_rent_details = { list: watch_on_rent_list };
    requestData.watch_on_buy_details = { list: watch_on_buy_list };
    requestData.original_work_details = { list: original_work_list };
    requestData.country_details = { list: country_list };
    requestData.re_release_details = { list: re_release_list };
    requestData.search_keyword_details = { list: search_keyword };
    requestData.news_keyword_details = { list: news_search_keyword };
    requestData.connection_details = { list: connection_list };
    requestData.series_details = { list: series_list };

    if (requestId && requestId != "") {
      // creating request for different language
      requestData.created_at = await customDateTimeHelper.getCurrentDateTime();
      requestData.created_by = userId;
      requestData.uuid = uuidv4();
      requestData.relation_id = requestId;
      await model.titleRequestPrimaryDetails.create(requestData);
      const findRequestId = await model.titleRequestPrimaryDetails.findAll({
        attributes: ["id", "relation_id", "user_id", "site_language", "title_id"],
        where: { relation_id: requestId },
      });
      for (let element of findRequestId) {
        let requiredFormat = {
          user_id: element.user_id,
          title_id: element.title_id,
          draft_request_id: element.id,
          draft_relation_id: element.relation_id,
          draft_site_language: element.site_language,
        };
        responseDetails.push(requiredFormat);
      }
    } else {
      // Creating Request ID for the first time
      requestData.created_at = await customDateTimeHelper.getCurrentDateTime();
      requestData.created_by = userId;
      requestData.uuid = uuidv4();

      // generating relation Id for the first time

      const createdRequest = await model.titleRequestPrimaryDetails.create(requestData);

      // updating the relation_id with respect to request_id
      requestData.relation_id = createdRequest.id;

      await model.titleRequestPrimaryDetails.update(requestData, {
        where: { id: createdRequest.id, status: "active" },
      });
      // creating response
      const findRequestId = await model.titleRequestPrimaryDetails.findAll({
        attributes: ["id", "relation_id", "user_id", "site_language", "title_id"],
        where: { id: createdRequest.id, status: "active" },
      });

      for (let element of findRequestId) {
        let requiredFormat = {
          user_id: element.user_id,
          title_id: element.title_id,
          draft_request_id: element.id,
          draft_relation_id: element.relation_id,
          draft_site_language: element.site_language,
        };
        responseDetails.push(requiredFormat);
      }
    }
    return responseDetails;
  } catch (error) {
    console.log(error);
    return { responseDetails: [] };
  }
};
