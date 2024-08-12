import model from "../../../models/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import {
  paginationService,
  zapzeeService,
  awardService,
  userPermissionService,
} from "../../../services/index.js";
import { PAGINATION_LIMIT, ZAPZEE_APIS, PEOPLE_SETTINGS } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * Movie details-primary
 * @param req
 * @param res
 */
export const movieDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
    const userId = req.userDetails && req.userDetails.userId ? req.userDetails.userId : null;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const movieId = reqBody.id; //It will be movie id
    let getCastList = [];
    let getGenreList = "";
    let getCountryList = "";
    let getOriginalByList = "";
    let getDirector = "";
    let getWriter = "";
    let imageResultData = [],
      videoResultData = [],
      posterResultData = [],
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

    let getInformations = await getInformationsMethod(userId, movieId, language);
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title id"));

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    const totalRating = getInformations.dataValues.avg_rating
      ? getInformations.dataValues.avg_rating
      : 0;

    const [
      getCountry,
      getOriginalBy,
      getCast,
      getGenre,
      keywords,
      awards,
      watchStream,
      watchRent,
      watchBuy,
      isEdit,
    ] = await Promise.all([
      //title countries
      model.titleCountries.findAll({
        attributes: ["title_id", "country_id"],
        where: { title_id: movieId, status: "active" },
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
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          },
        ],
      }),
      //original works
      model.originalWorks.findAll({
        attributes: ["title_id", "ow_type", "ow_title", "ow_original_artis"],
        where: { title_id: movieId, status: "active", site_language: language },
      }),
      //credit
      model.creditable.findAll({
        attributes: ["people_id", "creditable_id", "department"],
        where: {
          creditable_id: movieId,
          creditable_type: "title",
          department: "cast",
          status: "active",
        },
        include: [
          {
            model: model.people,
            left: true,
            attributes: ["id", "gender"],
            where: { status: "active" },
          },
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
        order: [["id", "ASC"]],
      }),
      //tags
      model.tagGable.findAll({
        attributes: ["tag_id", "taggable_id", "taggable_type"],
        where: {
          taggable_id: movieId,
          taggable_type: "title",
          status: "active",
        },
        include: [
          {
            model: model.tag,
            left: true,
            attributes: ["id", "type"],
            where: { type: "genre", status: "active" },
          },
          {
            model: model.tagTranslation,
            attributes: ["tag_id", "display_name", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
      }),
      //title keywords
      model.titleKeyword.findAll({
        where: { title_id: movieId, keyword_type: "news", status: "active" },
        attributes: ["id", "keyword", "site_language"],
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      }),
      //awards
      awardService.getTitleWinnerAndNomineeCount(movieId),
      // Watch for Stream
      model.titleWatchOn.findAll({
        attributes: ["title_id", "type", "provider_id", "movie_id"],
        where: { title_id: movieId, type: "stream", status: "active" },
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
        where: { title_id: movieId, type: "rent", status: "active" },
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
        where: { title_id: movieId, type: "buy", status: "active" },
        include: [
          {
            model: model.ottServiceProvider,
            left: true,
            attributes: ["id", "ott_name", "provider_url", "provider_search_url", "logo_path"],
            where: { status: "active" },
          },
        ],
      }),
      //check edit permission
      userPermissionService.checkEditorPermission(req, movieId, "movie"),
    ]);

    // Get Country
    if (getCountry) {
      let list = [];
      for (const eachRow of getCountry) {
        if (eachRow) {
          const name =
            eachRow.country &&
            eachRow.country.countryTranslations[0] &&
            eachRow.country.countryTranslations[0].country_name
              ? eachRow.country.countryTranslations[0].country_name
              : "";
          list.push(name);
        }
      }
      getCountryList = list.join(", ");
    }

    // Get Original By
    if (getOriginalBy) {
      let list = [];
      for (const eachRow of getOriginalBy) {
        if (eachRow) {
          const owType = eachRow.ow_type ? eachRow.ow_type : "";
          const owTitle = eachRow.ow_title ? eachRow.ow_title : "";
          const owOriginalArtis = eachRow.ow_original_artis ? eachRow.ow_original_artis : "";
          const originalBy = owTitle + "(" + owType + ") - " + owOriginalArtis;
          list.push(originalBy);
        }
      }
      getOriginalByList = list.join(", ");
    }

    // Get Director
    const getDirectorDepartment = await model.departmentJob
      .findAll({
        where: { status: "active", department_id: 10 },
        attributes: ["id", "job_name"],
        include: [
          {
            model: model.department,
            left: true,
            required: true,
            where: { status: "active" },
          },
        ],
        raw: true,
      })
      .then((departmentJobs) => departmentJobs.map((departmentJob) => departmentJob.job_name));
    let directorList = [];
    if (getDirectorDepartment && getDirectorDepartment.length > 0) {
      getDirector = await model.creditable.findAll({
        attributes: ["people_id", "creditable_id", "department"],
        where: {
          creditable_id: movieId,
          creditable_type: "title",
          job: {
            [Op.in]: getDirectorDepartment,
          },
          status: "active",
        },
        include: [
          {
            model: model.people,
            left: true,
            attributes: ["id", "gender"],
            where: { status: "active" },
          },
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
        group: ["people_id"],
      });

      if (getDirector && getDirector.length > 0) {
        for (const eachDirector of getDirector) {
          if (eachDirector) {
            const element = {
              id:
                eachDirector && eachDirector.peopleTranslations[0]
                  ? eachDirector.peopleTranslations[0].people_id
                  : "",
              name:
                eachDirector && eachDirector.peopleTranslations[0]
                  ? eachDirector.peopleTranslations[0].name
                  : "",
            };
            directorList.push(element);
          }
        }
      }
    }

    // Get Writer
    const getWriterDepartment = await model.departmentJob
      .findAll({
        where: { status: "active", department_id: 3 },
        attributes: ["id", "job_name"],
        include: [
          {
            model: model.department,
            left: true,
            required: true,
            where: { status: "active" },
          },
        ],
        raw: true,
      })
      .then((departmentJobs) => departmentJobs.map((departmentJob) => departmentJob.job_name));
    let writerList = [];
    if (getWriterDepartment && getWriterDepartment.length > 0) {
      getWriter = await model.creditable.findAll({
        attributes: ["people_id", "creditable_id", "department"],
        where: {
          creditable_id: movieId,
          creditable_type: "title",
          job: { [Op.in]: getWriterDepartment },
          status: "active",
        },
        include: [
          {
            model: model.people,
            left: true,
            attributes: ["id", "gender"],
            where: { status: "active" },
          },
          {
            model: model.peopleTranslation,
            attributes: ["people_id", "name", "known_for", "site_language"],
            left: true,
            where: { status: "active" },
            required: false,
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        ],
        group: ["people_id"],
      });

      if (getWriter && getWriter.length > 0) {
        for (const eachWriter of getWriter) {
          if (eachWriter) {
            const element = {
              id: eachWriter.peopleTranslations[0]
                ? eachWriter.peopleTranslations[0].people_id
                : "",
              name: eachWriter.peopleTranslations[0] ? eachWriter.peopleTranslations[0].name : "",
            };
            writerList.push(element);
          }
        }
      }
    }

    // Cast name
    if (getCast) {
      for (const eachRow of getCast) {
        if (eachRow) {
          const element = {
            id:
              eachRow.peopleTranslations[0] && eachRow.peopleTranslations[0].people_id
                ? eachRow.peopleTranslations[0].people_id
                : "",
            name:
              eachRow.peopleTranslations[0] && eachRow.peopleTranslations[0].name
                ? eachRow.peopleTranslations[0].name
                : "",
          };
          getCastList.push(element);
        }
      }
    }

    // Get Genre
    if (getGenre) {
      let list = [];
      for (const eachRow of getGenre) {
        if (eachRow) {
          const name =
            eachRow.tagTranslations[0] && eachRow.tagTranslations[0].display_name
              ? eachRow.tagTranslations[0].display_name
              : "";
          list.push(name);
        }
      }
      getGenreList = list.join(", ");
    }

    // People list (cast & crew)
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
      creditable_id: movieId,
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
        creditable_id: movieId,
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
    const searchParamsVideo = { page: 1, limit: 5, sortBy: "id", sortOrder: "ASC" };
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
      title_id: movieId,
      status: "active",
      video_for: "title",
    };
    videoResultData = await paginationService.pagination(
      searchParamsVideo,
      model.video,
      videoIncludeQuery,
      videoCondition,
      videoAttributes,
    );

    if (videoResultData.count > 0) {
      let videoList = [];
      for (const eachRow of videoResultData.rows) {
        if (eachRow) {
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
      }
      videoResultData.rows = videoList;
    }

    // Media for images
    const searchParamsImage = { page: 1, limit: 5, sortBy: "id", sortOrder: "ASC" };
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
      title_id: movieId,
      status: "active",
      image_category: "image",
    };
    searchParams.queryLog = true;
    imageResultData = await paginationService.pagination(
      searchParamsImage,
      model.titleImage,
      imageIncludeQuery,
      imageCondition,
      imageAttributes,
    );
    if (imageResultData.count > 0) {
      let imageList = [];
      for (const eachRow of imageResultData.rows) {
        if (eachRow) {
          const record = {
            id: eachRow.id ? eachRow.id : "",
            link: eachRow.path ? eachRow.path : "",
          };
          imageList.push(record);
        }
      }
      imageResultData.rows = imageList;
    }

    // Media for poster
    const searchParamsPoster = { page: 1, limit: 5, sortBy: "id", sortOrder: "ASC" };
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
      title_id: movieId,
      status: "active",
      image_category: "poster_image",
    };
    posterResultData = await paginationService.pagination(
      searchParamsPoster,
      model.titleImage,
      posterIncludeQuery,
      posterCondition,
      posterAttributes,
    );
    if (posterResultData.count > 0) {
      let imageList = [];
      for (const eachRow of posterResultData.rows) {
        if (eachRow) {
          const record = {
            id: eachRow.id ? eachRow.id : "",
            link: eachRow.path ? eachRow.path : "",
          };
          imageList.push(record);
        }
      }
      posterResultData.rows = imageList;
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
    //watch stream
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
                    type: "movie",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: {
                        ID: "",
                        title: titleName,
                        SEARCHTEXT: titleName,
                      },
                      type: "movie",
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
    //watch rent
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
                    type: "movie",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: { ID: "", title: titleName, SEARCHTEXT: titleName },
                      type: "movie",
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
    //watch buy
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
                    type: "movie",
                  })
                : await generalHelper.generateOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: {
                        ID: "",
                        title: titleName,
                        SEARCHTEXT: titleName,
                      },
                      type: "movie",
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

    // Get Related Articles section data
    // Get the News search keyword
    let newsKeyWords = [];
    if (keywords) {
      for (const eachRow of keywords) {
        if (eachRow) {
          const name = eachRow.keyword ? eachRow.keyword : "";
          if (name) {
            newsKeyWords.push(name);
          }
        }
      }
    }

    if (
      newsKeyWords &&
      newsKeyWords != null &&
      newsKeyWords != "undefined" &&
      newsKeyWords.length > 0
    ) {
      articleList = await zapzeeService.fetchSearchFeed(`"${newsKeyWords.toString()}"`);
    }
    if (articleList && articleList.length > 0) {
      articleList = articleList.slice(0, 3);
      let list = [];
      for (const eachRow of articleList) {
        if (eachRow) {
          const getCategory = eachRow.category ? eachRow.category : "";
          const shortDescriptions = eachRow.description ? eachRow.description.slice(0, 100) : "";
          const record = {
            id: eachRow.id ? eachRow.id : "",
            title: eachRow.title ? eachRow.title : "",
            category: !getCategory ? "" : getCategory.shift(),
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
    let certificationText = getInformations.certification ? getInformations.certification : "";
    if (certificationText && Number.isInteger(certificationText) == false) {
      certificationText = res.__(certificationText);
    }

    //ZapZee details page link
    let zapzeeLink = ZAPZEE_APIS.MORE_SEARCH_PAGE_URL;
    if (newsKeyWords) {
      zapzeeLink = `${zapzeeLink}${newsKeyWords.toString()}`;
    }

    //plot
    let plotDetails =
      getInformations.titleTranslations[0] && getInformations.titleTranslations[0].plot_summary
        ? getInformations.titleTranslations[0].plot_summary
        : "";
    plotDetails =
      plotDetails == "" &&
      getInformations.titleTranslations[1] &&
      getInformations.titleTranslations[1].plot_summary
        ? getInformations.titleTranslations[1].plot_summary
        : plotDetails;

    res.ok({
      title:
        getInformations.titleTranslations[0] && getInformations.titleTranslations[0].name
          ? getInformations.titleTranslations[0].name
          : "",
      type: getInformations.type ? getInformations.type : "",
      is_edit: isEdit,
      genre: getGenreList,
      certification: certificationText,
      runtime: getInformations.runtime ? getInformations.runtime : "",
      year: getInformations.dataValues.release_year ? getInformations.dataValues.release_year : "",
      footfalls: getInformations.footfalls ? getInformations.footfalls : "",
      no_of_likes: getInformations.dataValues.numberOfLikes
        ? getInformations.dataValues.numberOfLikes
        : "",
      is_like: getInformations.dataValues.is_liked ? getInformations.dataValues.is_liked : "n",
      rating: totalRating ? parseFloat(totalRating).toFixed(1) : "",
      user_rating: getInformations.get("user_rating") ? getInformations.get("user_rating") : 0,
      details:
        getInformations.titleTranslations[0] && getInformations.titleTranslations[0].description
          ? getInformations.titleTranslations[0].description
          : "",
      director_name: directorList,
      writer_name: writerList,
      cast: getCastList,
      original_by: getOriginalByList ? getOriginalByList : "",
      official_site: getInformations.affiliate_link ? getInformations.affiliate_link : "",
      country: getCountryList ? getCountryList : "",
      language: getInformations.language ? getInformations.language : "",
      award: awards ? awards : {},
      poster_image: !getInformations.titleImages[0] ? "" : getInformations.titleImages[0].path,
      background_image: !getInformations.titleImageBg[0]
        ? ""
        : getInformations.titleImageBg[0].dataValues.bg_path,
      detail: {
        release_date: getInformations.release_date ? getInformations.release_date : "",
        plot: plotDetails,
        known_as:
          getInformations.titleTranslations[0] && getInformations.titleTranslations[0].aka
            ? getInformations.titleTranslations[0].aka
            : "",
      },
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

const getInformationsMethod = async (userId, movieId, language) => {
  return await model.title.findOne({
    attributes: [
      "id",
      "type",
      "release_date",
      "year",
      [Sequelize.fn("date_format", Sequelize.col("release_date"), "%Y"), "release_year"],
      "country",
      "certification",
      "runtime",
      "language",
      "footfalls",
      "affiliate_link",
      "rating",
      "tmdb_vote_average",
      "record_status",
      [fn("titleRatingCount", col("title.id")), "avg_rating"],
      [fn("titleLikeCount", col("title.id")), "numberOfLikes"],
      [fn("isTitleLiked", col("title.id"), userId), "is_liked"],
      [fn("getUserRatings", col("title.id"), "title", userId), "user_rating"],
    ],
    where: { id: movieId, record_status: "active", type: "movie" },
    include: [
      {
        model: model.titleTranslation,
        left: true,
        attributes: ["name", "aka", "description", "plot_summary", "site_language"],
        where: { status: "active" },
        required: false,
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
      {
        model: model.titleImage,
        attributes: [
          "title_id",
          "original_name",
          "file_name",
          "url",
          [
            fn("REPLACE", col("titleImage.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
            "path",
          ],
        ],
        left: true,
        where: {
          status: "active",
          image_category: "poster_image",
          is_main_poster: "y",
        },
        required: false,
        separate: true, //get the recently added image
        order: [["id", "DESC"]],
      },
      {
        model: model.titleImage,
        attributes: [
          ["original_name", "bg_original_name"],
          ["file_name", "bg_file_name"],
          ["url", "bg_url"],
          [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "bg_path"],
        ],
        left: true,
        as: "titleImageBg",
        where: {
          status: "active",
          image_category: "bg_image",
        },
        required: false,
        separate: true, //get the recently added image
        order: [["id", "DESC"]],
      },
    ],
  });
};
