import model from "../../models/index.js";
import { paginationService } from "../../services/index.js";
import { generalHelper } from "../../helpers/index.js";

export const getMovieXlsBulkExportData = async (id = null, lan, type) => {
  try {
    let language = lan ? lan : "ko";
    let enName = "";
    let enAka = "";
    let enSummary = "";
    let enPlotSummary = "";
    let koName = "";
    let koAka = "";
    let koSummary = "";
    let koPlotSummary = "";
    let getRereleaseDateList = "";
    let keywordDetails = "";
    let newsKeywordDetails = "";
    let countryDetails = "";
    let originalDetails = [];
    let connectionRecord = [];
    let seriesRecord = [];
    let watchRecord = [];
    let videoRecord = [];
    let imageRecord = [];
    let creditRecord = [];
    let getTagDetails = [];
    let tagResult = [];
    let genreResponseDetails = [];
    let tagResponseDetails = [];

    let rereleaseDetails = [];

    let totalData = {};

    if (type === "basic") {
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
        attributes: [
          "name",
          "title_id",
          "aka",
          ["description", "summary"],
          "plot_summary",
          "site_language",
        ],
        where: { title_id: id, status: "active" },
      });
      // Get search keyword details
      const getSearchKeywordDetails = await model.titleKeyword.findAll({
        attributes: ["id", "keyword", "site_language"],
        where: { title_id: id, season_id: null, keyword_type: "search", status: "active" },
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });

      // Get news search keyword details
      const getNewsSearchKeywordDetails = await model.titleKeyword.findAll({
        attributes: ["id", "keyword", "site_language"],
        where: { title_id: id, season_id: null, keyword_type: "news", status: "active" },
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });

      // Get Rerelease date list
      if (getTitleDetails.is_rerelease == 1) {
        rereleaseDetails = await model.titleReRelease.findAll({
          attributes: ["re_release_date"],
          where: { title_id: id, status: "active" },
        });
        if (rereleaseDetails) {
          let list = [];
          for (const eachRow of rereleaseDetails) {
            if (eachRow) {
              const getDate = eachRow.re_release_date ? eachRow.re_release_date : "";
              list.push(getDate);
            }
          }
          getRereleaseDateList = list.join(", ");
        }
      }

      // Get Country List
      const countryList = await model.titleCountries.findAll({
        attributes: ["country_id", "site_language"],
        where: { title_id: id, status: "active" },
        group: ["titleCountries.country_id"],
      });

      // Check Primary details exist or not
      if (getPrimaryDetails) {
        for (const eachRow of getPrimaryDetails) {
          if (eachRow) {
            if (eachRow.dataValues.site_language == "en") {
              enName = eachRow.dataValues.name ? eachRow.dataValues.name : "";
              enAka = eachRow.dataValues.aka ? eachRow.dataValues.aka : "";
              enSummary = eachRow.dataValues.summary ? eachRow.dataValues.summary : "";
              enPlotSummary = eachRow.dataValues.plot_summary
                ? eachRow.dataValues.plot_summary
                : "";
            }
            if (eachRow.dataValues.site_language == "ko") {
              koName = eachRow.dataValues.name ? eachRow.dataValues.name : "";
              koAka = eachRow.dataValues.aka ? eachRow.dataValues.aka : "";
              koSummary = eachRow.dataValues.summary ? eachRow.dataValues.summary : "";
              koPlotSummary = eachRow.dataValues.plot_summary
                ? eachRow.dataValues.plot_summary
                : "";
            }
          }
        }
      }

      // Check Search Keyword details exist or not
      if (getSearchKeywordDetails) {
        let list = [];
        for (const eachRow of getSearchKeywordDetails) {
          if (eachRow) {
            const keyword = eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "";
            list.push(keyword);
          }
        }
        keywordDetails = list.join(", ");
      }

      // check News Search Keyword details exist or not
      if (getNewsSearchKeywordDetails) {
        let list = [];
        for (const eachRow of getNewsSearchKeywordDetails) {
          if (eachRow) {
            const keyword = eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "";
            list.push(keyword);
          }
        }
        newsKeywordDetails = list.join(", ");
      }

      // Check Country details exist or not
      if (countryList) {
        let list = [];
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

            const country =
              getCountry && getCountry.countryTranslations[0]
                ? getCountry.countryTranslations[0].dataValues.country_name
                : "";

            list.push(country);
          }
        }
        countryDetails = list.join(", ");
      }

      totalData = {
        type: "movie",
        id: id,
        imdb_id: getTitleDetails.imdb_id,
        tiving_id: getTitleDetails.tiving_id,
        tmdb_id: getTitleDetails.tmdb_id,
        kobis_id: getTitleDetails.kobis_id,
        odk_id: getTitleDetails.odk_id,
        title_en: enName ? enName : "",
        title_ko: koName ? koName : "",
        aka: koAka ? koAka : enAka ? enAka : "",
        summary_en: enSummary ? enSummary : "",
        summary_ko: koSummary ? koSummary : "",
        plot_summary_en: enPlotSummary ? enPlotSummary : "",
        plot_summary_ko: koPlotSummary ? koPlotSummary : "",
        official_site: getTitleDetails.affiliate_link,
        status: getTitleDetails.title_status,
        release_date: getTitleDetails.release_date,
        release_date_to: getTitleDetails.release_date_to,
        is_rerelease: getTitleDetails.is_rerelease == 0 ? "n" : "y",
        rerelease_details: getRereleaseDateList,
        rating: getTitleDetails.rating,
        runtime: getTitleDetails.runtime,
        footfalls: getTitleDetails.footfalls,
        certification: getTitleDetails.certification,
        language: getTitleDetails.language,
        search_keywords: keywordDetails,
        news_search_keywords: newsKeywordDetails,
        country: countryDetails,
      };
    } else if (type == "original-work") {
      const getOriginalWorkDetails = await model.originalWorks.findAll({
        attributes: ["title_id", "ow_type", "ow_title", "ow_original_artis", "site_language"],
        where: { title_id: id, status: "active" },
      });

      if (getOriginalWorkDetails) {
        for (const eachRow of getOriginalWorkDetails) {
          if (eachRow) {
            originalDetails.push({
              title_id: eachRow.dataValues.title_id,
              ow_type: eachRow.dataValues.ow_type ? eachRow.dataValues.ow_type : "",
              ow_title: eachRow.dataValues.ow_title ? eachRow.dataValues.ow_title : "",
              ow_original_artis: eachRow.dataValues.ow_original_artis
                ? eachRow.dataValues.ow_original_artis
                : "",
              site_language: eachRow.dataValues.site_language,
            });
          }
        }
      }
      totalData = originalDetails;
    } else if (type == "connection") {
      const getConnectionDetails = await model.relatedTitle.findAll({
        attributes: ["id", "title_id", "related_title_id", "site_language"],
        where: { title_id: id, status: "active" },
      });
      if (getConnectionDetails) {
        for (const eachRow of getConnectionDetails) {
          if (eachRow) {
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

            connectionRecord.push({
              title_id: eachRow.dataValues.title_id,
              related_title_id: eachRow.dataValues.related_title_id,
              name:
                getConnection && getConnection.dataValues.titleTranslations[0]
                  ? getConnection.dataValues.titleTranslations[0].dataValues.name
                  : "",
              image:
                getConnection && getConnection.dataValues.titleImages[0]
                  ? getConnection.dataValues.titleImages[0].dataValues.path
                  : "",
            });
          }
        }
      }
      totalData = connectionRecord;
    } else if (type == "series") {
      const getSeriesDetails = await model.relatedSeriesTitle.findAll({
        attributes: ["id", "title_id", "related_series_title_id", "site_language"],
        where: { title_id: id, status: "active" },
      });
      if (getSeriesDetails) {
        for (const eachRow of getSeriesDetails) {
          if (eachRow) {
            // Get details of connection
            const getSeries = await model.title.findOne({
              attributes: ["id"],
              where: {
                id: eachRow.dataValues.related_series_title_id,
                record_status: "active",
              },
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

            seriesRecord.push({
              title_id: eachRow.dataValues.title_id,
              related_series_title_id: eachRow.dataValues.related_series_title_id,
              name:
                getSeries && getSeries.dataValues.titleTranslations[0]
                  ? getSeries.dataValues.titleTranslations[0].dataValues.name
                  : "",
              image:
                getSeries && getSeries.dataValues.titleImages[0]
                  ? getSeries.dataValues.titleImages[0].dataValues.path
                  : "",
            });
          }
        }
      }
      totalData = seriesRecord;
    } else if (type == "watch") {
      // Get Movie details
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
        where: { title_id: id, status: "active" },
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
      totalData = watchRecord;
    } else if (type == "video") {
      const getVideoDetails = await model.video.findAll({
        attributes: [
          "title_id",
          ["name", "video_title"],
          ["url", "video_url"],
          "is_official_trailer",
        ],
        where: {
          video_for: "title",
          title_id: id,
          status: "active",
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });

      if (getVideoDetails) {
        for (const eachRow of getVideoDetails) {
          if (eachRow) {
            videoRecord.push({
              title_id: eachRow.dataValues.title_id ? eachRow.dataValues.title_id : "",
              video_title: eachRow.dataValues.video_title ? eachRow.dataValues.video_title : "",
              video_url: eachRow.dataValues.video_url ? eachRow.dataValues.video_url : "",
              is_official_trailer: eachRow.dataValues.is_official_trailer
                ? eachRow.dataValues.is_official_trailer
                : "",
            });
          }
        }
      }
      totalData = videoRecord;
    } else if (type == "image") {
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
      totalData = imageRecord;
    } else if (type == "credit") {
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
              title_id: eachRow.dataValues.creditable_id ? eachRow.dataValues.creditable_id : "",
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
      totalData = creditRecord;
    } else if (type == "tag") {
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
      totalData = getTagDetails;
    }

    return totalData;
  } catch (error) {
    return { results: {} };
  }
};
