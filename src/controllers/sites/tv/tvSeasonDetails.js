import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { paginationService, zapzeeService } from "../../../services/index.js";
import { PAGINATION_LIMIT, ZAPZEE_APIS, PEOPLE_SETTINGS } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";

/**
 * Tv season wise details
 * @param req
 * @param res
 */
export const tvSeasonDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const tvId = reqBody.id; //It will be tv id
    const seasonId = reqBody.season_id; //It will be season id
    let imageResultData = [],
      videoResultData = [],
      posterResultData = [],
      episodeList = [],
      articleList = [],
      watchStreamList = [],
      watchRentList = [],
      watchBuyList = [];

    let peopleIncludeQuery = [],
      imageIncludeQuery = [],
      videoIncludeQuery = [],
      posterIncludeQuery = [];
    let videoCondition = [],
      imageCondition = [],
      posterCondition = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    let language = req.accept_language;

    let getInformations = await getInformationsMethod(seasonId, tvId, language);
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title or season id"));

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    // Episode list
    const getEpisodeList = await model.episode.findAll({
      where: { status: "active", season_id: seasonId, title_id: tvId },
      attributes: [
        "id",
        "name",
        "description",
        [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
        "release_date",
        "title_id",
        "season_id",
        "season_number",
        "episode_number",
        "year",
        "popularity",
        "popularity",
      ],
      include: [
        {
          model: model.episodeTranslation,
          attributes: ["name", "description", "site_language"],
          left: true,
          where: { status: "active" },
          required: true,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ],
      limit: 3,
    });
    if (getEpisodeList) {
      let list = [];
      for (const eachRow of getEpisodeList) {
        if (eachRow) {
          const record = {
            id: eachRow.dataValues.id ? eachRow.dataValues.id : "",
            name:
              eachRow.dataValues.episodeTranslations &&
              eachRow.dataValues.episodeTranslations.length > 0 &&
              eachRow.dataValues.episodeTranslations[0].dataValues.name
                ? eachRow.dataValues.episodeTranslations[0].dataValues.name
                : "",
            image: eachRow.dataValues.poster ? eachRow.dataValues.poster : "",
            episode_number: eachRow.dataValues.episode_number
              ? eachRow.dataValues.episode_number
              : "",
            release_date: eachRow.dataValues.release_date
              ? await customDateTimeHelper.changeDateFormat(
                  eachRow.dataValues.release_date,
                  "MMM DD,YYYY",
                )
              : "",
          };
          list.push(record);
        }
      }
      episodeList = list;
    }

    const peopleAttributes = [
      "people_id",
      "creditable_id",
      "department",
      "creditable_type",
      "character_name",
      "job",
      "list_order",
    ];
    peopleIncludeQuery = [
      {
        model: model.people,
        attributes: [
          "id",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
        ],
        left: true,
        where: { status: "active" },
        required: true,
        include: [
          {
            model: model.peopleTranslation,
            attributes: ["name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
          {
            model: model.peopleImages,
            attributes: [
              "original_name",
              "file_name",
              "url",
              [
                fn(
                  "REPLACE",
                  col("peopleImages.path"),
                  `${envs.s3.BUCKET_URL}`,
                  `${envs.aws.cdnUrl}`,
                ),
                "path",
              ],
            ],
            left: true,
            where: {
              image_category: "poster_image",
              is_main_poster: "y",
              status: "active",
            },
            required: false,
            separate: true, //get the recently added image
            order: [["id", "DESC"]],
          },
        ],
      },
    ];

    const peopleConditionCast = {
      creditable_id: tvId,
      season_id: seasonId,
      department: "cast",
      status: "active",
      creditable_type: "title",
    };
    searchParams.page = 1;
    searchParams.limit = 5;
    searchParams.sortOrder = "ASC";
    searchParams.sortBy = "list_order";

    const peopleResultData = await paginationService.pagination(
      searchParams,
      model.creditable,
      peopleIncludeQuery,
      peopleConditionCast,
      peopleAttributes,
    );
    const peopleList = [];
    if (peopleResultData.count > 0) {
      for (const eachRow of peopleResultData.rows) {
        const departmentType = eachRow.department == "cast" ? eachRow.character_name : eachRow.job;
        const record = {
          id: eachRow.people_id ? eachRow.people_id : "",
          name:
            eachRow.person.peopleTranslations[0] && eachRow.person.peopleTranslations[0].name
              ? eachRow.person.peopleTranslations[0].name
              : "",
          designation: departmentType ? departmentType : "",
          image:
            eachRow.person.peopleImages[0] && eachRow.person.peopleImages[0].path
              ? eachRow.person.peopleImages[0].path.replace("p/original", `p/${peopleImageW}`)
              : "",
        };
        peopleList.push(record);
      }
    }
    if (peopleList.length < 5) {
      const crewLimit = 5 - peopleList.length;
      const peopleConditionCrew = {
        creditable_id: tvId,
        season_id: seasonId,
        department: "crew",
        status: "active",
        creditable_type: "title",
      };
      searchParams.page = 1;
      searchParams.limit = crewLimit;

      const peopleResultData = await paginationService.pagination(
        searchParams,
        model.creditable,
        peopleIncludeQuery,
        peopleConditionCrew,
        peopleAttributes,
      );
      if (peopleResultData.count > 0) {
        for (const eachRow of peopleResultData.rows) {
          const departmentType =
            eachRow.department == "cast" ? eachRow.character_name : eachRow.job;
          const record = {
            id: eachRow.people_id ? eachRow.people_id : "",
            name:
              eachRow.person.peopleTranslations[0] && eachRow.person.peopleTranslations[0].name
                ? eachRow.person.peopleTranslations[0].name
                : "",
            designation: departmentType ? departmentType : "",
            image:
              eachRow.person.peopleImages[0] && eachRow.person.peopleImages[0].path
                ? eachRow.person.peopleImages[0].path.replace("p/original", `p/${peopleImageW}`)
                : "",
          };
          peopleList.push(record);
        }
      }
    }
    // Media for videos
    const videoAttributes = [
      "id",
      "title_id",
      "name",
      "thumbnail",
      "video_duration",
      "video_source",
      [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "url"],
      "type",
      "site_language",
      "created_at",
    ];

    videoIncludeQuery = [
      {
        model: model.title,
        attributes: ["record_status"],
        left: true,
        where: { record_status: "active" },
        required: true,
        include: {
          model: model.titleTranslation,
          left: true,
          attributes: ["title_id", "name", "site_language"],
          where: { status: "active" },
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      },
    ];

    videoCondition = {
      title_id: tvId,
      season: seasonId,
      status: "active",
      video_for: "title",
    };
    videoResultData = await paginationService.pagination(
      searchParams,
      model.video,
      videoIncludeQuery,
      videoCondition,
      videoAttributes,
    );

    if (videoResultData.count > 0) {
      let videoList = [];
      let v = 1;
      for (const eachRow of videoResultData.rows) {
        if (eachRow && v < 4) {
          const record = {
            id: eachRow.id ? eachRow.id : "",
            title: eachRow.name ? eachRow.name : "",
            link: eachRow.url ? eachRow.url : "",
            thumb: eachRow.thumbnail ? eachRow.thumbnail : "",
            time: eachRow.video_duration
              ? await generalHelper.formatVideoDuration(
                  eachRow.video_duration,
                  eachRow.video_source,
                )
              : "",
          };
          videoList.push(record);
        }
        v++;
      }
      videoResultData.rows = videoList;
    }

    // Media for images
    const imageAttributes = [
      "id",
      "title_id",
      "original_name",
      "file_name",
      "url",
      [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
    ];
    imageIncludeQuery = [
      {
        model: model.title,
        attributes: ["type", "original_title"],
        left: true,
        where: { record_status: "active" },
        required: false,
      },
    ];

    imageCondition = {
      title_id: tvId,
      season_id: seasonId,
      status: "active",
      image_category: "image",
      original_name: {
        [Op.ne]: null,
      },
      episode_id: {
        [Op.eq]: null,
      },
    };
    const imageSearchParams = {
      sortBy: "id",
      sortOrder: "desc",
    };
    imageResultData = await paginationService.pagination(
      imageSearchParams,
      model.titleImage,
      imageIncludeQuery,
      imageCondition,
      imageAttributes,
    );

    if (imageResultData.count > 0) {
      let imageList = [];
      let i = 1;
      for (const eachRow of imageResultData.rows) {
        if (eachRow && i < 6) {
          const record = {
            id: eachRow.id ? eachRow.id : "",
            link: eachRow.path ? eachRow.path : "",
          };
          imageList.push(record);
        }
        i++;
      }
      imageResultData.rows = imageList;
    }

    // Media for poster

    const posterAttributes = [
      "id",
      "title_id",
      "original_name",
      "file_name",
      "url",
      [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
    ];
    posterIncludeQuery = [
      {
        model: model.title,
        attributes: ["type", "original_title"],
        left: true,
        where: { record_status: "active" },
        required: false,
      },
    ];

    posterCondition = {
      title_id: tvId,
      season_id: seasonId,
      status: "active",
      image_category: "poster_image",
      original_name: {
        [Op.ne]: null,
      },
      episode_id: {
        [Op.eq]: null,
      },
    };
    const posterSearchParams = {
      sortBy: "id",
      sortOrder: "desc",
    };
    posterResultData = await paginationService.pagination(
      posterSearchParams,
      model.titleImage,
      posterIncludeQuery,
      posterCondition,
      posterAttributes,
    );
    if (posterResultData.count > 0) {
      let imageList = [];
      let p = 1;
      for (const eachRow of posterResultData.rows) {
        if (eachRow && p < 6) {
          const record = {
            id: eachRow.id ? eachRow.id : "",
            link: eachRow.path ? eachRow.path : "",
          };
          imageList.push(record);
        }
        p++;
      }
      posterResultData.rows = imageList;
    }

    // Get Related Articles section data
    // Get the News search keyword
    const keywords = await model.titleKeyword.findAll({
      where: {
        title_id: tvId,
        season_id: seasonId,
        keyword_type: "news",
        status: "active",
      },
      attributes: ["id", "keyword"],
    });
    let newsKeyWords = [];
    const likeQuery = [];
    if (keywords) {
      for (const eachRow of keywords) {
        if (eachRow) {
          const name = eachRow.keyword ? eachRow.keyword : "";
          if (name) {
            newsKeyWords.push(name);
            likeQuery.push({ title: { [Op.like]: "%" + name + "%" } });
            likeQuery.push({ category: { [Op.like]: "%" + name + "%" } });
          }
        }
      }
    }
    // Get Data
    if (
      newsKeyWords &&
      newsKeyWords != null &&
      newsKeyWords != "undefined" &&
      newsKeyWords.length > 0
    ) {
      articleList = await zapzeeService.fetchSearchFeed(`"${newsKeyWords.toString()}"`);
    }

    if (articleList) {
      articleList = articleList.slice(0, 3);
      let list = [];
      for (const eachRow of articleList) {
        if (eachRow) {
          const getCategory = eachRow.category ? eachRow.category : "";
          const shortDescriptions = eachRow.description ? eachRow.description.slice(0, 100) : "";
          const record = {
            id: eachRow.id ? eachRow.id : "",
            title: eachRow.title ? eachRow.title : "",
            category: getCategory ? getCategory.shift() : "",
            creator_name: eachRow.creator_name ? eachRow.creator_name : "",
            short_descriptions: shortDescriptions ? shortDescriptions : "",
            publish_date: eachRow.published_date ? eachRow.published_date : "",
            image:
              eachRow.list_image && (await generalHelper.isImageURL(eachRow.list_image))
                ? eachRow.list_image
                : await generalHelper.generateImageUrl(req, "zapzee_n.png"),
            slug: eachRow.slug ? eachRow.slug : "",
          };
          list.push(record);
        }
      }
      articleList = list;
    }

    let titleName = "";
    if (
      getInformations.titleTranslations != null &&
      getInformations.titleTranslations != "undefined" &&
      getInformations.titleTranslations &&
      getInformations.titleTranslations.length > 0
    ) {
      if (
        getInformations.titleTranslations[0] &&
        getInformations.titleTranslations[0].name &&
        getInformations.titleTranslations[0].site_language == "ko"
      ) {
        titleName = getInformations.titleTranslations[0].name.trim();
      } else if (
        getInformations.titleTranslations[1] &&
        getInformations.titleTranslations[1].name &&
        getInformations.titleTranslations[1].site_language == "ko"
      ) {
        titleName = getInformations.titleTranslations[1].name.trim();
      } else if (
        getInformations.titleTranslations[0] &&
        getInformations.titleTranslations[0].name &&
        getInformations.titleTranslations[0].site_language == "en"
      ) {
        titleName = getInformations.titleTranslations[0].name.trim();
      } else if (
        getInformations.titleTranslations[1] &&
        getInformations.titleTranslations[1].name &&
        getInformations.titleTranslations[1].site_language == "en"
      ) {
        titleName = getInformations.titleTranslations[1].name.trim();
      }
    }
    const [watchStream, watchRent, watchBuy] = await Promise.all([
      // Watch for Stream
      model.titleWatchOn.findAll({
        attributes: ["title_id", "type", "provider_id", "movie_id"],
        where: { title_id: tvId, season_id: seasonId, type: "stream", status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "provider_search_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      }),
      // Watch for Rent
      model.titleWatchOn.findAll({
        attributes: ["title_id", "type", "provider_id", "movie_id"],
        where: { title_id: tvId, season_id: seasonId, type: "rent", status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "provider_search_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      }),
      // Watch for Buy
      model.titleWatchOn.findAll({
        attributes: ["title_id", "type", "provider_id", "movie_id"],
        where: { title_id: tvId, season_id: seasonId, type: "buy", status: "active" },
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
            id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
            link:
              eachRow.ottServiceProvider.provider_url && eachRow.movie_id
                ? await generalHelper.generateOttUrl(eachRow.ottServiceProvider.provider_url, {
                    search_params_values: {
                      ID: eachRow.movie_id,
                      title: titleName,
                      SEARCHTEXT: "",
                    },
                    type: "tv",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: {
                        ID: "",
                        title: titleName,
                        SEARCHTEXT: titleName,
                      },
                      type: "tv",
                    },
                    "search",
                  ),
            icon: eachRow.ottServiceProvider.logo_path
              ? await generalHelper.generateOttLogoUrl(req, eachRow.ottServiceProvider.logo_path)
              : "",
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
            id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
            link:
              eachRow.ottServiceProvider.provider_url && eachRow.movie_id
                ? await generalHelper.generateOttUrl(eachRow.ottServiceProvider.provider_url, {
                    search_params_values: {
                      ID: eachRow.movie_id,
                      title: titleName,
                      SEARCHTEXT: "",
                    },
                    type: "tv",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: {
                        ID: "",
                        title: titleName,
                        SEARCHTEXT: titleName,
                      },
                      type: "tv",
                    },
                    "search",
                  ),
            icon: eachRow.ottServiceProvider.logo_path
              ? await generalHelper.generateOttLogoUrl(req, eachRow.ottServiceProvider.logo_path)
              : "",
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
            id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
            link:
              eachRow.ottServiceProvider.provider_url && eachRow.movie_id
                ? await generalHelper.generateOttUrl(eachRow.ottServiceProvider.provider_url, {
                    search_params_values: {
                      ID: eachRow.movie_id,
                      title: titleName,
                      SEARCHTEXT: "",
                    },
                    type: "tv",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: {
                        ID: "",
                        title: titleName,
                        SEARCHTEXT: titleName,
                      },
                      type: "tv",
                    },
                    "search",
                  ),
            icon: eachRow.ottServiceProvider.logo_path
              ? await generalHelper.generateOttLogoUrl(req, eachRow.ottServiceProvider.logo_path)
              : "",
          };
          list.push(record);
        }
      }
      watchBuyList = list;
    }

    //ZapZee details page link
    let zapzeeLink = ZAPZEE_APIS.MORE_SEARCH_PAGE_URL;
    if (newsKeyWords) {
      zapzeeLink = `${zapzeeLink}${newsKeyWords.toString()}`;
    }
    //plot
    let plotDetails =
      getInformations.seasons &&
      getInformations.seasons.length > 0 &&
      getInformations.seasons[0] &&
      getInformations.seasons[0].seasonTranslations &&
      getInformations.seasons[0].seasonTranslations.length > 0 &&
      getInformations.seasons[0].seasonTranslations[0] &&
      getInformations.seasons[0].seasonTranslations[0].dataValues.summary
        ? getInformations.seasons[0].seasonTranslations[0].dataValues.summary
        : "";
    plotDetails =
      plotDetails == "" &&
      getInformations.seasons &&
      getInformations.seasons.length > 0 &&
      getInformations.seasons[0] &&
      getInformations.seasons[0].seasonTranslations &&
      getInformations.seasons[0].seasonTranslations.length > 0 &&
      getInformations.seasons[0].seasonTranslations[1] &&
      getInformations.seasons[0].seasonTranslations[1].dataValues.summary
        ? getInformations.seasons[0].seasonTranslations[1].dataValues.summary
        : plotDetails;

    res.ok({
      season_number:
        getInformations.dataValues.seasons[0] && getInformations.dataValues.seasons[0].number
          ? getInformations.dataValues.seasons[0].number
          : "",
      season_name:
        getInformations.seasons &&
        getInformations.seasons.length > 0 &&
        getInformations.seasons[0] &&
        getInformations.seasons[0].seasonTranslations &&
        getInformations.seasons[0].seasonTranslations.length > 0 &&
        getInformations.seasons[0].seasonTranslations[0] &&
        getInformations.seasons[0].seasonTranslations[0].season_name
          ? getInformations.seasons[0].seasonTranslations[0].season_name
          : "",
      season_poster:
        getInformations.dataValues.seasons[0] && getInformations.dataValues.seasons[0].poster
          ? getInformations.dataValues.seasons[0].poster
          : "",
      release_date:
        getInformations.dataValues.seasons[0] && getInformations.dataValues.seasons[0].release_date
          ? await customDateTimeHelper.changeDateFormat(
              getInformations.dataValues.seasons[0].release_date,
              "MMM DD,YYYY",
            )
          : "",
      episode_number:
        getInformations.dataValues.seasons[0] && getInformations.dataValues.seasons[0].episode_count
          ? getInformations.dataValues.seasons[0].episode_count
          : "",
      plot: plotDetails,
      aka:
        getInformations.dataValues.seasons[0] && getInformations.dataValues.seasons[0].aka
          ? getInformations.dataValues.seasons[0].aka
          : "",
      episode_list: episodeList,
      people_list: peopleList,
      media: {
        videos: videoResultData.rows,
        images: imageResultData.rows,
        poster_images: posterResultData.rows,
      },
      related_articles: articleList,
      related_articles_details_url: zapzeeLink,
      watch: {
        stream: watchStreamList,
        rent: watchRentList,
        buy: watchBuyList,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (seasonId, tvId, language) => {
  return await model.title.findOne({
    attributes: [
      "id",
      "type",
      "release_date",
      "year",
      "country",
      "certification",
      "runtime",
      "language",
      "footfalls",
      "affiliate_link",
      "rating",
      "tmdb_vote_average",
      "record_status",
    ],
    where: { id: tvId, record_status: "active" },
    include: [
      {
        model: model.season,
        attributes: [
          "id",
          "title_id",
          "release_date",
          "release_date_to",
          [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          "number",
          "season_name",
          "summary",
          "aka",
          "episode_count",
        ],
        left: true,
        where: {
          id: seasonId,
          status: "active",
        },
        required: false,
        include: [
          {
            model: model.seasonTranslation,
            attributes: ["id", "season_id", "season_name", "summary", "site_language"],
            left: true,
            where: { status: "active" },
            required: true,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
      },
      {
        model: model.titleTranslation,
        left: true,
        attributes: ["title_id", "name", "site_language"],
        where: { status: "active" },
        required: false,
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
    ],
  });
};
