import model from "../../models/index.js";
import { paginationService } from "../../services/index.js";
import { generalHelper } from "../../helpers/index.js";

export const getMovieBulkExportData = async (id = null, lan) => {
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
    let keywordDetails = [];
    let newsKeywordDetails = [];
    let countryDetails = [];
    let enOriginalDetails = [];
    let koOriginalDetails = [];
    let connectionDetails = [];
    let seriesDetails = [];

    let getMediaVideoDetails = [];
    let getMediaBackImagesDetails = [];
    let getMediaImagesDetails = [];
    let getMediaPosterDetails = [];
    let getCastDetails = [];
    let getCrewDetails = [];

    let getTagDetails = [];
    let tagResult = [];
    let genreResponseDetails = [];
    let tagResponseDetails = [];

    let watchStreamList = [];
    let watchRentList = [];
    let watchBuyList = [];

    let rereleaseDetails = [];

    let mergeData = {};

    const getTitleDetails = await model.title.findOne({
      attributes: [
        "id",
        "imdb_id",
        "tmdb_id",
        "kobis_id",
        "tiving_id",
        "odk_id",
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
        attributes: ["id", ["re_release_date", "date"]],
        where: { title_id: id, status: "active" },
      });
    }

    // Get Country List
    const countryList = await model.titleCountries.findAll({
      attributes: ["country_id", "site_language"],
      where: { title_id: id, status: "active" },
      group: ["titleCountries.country_id"],
    });

    // Get original work
    const getOriginalWork = await model.originalWorks.findAll({
      attributes: ["id", "title_id", "ow_type", "ow_title", "ow_original_artis", "site_language"],
      where: { title_id: id, status: "active" },
    });

    // Get Connection details
    const getConnectionDetails = await model.relatedTitle.findAll({
      attributes: ["id", "title_id", "related_title_id", "site_language"],
      where: { title_id: id, status: "active" },
    });

    // Get Series details
    const getSeriesDetails = await model.relatedSeriesTitle.findAll({
      attributes: ["id", "title_id", "related_series_title_id", "site_language"],
      where: { title_id: id, status: "active" },
    });

    // Check Primary details exist or not
    if (getPrimaryDetails) {
      for (const eachRow of getPrimaryDetails) {
        if (eachRow) {
          if (eachRow.dataValues.site_language == "en") {
            enName = eachRow.dataValues.name ? eachRow.dataValues.name : "";
            enAka = eachRow.dataValues.aka ? eachRow.dataValues.aka : "";
            enSummary = eachRow.dataValues.summary ? eachRow.dataValues.summary : "";
            enPlotSummary = eachRow.dataValues.plot_summary ? eachRow.dataValues.plot_summary : "";
          }
          if (eachRow.dataValues.site_language == "ko") {
            koName = eachRow.dataValues.name ? eachRow.dataValues.name : "";
            koAka = eachRow.dataValues.aka ? eachRow.dataValues.aka : "";
            koSummary = eachRow.dataValues.summary ? eachRow.dataValues.summary : "";
            koPlotSummary = eachRow.dataValues.plot_summary ? eachRow.dataValues.plot_summary : "";
          }
        }
      }
    }

    // Check Search Keyword details exist or not
    if (getSearchKeywordDetails) {
      for (const eachRow of getSearchKeywordDetails) {
        if (eachRow) {
          const record = {
            id: eachRow.dataValues.id,
            keyword: eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "",
          };
          keywordDetails.push(record);
        }
      }
    }

    // check News Search Keyword details exist or not
    if (getNewsSearchKeywordDetails) {
      for (const eachRow of getNewsSearchKeywordDetails) {
        if (eachRow) {
          const record = {
            id: eachRow.dataValues.id,
            keyword: eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "",
          };
          newsKeywordDetails.push(record);
        }
      }
    }

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

          const record = {
            id: getCountry.id,
            country:
              getCountry && getCountry.countryTranslations[0]
                ? getCountry.countryTranslations[0].dataValues.country_name
                : "",
          };
          countryDetails.push(record);
        }
      }
    }

    // Check Original Work details exist or not
    if (getOriginalWork) {
      for (const eachRow of getOriginalWork) {
        if (eachRow) {
          if (eachRow.dataValues.site_language == "en") {
            const record = {
              id: eachRow.dataValues.id,
              type: eachRow.dataValues.ow_type ? eachRow.dataValues.ow_type : "",
              original_title: eachRow.dataValues.ow_title ? eachRow.dataValues.ow_title : "",
              original_artist: eachRow.dataValues.ow_original_artis
                ? eachRow.dataValues.ow_original_artis
                : "",
            };
            enOriginalDetails.push(record);
          }
          if (eachRow.dataValues.site_language == "ko") {
            const record = {
              id: eachRow.dataValues.id,
              type: eachRow.dataValues.ow_type ? eachRow.dataValues.ow_type : "",
              original_title: eachRow.dataValues.ow_title ? eachRow.dataValues.ow_title : "",
              original_artist: eachRow.dataValues.ow_original_artis
                ? eachRow.dataValues.ow_original_artis
                : "",
            };
            koOriginalDetails.push(record);
          }
        }
      }
    }

    // Get watch stream details
    const [watchStream, watchRent, watchBuy] = await Promise.all([
      model.titleWatchOn.findAll({
        attributes: ["title_id", "type", "provider_id", "movie_id"],
        where: { title_id: id, type: "stream", status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "provider_search_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      }),
      // Get watch Rent details
      model.titleWatchOn.findAll({
        attributes: ["title_id", "type", "provider_id", "movie_id"],
        where: { title_id: id, type: "rent", status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "provider_search_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      }),
      // Get watch Buy details
      model.titleWatchOn.findAll({
        attributes: ["title_id", "type", "provider_id", "movie_id"],
        where: { title_id: id, type: "buy", status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "provider_search_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      }),
    ]);
    if (watchStream) {
      let list = [];
      for (const eachRow of watchStream) {
        if (eachRow) {
          const record = {
            provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
            privider_name: eachRow.ottServiceProvider.ott_name
              ? eachRow.ottServiceProvider.ott_name
              : "",
            url:
              eachRow.ottServiceProvider.provider_url && eachRow.movie_id
                ? await generalHelper.generateOttUrl(eachRow.ottServiceProvider.provider_url, {
                    search_params_values: { ID: eachRow.movie_id, title: enName, SEARCHTEXT: "" },
                    type: "movie",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: { ID: "", title: enName, SEARCHTEXT: enName },
                      type: "movie",
                    },
                    "search",
                  ),
            icon: eachRow.ottServiceProvider.logo_path,
          };
          list.push(record);
        }
      }
      watchStreamList = list;
    }

    if (watchRent) {
      let list = [];
      for (const eachRow of watchRent) {
        if (eachRow) {
          const record = {
            provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
            privider_name: eachRow.ottServiceProvider.ott_name
              ? eachRow.ottServiceProvider.ott_name
              : "",
            url:
              eachRow.ottServiceProvider.provider_url && eachRow.movie_id
                ? await generalHelper.generateOttUrl(eachRow.ottServiceProvider.provider_url, {
                    search_params_values: { ID: eachRow.movie_id, title: enName, SEARCHTEXT: "" },
                    type: "movie",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: { ID: "", title: enName, SEARCHTEXT: enName },
                      type: "movie",
                    },
                    "search",
                  ),
            icon: eachRow.ottServiceProvider.logo_path,
          };
          list.push(record);
        }
      }
      watchRentList = list;
    }

    if (watchBuy) {
      let list = [];
      for (const eachRow of watchBuy) {
        if (eachRow) {
          const record = {
            provider_id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
            privider_name: eachRow.ottServiceProvider.ott_name
              ? eachRow.ottServiceProvider.ott_name
              : "",
            url:
              eachRow.ottServiceProvider.provider_url && eachRow.movie_id
                ? await generalHelper.generateOttUrl(eachRow.ottServiceProvider.provider_url, {
                    search_params_values: { ID: eachRow.movie_id, title: enName, SEARCHTEXT: "" },
                    type: "movie",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: { ID: "", title: enName, SEARCHTEXT: enName },
                      type: "movie",
                    },
                    "search",
                  ),
            icon: eachRow.ottServiceProvider.logo_path,
          };
          list.push(record);
        }
      }
      watchBuyList = list;
    }

    // Check connection details exist or not
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
            id: getConnection.dataValues.id,
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

    // Check series details exist or not
    if (getSeriesDetails) {
      for (const eachRow of getSeriesDetails) {
        if (eachRow) {
          // Get details of connection
          const getSeries = await model.title.findOne({
            attributes: ["id"],
            where: { id: eachRow.dataValues.related_series_title_id, record_status: "active" },
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
            id: getSeries.dataValues.id,
            name:
              getSeries && getSeries.dataValues.titleTranslations[0]
                ? getSeries.dataValues.titleTranslations[0].dataValues.name
                : "",
            image:
              getSeries && getSeries.dataValues.titleImages[0]
                ? getSeries.dataValues.titleImages[0].dataValues.path
                : "",
          };
          seriesDetails.push(record);
        }
      }
    }

    // Get Media & Cast-Crew details
    [
      getMediaVideoDetails,
      getMediaImagesDetails,
      getMediaBackImagesDetails,
      getMediaPosterDetails,
      getCastDetails,
      getCrewDetails,
    ] = await Promise.all([
      model.video.findAll({
        attributes: ["id", ["name", "video_title"], ["url", "video_url"], "is_official_trailer"],
        where: {
          title_id: id,
          status: "active",
          video_for: "title",
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      }),
      model.titleImage.findAll({
        attributes: [
          "id",
          ["original_name", "originalname"],
          ["file_name", "filename"],
          "path",
          ["file_size", "size"],
          "mime_type",
        ],
        where: {
          title_id: id,
          status: "active",
          image_category: "image",
          episode_id: null,
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      }),
      model.titleImage.findAll({
        attributes: [
          "id",
          ["original_name", "originalname"],
          ["file_name", "filename"],
          "path",
          ["file_size", "size"],
          "mime_type",
        ],
        where: {
          title_id: id,
          status: "active",
          image_category: "bg_image",
          episode_id: null,
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      }),
      model.titleImage.findAll({
        attributes: [
          "id",
          ["original_name", "originalname"],
          ["file_name", "filename"],
          "path",
          ["file_size", "size"],
          "mime_type",
        ],
        where: {
          title_id: id,
          status: "active",
          image_category: "poster_image",
          episode_id: null,
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      }),
      model.creditable.findAll({
        attributes: ["people_id", "character_name", "job", "is_guest"],
        where: {
          creditable_id: id,
          department: "cast",
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
      }),
      model.creditable.findAll({
        attributes: ["people_id", "character_name", "job", "is_guest"],
        where: {
          creditable_id: id,
          department: "crew",
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
      }),
    ]);

    // Get Cast data details

    let totalCastDetails = [];
    if (getCastDetails) {
      for (const eachRow of getCastDetails) {
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

          const record = {
            people_id: peopleId,
            tmdb_id: eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
            kobis_id: eachRow.person.kobis_id ? eachRow.person.kobis_id : "",
            cast_name:
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
          };
          totalCastDetails.push(record);
        }
      }
    }

    // Get Crew data details

    let totalCrewDetails = [];
    if (getCrewDetails) {
      for (const eachRow of getCrewDetails) {
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

          const record = {
            people_id: peopleId,
            tmdb_id: eachRow.person.tmdb_id ? eachRow.person.tmdb_id : "",
            kobis_id: eachRow.person.kobis_id ? eachRow.person.kobis_id : "",
            crew_name:
              eachRow.person &&
              eachRow.person.peopleTranslations[0] &&
              eachRow.person.peopleTranslations[0].name
                ? eachRow.person.peopleTranslations[0].name
                : "",
            job: eachRow.dataValues.job,
            poster:
              getPeopleImage && getPeopleImage.dataValues.path
                ? getPeopleImage.dataValues.path
                : "",
          };
          totalCrewDetails.push(record);
        }
      }
    }

    // ***** Get tag details ******//

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
            const genRecord = {
              category_id: parentId,
              category_name: categoryName,
              type: slugName,
            };
            let eachGenTags = [];
            for (const eachGenTag of genreResponseDetails) {
              if (eachGenTag && eachGenTag.category_id) {
                eachGenTags.push({
                  id: eachGenTag.id,
                  tag_id: eachGenTag.tag_id,
                  score: eachGenTag.score,
                  display_name: eachGenTag.display_name,
                });
              }
            }
            genRecord.tags = eachGenTags;
            getTagDetails.push(genRecord);
          } else {
            const record = {
              category_id: parentId,
              category_name: categoryName,
              type: "",
            };
            let eachTags = [];
            for (const eachTag of tagResponseDetails) {
              if (eachTag && eachTag.category_id && eachTag.category_id == parentId) {
                eachTags.push({
                  id: eachTag.id,
                  tag_id: eachTag.tag_id,
                  score: eachTag.score,
                  display_name: eachTag.display_name,
                });
              }
            }
            record.tags = eachTags;
            getTagDetails.push(record);
          }
        }
      }
    }

    // **** End Tag Details **** //

    const totalData = {
      type: "movie",
      id: id,
      imdb_id: getTitleDetails.imdb_id,
      tving_id: getTitleDetails.tiving_id,
      odk_id: getTitleDetails.odk_id,
      tmdb_id: getTitleDetails.tmdb_id,
      kobis_id: getTitleDetails.kobis_id,
      official_site: getTitleDetails.affiliate_link,
      status: getTitleDetails.title_status,
      release_date: getTitleDetails.release_date,
      release_date_to: getTitleDetails.release_date_to,
      is_rerelease: getTitleDetails.is_rerelease == 0 ? "n" : "y",
      rerelease_details: rereleaseDetails,
      rating: getTitleDetails.rating,
      runtime: getTitleDetails.runtime,
      footfalls: getTitleDetails.footfalls,
      certification: getTitleDetails.certification,
      language: getTitleDetails.language,
      aka: koAka ? koAka : enAka ? enAka : "",
      name: { en: enName ? enName : "", ko: koName ? koName : "" },
      summary: { en: enSummary ? enSummary : "", ko: koSummary ? koSummary : "" },
      plot_summary: {
        en: enPlotSummary ? enPlotSummary : "",
        ko: koPlotSummary ? koPlotSummary : "",
      },
      original_work: {
        en: enOriginalDetails,
        ko: koOriginalDetails,
      },
      search_keywords: keywordDetails,
      news_search_keywords: newsKeywordDetails,
      country: countryDetails,
      watch: {
        stream: watchStreamList,
        buy: watchBuyList,
        rent: watchRentList,
      },
      connection: connectionDetails,
      series: seriesDetails,
      media_details: {
        video: getMediaVideoDetails,
        images: getMediaImagesDetails,
        bg_images: getMediaBackImagesDetails,
        poster_images: getMediaPosterDetails,
      },
      credit_details: {
        cast: totalCastDetails,
        crew: totalCrewDetails,
      },
      tag_details: getTagDetails,
    };

    mergeData = totalData;
    return mergeData;
  } catch (error) {
    return { results: {} };
  }
};