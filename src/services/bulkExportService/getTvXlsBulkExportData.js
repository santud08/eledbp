import model from "../../models/index.js";
import { paginationService } from "../../services/index.js";
import { Sequelize, Op } from "sequelize";
import { generalHelper } from "../../helpers/index.js";

export const getTvXlsBulkExportData = async (id = null, lan, type) => {
  try {
    let language = lan ? lan : "ko";
    let keyWordDetails = [];
    let countryDetails = [];
    let originalDetails = [];
    let connectionDetails = [];
    let getSeasonList = [];
    let getChannelList = [];
    let getTagDetails = [];
    let seasonData = [];
    let tagResult = [];
    let genreResponseDetails = [];
    let tagResponseDetails = [];
    let watchRecord = [];
    let totalEpisodeDetails = [];
    let videoRecord = [];
    let imageRecord = [];
    let creditRecord = [];

    if (type === "basic") {
      let enName = "";
      let enAka = "";
      let enSummary = "";
      let koName = "";
      let koAka = "";
      let koSummary = "";
      const getTitleDetails = await model.title.findOne({
        attributes: [
          "id",
          "imdb_id",
          "tmdb_id",
          "kobis_id",
          "odk_id",
          "tiving_id",
          "release_date",
          "release_date_to",
          "footfalls",
          "rating",
          "certification",
          "language",
          "runtime",
          "affiliate_link",
          "title_status",
          "is_rerelease",
        ],
        where: { id: id, record_status: "active" },
      });
      const getPrimaryDetails = await model.titleTranslation.findAll({
        attributes: ["name", "title_id", "aka", ["description", "summary"], "site_language"],
        where: { title_id: id, status: "active" },
      });
      if (getPrimaryDetails) {
        for (const eachRow of getPrimaryDetails) {
          if (eachRow) {
            if (eachRow.dataValues.site_language == "en") {
              enName = eachRow.dataValues.name ? eachRow.dataValues.name : "";
              enAka = eachRow.dataValues.aka ? eachRow.dataValues.aka : "";
              enSummary = eachRow.dataValues.summary ? eachRow.dataValues.summary : "";
            }
            if (eachRow.dataValues.site_language == "ko") {
              koName = eachRow.dataValues.name ? eachRow.dataValues.name : "";
              koAka = eachRow.dataValues.aka ? eachRow.dataValues.aka : "";
              koSummary = eachRow.dataValues.summary ? eachRow.dataValues.summary : "";
            }
          }
        }
      }
      // Get Country List
      const countryList = await model.titleCountries.findAll({
        attributes: ["country_id", "site_language"],
        where: { title_id: id, status: "active" },
        group: ["titleCountries.country_id"],
      });

      // Check Country details exist or not
      if (countryList) {
        for (const eachRow of countryList) {
          if (eachRow) {
            // Get details of country
            const getCountry = await model.country.findOne({
              attributes: ["id"],
              where: { id: eachRow.dataValues.country_id, status: "active" },
              include: [
                {
                  model: model.countryTranslation,
                  attributes: ["country_id", "country_name", "site_language"],
                  left: true,
                  where: { status: "active" },
                  required: true,
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
              ],
            });

            countryDetails.push(
              getCountry && getCountry.countryTranslations[0]
                ? getCountry.countryTranslations[0].dataValues.country_name
                : "",
            );
          }
        }
      }

      const getSearchKeywordDetails = await model.titleKeyword.findAll({
        attributes: ["id", "keyword", "site_language"],
        where: { title_id: id, season_id: null, keyword_type: "search", status: "active" },
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });
      if (getSearchKeywordDetails) {
        for (const eachRow of getSearchKeywordDetails) {
          if (eachRow) {
            keyWordDetails.push(eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "");
          }
        }
      }

      return {
        type: "tv",
        id: id,
        imdb_id: getTitleDetails.imdb_id,
        tiving_id: getTitleDetails.tiving_id,
        tmdb_id: getTitleDetails.tmdb_id,
        kobis_id: getTitleDetails.kobis_id,
        odk_id: getTitleDetails.odk_id,
        name_en: enName || "",
        name_ko: koName || "",
        aka: koAka || enAka || "",
        summary_en: enSummary || "",
        summary_ko: koSummary || "",
        official_site: getTitleDetails.affiliate_link,
        status: getTitleDetails.title_status,
        release_date: getTitleDetails.release_date,
        release_date_to: getTitleDetails.release_date_to,
        rating: getTitleDetails.rating,
        runtime: getTitleDetails.runtime,
        footfalls: getTitleDetails.footfalls,
        certification: getTitleDetails.certification,
        language: getTitleDetails.language,
        country: countryDetails.join(",") || "",
        search_keywords: keyWordDetails.join(",") || "",
      };
    }

    if (type === "original_work") {
      const getOriginalWork = await model.originalWorks.findAll({
        attributes: ["id", "title_id", "ow_type", "ow_title", "ow_original_artis", "site_language"],
        where: { title_id: id, status: "active" },
      });
      if (getOriginalWork) {
        for (const eachRow of getOriginalWork) {
          if (eachRow) {
            const record = {
              id: id,
              type: eachRow.dataValues.ow_type ? eachRow.dataValues.ow_type : "",
              original_title: eachRow.dataValues.ow_title ? eachRow.dataValues.ow_title : "",
              original_artist: eachRow.dataValues.ow_original_artis
                ? eachRow.dataValues.ow_original_artis
                : "",
              site_language: eachRow.dataValues.site_language
                ? eachRow.dataValues.site_language
                : "",
            };
            originalDetails.push(record);
          }
        }
      }
      return originalDetails;
    }

    // Get Connection details
    if (type === "connection") {
      const getConnectionDetails = await model.relatedTitle.findAll({
        attributes: ["id", "title_id", "related_title_id", "site_language"],
        where: { title_id: id, status: "active" },
      });
      if (getConnectionDetails) {
        for (const eachRow of getConnectionDetails) {
          if (eachRow) {
            // Get details of connection
            const getConnection = await model.title.findOne({
              attributes: ["id"],
              where: { id: eachRow.dataValues.related_title_id, record_status: "active" },
              include: [
                {
                  model: model.titleTranslation,
                  attributes: ["name"],
                  left: true,
                  where: { status: "active" },
                  required: true,
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
                {
                  model: model.titleImage,
                  attributes: ["path"],
                  left: true,
                  where: {
                    status: "active",
                    image_category: "poster_image",
                    is_main_poster: "y",
                  },
                  required: false,
                  order: [["id", "DESC"]],
                },
              ],
            });
            const record = {
              id: id,
              connection_title_id: eachRow.dataValues.related_title_id,
              name:
                getConnection && getConnection.dataValues.titleTranslations[0]
                  ? getConnection.dataValues.titleTranslations[0].dataValues.name
                  : "",
              image:
                getConnection && getConnection.dataValues.titleImages[0]
                  ? getConnection.dataValues.titleImages[0].dataValues.path
                  : "",
            };
            connectionDetails.push(record);
          }
        }
      }
      return connectionDetails;
    }

    // Get season list
    getSeasonList = await model.season.findAll({
      attributes: ["id", "release_date", "number", "poster", "episode_count"],
      where: { title_id: id, status: "active" },
    });
    if (type === "season") {
      if (getSeasonList) {
        for (const eachRow of getSeasonList) {
          if (eachRow) {
            const seasonId = eachRow.dataValues.id;

            // Get season details for english
            const getEnSeasonDetails = await model.seasonTranslation.findOne({
              attributes: ["season_name", "summary", "aka"],
              where: { season_id: seasonId, site_language: "en", status: "active" },
            });
            // Get season details for english
            const getKoSeasonDetails = await model.seasonTranslation.findOne({
              attributes: ["season_name", "summary", "aka"],
              where: { season_id: seasonId, site_language: "ko", status: "active" },
            });
            getChannelList = await model.titleChannelList.findAll({
              attributes: [
                [
                  Sequelize.fn("IFNULL", Sequelize.col("tvNetworkOne.network_name"), ""),
                  "network_name",
                ],
              ],
              include: [
                {
                  model: model.tvNetworks,
                  as: "tvNetworkOne",
                  attributes: [],
                  left: true,
                  where: {
                    status: { [Op.ne]: "deleted" },
                  },
                  required: true,
                },
              ],
              where: {
                season_id: seasonId,
                title_id: id,
                status: "active",
              },
            });

            let channels = [];
            if (getChannelList) {
              for (const eachRow of getChannelList) {
                if (eachRow) {
                  channels.push(
                    eachRow.dataValues.network_name ? eachRow.dataValues.network_name : "",
                  );
                }
              }
            }

            // Get search keyword details
            const getSeasonSearchKeywordDetails = await model.titleKeyword.findAll({
              attributes: ["id", "keyword", "site_language"],
              where: {
                title_id: id,
                season_id: seasonId,
                keyword_type: "search",
                status: "active",
              },
            });

            // Check Search Keyword details exist or not
            let seasonKeywordDetails = [];
            if (getSeasonSearchKeywordDetails) {
              for (const eachRow of getSeasonSearchKeywordDetails) {
                if (eachRow) {
                  seasonKeywordDetails.push(
                    eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "",
                  );
                }
              }
            }

            // Get news search keyword details
            const getSeasonNewsSearchKeywordDetails = await model.titleKeyword.findAll({
              attributes: ["id", "keyword", "site_language"],
              where: { title_id: id, season_id: seasonId, keyword_type: "news", status: "active" },
            });

            // check News Search Keyword details exist or not
            let newsSeasonKeywordDetails = [];
            if (getSeasonNewsSearchKeywordDetails) {
              for (const eachRow of getSeasonNewsSearchKeywordDetails) {
                if (eachRow) {
                  newsSeasonKeywordDetails.push(
                    eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "",
                  );
                }
              }
            }
            seasonData.push({
              id: id,
              season_id: seasonId,
              season_number: eachRow.dataValues.number
                ? eachRow.dataValues.number
                : eachRow.dataValues.number == 0
                ? 0
                : "",
              season_name_en:
                getEnSeasonDetails && getEnSeasonDetails.season_name
                  ? getEnSeasonDetails.season_name
                  : "",
              season_name_ko:
                getKoSeasonDetails && getKoSeasonDetails.season_name
                  ? getKoSeasonDetails.season_name
                  : "",
              aka:
                getKoSeasonDetails && getKoSeasonDetails.aka
                  ? getKoSeasonDetails.aka
                  : getEnSeasonDetails && getEnSeasonDetails.aka
                  ? getEnSeasonDetails.aka
                  : "",
              summary_en:
                getEnSeasonDetails && getEnSeasonDetails.summary ? getEnSeasonDetails.summary : "",
              summary_ko:
                getKoSeasonDetails && getKoSeasonDetails.summary ? getKoSeasonDetails.summary : "",
              release_date: eachRow.dataValues.release_date,
              episode_count: eachRow.dataValues.episode_count,
              season_keyword: seasonKeywordDetails.join(",") || "",
              news_season_keyword: newsSeasonKeywordDetails.join(",") || "",
              poster_image: eachRow.dataValues.poster ? eachRow.dataValues.poster : "",
              channels: channels.join(",") || "",
            });
          }
        }
      }
      return seasonData;
    }

    // Get season related data(Watch,Episode,Media,credit)

    // Get watch
    if (getSeasonList && type === "watch") {
      for (const eachRow of getSeasonList) {
        if (eachRow) {
          const seasonId = eachRow.dataValues.id;
          const getDetails = await model.titleTranslation.findAll({
            attributes: ["name", "site_language"],
            where: {
              title_id: id,
              status: "active",
            },
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          });

          const movieName =
            getDetails && getDetails[0].dataValues.name ? getDetails[0].dataValues.name : "";
          // Get Watch details
          const getWatchDetails = await model.titleWatchOn.findAll({
            attributes: ["title_id", "movie_id", "type", "provider_id"],
            where: { title_id: id, season_id: seasonId, status: "active" },
            include: [
              {
                model: model.ottServiceProvider,
                left: true,
                attributes: ["id", "ott_name", "provider_url", "logo_path"],
                where: { status: "active" },
              },
            ],
          });

          if (getWatchDetails) {
            for (const eachRow of getWatchDetails) {
              if (eachRow) {
                const watchType =
                  eachRow.type == "rent" ? "Rent" : eachRow.type == "buy" ? "Buy" : "Watch";

                watchRecord.push({
                  title_id: eachRow.title_id ? eachRow.title_id : "",
                  season_id: seasonId,
                  provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
                  movie_id: eachRow.movie_id ? eachRow.movie_id : "",
                  privider_name: eachRow.ottServiceProvider.ott_name
                    ? eachRow.ottServiceProvider.ott_name
                    : "",
                  url: eachRow.ottServiceProvider.provider_url
                    ? await generalHelper.generateOttUrl(eachRow.ottServiceProvider.provider_url, {
                        search_params_values: { ID: eachRow.movie_id, title: movieName },
                        type: "movie",
                      })
                    : "",
                  icon: eachRow.ottServiceProvider.logo_path,
                  watch_type: watchType,
                });
              }
            }
          }
        }
      }
      return watchRecord;
    }

    // Get Episode details
    if (getSeasonList && type === "episode") {
      for (const eachRow of getSeasonList) {
        if (eachRow) {
          const seasonId = eachRow.dataValues.id;
          const getEpisodeDetails = await model.episode.findAll({
            attributes: [
              "id",
              "episode_number",
              ["release_date", "episode_date"],
              ["poster", "episode_image"],
            ],
            where: {
              title_id: id,
              season_id: seasonId,
              status: "active",
            },
          });

          // Get Episode data details
          if (getEpisodeDetails) {
            for (const eachRow of getEpisodeDetails) {
              if (eachRow) {
                const episodeId = eachRow.dataValues.id;
                // Get english details
                const getEnEpisode = await model.episodeTranslation.findOne({
                  attributes: ["name", "description"],
                  where: { episode_id: episodeId, site_language: "en", status: "active" },
                });
                // Get korean details
                const getKoEpisode = await model.episodeTranslation.findOne({
                  attributes: ["name", "description"],
                  where: { episode_id: episodeId, site_language: "ko", status: "active" },
                });
                const enEpisodeName =
                  getEnEpisode && getEnEpisode.dataValues.description
                    ? getEnEpisode.dataValues.name
                    : "";
                const koEpisodeName =
                  getKoEpisode && getKoEpisode.dataValues.name ? getKoEpisode.dataValues.name : "";
                const enEpisodeDescription =
                  getEnEpisode && getEnEpisode.dataValues.description
                    ? getEnEpisode.dataValues.description
                    : "";
                const koEpisodeDescription =
                  getKoEpisode && getKoEpisode.dataValues.name
                    ? getKoEpisode.dataValues.description
                    : "";

                const record = {
                  title_id: id,
                  season_id: seasonId,
                  id: episodeId,
                  episode_title_en: enEpisodeName,
                  episode_title_ko: koEpisodeName,
                  episode_summary_en: enEpisodeDescription,
                  episode_summary_ko: koEpisodeDescription,
                  episode_number: eachRow.dataValues.episode_number,
                  episode_date: eachRow.dataValues.episode_date,
                  episode_image: eachRow.dataValues.episode_image,
                };
                totalEpisodeDetails.push(record);
              }
            }
          }
        }
      }
      return totalEpisodeDetails;
    }

    // Get video details
    if (getSeasonList && type == "video") {
      for (const eachRow of getSeasonList) {
        if (eachRow) {
          const seasonId = eachRow.dataValues.id;
          const getVideoDetails = await model.video.findAll({
            attributes: [
              "title_id",
              ["name", "video_title"],
              ["url", "video_url"],
              "is_official_trailer",
            ],
            where: {
              title_id: id,
              season: seasonId,
              status: "active",
              video_for: "title",
            },
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          });

          if (getVideoDetails) {
            for (const eachRow of getVideoDetails) {
              if (eachRow) {
                videoRecord.push({
                  title_id: eachRow.dataValues.title_id ? eachRow.dataValues.title_id : "",
                  season_id: seasonId,
                  video_title: eachRow.dataValues.video_title ? eachRow.dataValues.video_title : "",
                  video_url: eachRow.dataValues.video_url ? eachRow.dataValues.video_url : "",
                  is_official_trailer: eachRow.dataValues.is_official_trailer
                    ? eachRow.dataValues.is_official_trailer
                    : "",
                });
              }
            }
          }
        }
      }
      return videoRecord;
    }

    // Get image details
    // Get video details
    if (getSeasonList && type == "image") {
      for (const eachRow of getSeasonList) {
        if (eachRow) {
          const seasonId = eachRow.dataValues.id;
          const getImageDetails = await model.titleImage.findAll({
            attributes: [
              "title_id",
              "original_name",
              "file_name",
              "path",
              "file_size",
              "mime_type",
              "image_category",
            ],
            where: {
              title_id: id,
              season_id: seasonId,
              status: "active",
              episode_id: null,
            },
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          });

          if (getImageDetails) {
            for (const eachRow of getImageDetails) {
              if (eachRow) {
                imageRecord.push({
                  title_id: eachRow.dataValues.title_id ? eachRow.dataValues.title_id : "",
                  season_id: seasonId,
                  original_name: eachRow.dataValues.original_name
                    ? eachRow.dataValues.original_name
                    : "",
                  file_name: eachRow.dataValues.file_name ? eachRow.dataValues.file_name : "",
                  path: eachRow.dataValues.path ? eachRow.dataValues.path : "",
                  file_size: eachRow.dataValues.file_size ? eachRow.dataValues.file_size : "",
                  mime_type: eachRow.dataValues.mime_type ? eachRow.dataValues.mime_type : "",
                  image_category: eachRow.dataValues.image_category
                    ? eachRow.dataValues.image_category
                    : "",
                });
              }
            }
          }
        }
      }
      return imageRecord;
    }
    if (getSeasonList && type == "credit") {
      for (const eachRow of getSeasonList) {
        if (eachRow) {
          const seasonId = eachRow.dataValues.id;
          const getCreditDetails = await model.creditable.findAll({
            attributes: [
              "people_id",
              "creditable_id",
              "department",
              "character_name",
              "job",
              "is_guest",
            ],
            where: {
              creditable_id: id,
              season_id: seasonId,
              status: "active",
              creditable_type: "title",
            },
            include: [
              {
                model: model.people,
                left: true,
                attributes: ["kobis_id", "tmdb_id"],
                where: { status: "active" },
                required: true,
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["name", "site_language"],
                    left: true,
                    where: { status: "active" },
                    required: true,
                  },
                ],
              },
            ],
            order: [
              [
                model.people,
                model.peopleTranslation,
                "site_language",
                language == "ko" ? "DESC" : "ASC",
              ],
            ],
          });

          if (getCreditDetails) {
            for (const eachRow of getCreditDetails) {
              if (eachRow) {
                const peopleId = eachRow.dataValues.people_id;
                // Get people image
                const getPeopleImage = await model.peopleImages.findOne({
                  attributes: ["path"],
                  where: {
                    people_id: peopleId,
                    image_category: "poster_image",
                    is_main_poster: "y",
                    status: "active",
                  },
                  separate: true, //get the recently added image
                  order: [
                    ["site_language", language == "ko" ? "DESC" : "ASC"],
                    ["id", "desc"],
                  ],
                });

                creditRecord.push({
                  title_id: eachRow.dataValues.creditable_id
                    ? eachRow.dataValues.creditable_id
                    : "",
                  season_id: seasonId,
                  department: eachRow.dataValues.department ? eachRow.dataValues.department : "",
                  people_id: peopleId,
                  people_name:
                    eachRow.person &&
                    eachRow.person.peopleTranslations[0] &&
                    eachRow.person.peopleTranslations[0].name
                      ? eachRow.person.peopleTranslations[0].name
                      : "",
                  character_name: eachRow.dataValues.character_name,
                  job: eachRow.dataValues.job,
                  is_guest: eachRow.dataValues.is_guest,
                  poster:
                    getPeopleImage && getPeopleImage.dataValues.path
                      ? getPeopleImage.dataValues.path
                      : "",
                });
              }
            }
          }
        }
      }
      return creditRecord;
    }

    // Get Tag details
    if (type == "tag") {
      const searchParams = {
        distinct: true,
        raw: false,
      };

      const attributes = ["id", "name", "tag_main_category_id", "type"];
      const modelName = model.tag;

      const titleTagData = await model.tagGable.findAll({
        where: { taggable_id: id, status: "active" },
      });
      if (titleTagData) {
        for (const taggable of titleTagData) {
          const includeQuery = [
            {
              model: model.tagTranslation,
              attributes: ["tag_id", "display_name", "site_language"],
              left: true,
              where: {
                status: "active",
              },
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
            {
              model: model.tagCategory,
              attributes: ["id", "slug_name"],
              include: [
                {
                  model: model.tagCategoryTranslation,
                  attributes: ["tag_category_id", "category_name", "site_language"],
                  left: true,
                  where: {
                    status: "active",
                  },
                  required: true,
                  separate: true,
                  order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                },
              ],
              left: true,
              where: {
                parent_id: 0,
                status: "active",
              },
              required: true,
            },
          ];
          const condition = {
            status: "active",
            id: taggable.tag_id,
          };
          tagResult = await paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          );
          for (const element of tagResult.rows) {
            if (element) {
              if (element.type == "genre") {
                const data = {
                  id: taggable.id,
                  tag_id: element.id,
                  score: taggable.score,
                  display_name:
                    element.tagTranslations && element.tagTranslations[0]
                      ? element.tagTranslations[0].display_name
                      : "",
                  category_id:
                    element.tagCategory && element.tagCategory.id ? element.tagCategory.id : "",
                };
                genreResponseDetails.push(data);
              } else {
                const data = {
                  id: taggable.id,
                  tag_id: element.id,
                  score: taggable.score,
                  display_name:
                    element.tagTranslations && element.tagTranslations[0]
                      ? element.tagTranslations[0].display_name
                      : "",
                  category_id:
                    element.tagCategory && element.tagCategory.id ? element.tagCategory.id : "",
                };
                tagResponseDetails.push(data);
              }
            }
          }
        }
      }

      // Get parent category

      const getParentCategory = await model.tagCategory.findAll({
        attributes: ["id", "slug_name", "tag_catgeory_type"],
        where: { parent_id: 0, status: "active" },
        include: [
          {
            model: model.tagCategoryTranslation,
            left: true,
            attributes: ["category_name", "tag_category_id", "site_language"],
            where: { status: "active" },
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
      });
      if (getParentCategory) {
        for (const eachRow of getParentCategory) {
          if (eachRow) {
            const parentId = eachRow.id ? eachRow.id : "";
            const slugName = eachRow.slug_name ? eachRow.slug_name : "";
            const categoryName = eachRow.tagCategoryTranslations[0].category_name
              ? eachRow.tagCategoryTranslations[0].category_name
              : "";
            if (slugName == "genre") {
              let eachGenTags = {};
              for (const eachGenTag of genreResponseDetails) {
                if (eachGenTag && eachGenTag.category_id) {
                  eachGenTags = {
                    title_id: id,
                    category_id: parentId,
                    category_name: categoryName,
                    type: slugName,
                    tag_id: eachGenTag.tag_id,
                    score: eachGenTag.score,
                    display_name: eachGenTag.display_name,
                  };
                  getTagDetails.push(eachGenTags);
                }
              }
            } else {
              let eachTags = {};
              for (const eachTag of tagResponseDetails) {
                if (eachTag && eachTag.category_id && eachTag.category_id == parentId) {
                  eachTags = {
                    title_id: id,
                    category_id: parentId,
                    category_name: categoryName,
                    type: "",
                    tag_id: eachTag.tag_id,
                    score: eachTag.score,
                    display_name: eachTag.display_name,
                  };
                  getTagDetails.push(eachTags);
                }
              }
            }
          }
        }
      }
      return getTagDetails;
    }
  } catch (error) {
    return { results: {} };
  }
};
