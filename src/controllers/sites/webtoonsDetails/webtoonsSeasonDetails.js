import model from "../../../models/index.js";
import { Op, fn, col } from "sequelize";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";
import { paginationService, zapzeeService } from "../../../services/index.js";
import { PAGINATION_LIMIT, ZAPZEE_APIS, PEOPLE_SETTINGS } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";

/**
 * webtoons season wise details
 * @param req
 * @param res
 */
export const webtoonsSeasonDetails = async (req, res, next) => {
  try {
    const reqBody = req.params;
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid title id"));
    }
    const webtoonsId = reqBody.id; //It will be tv id
    const seasonId = reqBody.season_id; //It will be season id
    let imageResultData = [],
      videoResultData = [],
      posterResultData = [],
      episodeList = [],
      articleList = [],
      readList = [];

    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    let language = req.accept_language;

    let getInformations = await getInformationsMethod(seasonId, webtoonsId, language);
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid title or season id"));

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    const [getEpisodeList, videoResult, imageResult, posterResult, keywords, readData] =
      await Promise.all([
        model.episode.findAll({
          where: { status: "active", season_id: seasonId, title_id: webtoonsId },
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
          ],
          include: [
            {
              model: model.episodeTranslation,
              attributes: ["name", "description", "url", "site_language"],
              left: true,
              where: { status: "active" },
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          ],
          limit: 3,
        }),
        paginationService.pagination(
          { page: 1, limit: 5, sortOrder: "ASC", sortBy: "list_order" },
          model.video,
          [
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
          ],
          {
            title_id: webtoonsId,
            season: seasonId,
            status: "active",
            video_for: "title",
          },
          [
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
          ],
        ),
        paginationService.pagination(
          {
            page: 1,
            limit: 6,
            sortBy: "id",
            sortOrder: "desc",
          },
          model.titleImage,
          [
            {
              model: model.title,
              attributes: ["type", "original_title"],
              left: true,
              where: { record_status: "active" },
              required: false,
            },
          ],
          {
            title_id: webtoonsId,
            season_id: seasonId,
            status: "active",
            image_category: "image",
            original_name: {
              [Op.ne]: null,
            },
            episode_id: {
              [Op.eq]: null,
            },
          },
          [
            "id",
            "title_id",
            "original_name",
            "file_name",
            "url",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
        ),
        paginationService.pagination(
          {
            page: 1,
            limit: 6,
            sortBy: "id",
            sortOrder: "desc",
          },
          model.titleImage,
          [
            {
              model: model.title,
              attributes: ["type", "original_title"],
              left: true,
              where: { record_status: "active" },
              required: false,
            },
          ],
          {
            title_id: webtoonsId,
            season_id: seasonId,
            status: "active",
            image_category: "poster_image",
            original_name: {
              [Op.ne]: null,
            },
            episode_id: {
              [Op.eq]: null,
            },
          },
          [
            "id",
            "title_id",
            "original_name",
            "file_name",
            "url",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
        ),
        model.titleKeyword.findAll({
          where: {
            title_id: webtoonsId,
            season_id: seasonId,
            keyword_type: "news",
            status: "active",
          },
          attributes: ["id", "keyword"],
        }),
        model.titleWatchOn.findAll({
          attributes: ["title_id", "type", "provider_id", "movie_id"],
          where: { title_id: webtoonsId, season_id: seasonId, type: "read", status: "active" },
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

    // Episode list
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
            url:
              eachRow.dataValues.episodeTranslations &&
              eachRow.dataValues.episodeTranslations.length > 0 &&
              eachRow.dataValues.episodeTranslations[0].dataValues.url
                ? eachRow.dataValues.episodeTranslations[0].dataValues.url
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

    const characterAttributes = [
      "creditable_id",
      "department",
      "creditable_type",
      "character_name",
      "job",
      "list_order",
    ];
    const characterIncludeQuery = [
      {
        model: model.creditableTranslation,
        attributes: [
          "id",
          "character_name",
          [
            fn("REPLACE", col("character_image"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
            "character_image",
          ],
          "site_language",
          "description",
        ],
        left: true,
        where: { status: "active" },
        required: true,
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
    ];

    const conditionCharacter = {
      creditable_id: webtoonsId,
      season_id: seasonId,
      department: "character",
      status: "active",
      creditable_type: "title",
    };
    searchParams.page = 1;
    searchParams.limit = 5;
    searchParams.sortOrder = "ASC";
    searchParams.sortBy = "list_order";

    const characterResultData = await paginationService.pagination(
      searchParams,
      model.creditable,
      characterIncludeQuery,
      conditionCharacter,
      characterAttributes,
    );
    const characterCrewList = [];
    if (characterResultData.count > 0) {
      for (const eachRow of characterResultData.rows) {
        if (eachRow) {
          const record = {
            id: "",
            name:
              eachRow.creditableTranslations &&
              eachRow.creditableTranslations.length > 0 &&
              eachRow.creditableTranslations[0].character_name
                ? eachRow.creditableTranslations[0].character_name
                : "",
            description:
              eachRow.creditableTranslations &&
              eachRow.creditableTranslations.length > 0 &&
              eachRow.creditableTranslations[0].description
                ? eachRow.creditableTranslations[0].description
                : "",

            designation: "",
            image:
              eachRow.creditableTranslations &&
              eachRow.creditableTranslations[0] &&
              eachRow.creditableTranslations[0].character_image
                ? eachRow.creditableTranslations[0].character_image.replace(
                    "p/original",
                    `p/${peopleImageW}`,
                  )
                : "",
          };
          characterCrewList.push(record);
        }
      }
    }
    if (characterCrewList.length < 5) {
      const crewLimit = 5 - characterCrewList.length;
      const peopleConditionCrew = {
        creditable_id: webtoonsId,
        season_id: seasonId,
        department: "crew",
        status: "active",
        creditable_type: "title",
      };
      const peopleAttributes = [
        "people_id",
        "creditable_id",
        "department",
        "creditable_type",
        "character_name",
        "job",
        "list_order",
      ];
      const peopleIncludeQuery = [
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
          const departmentType = eachRow.job;
          const record = {
            id: eachRow.people_id ? eachRow.people_id : "",
            name:
              eachRow.person.peopleTranslations[0] && eachRow.person.peopleTranslations[0].name
                ? eachRow.person.peopleTranslations[0].name
                : "",
            description: "",
            designation: departmentType ? departmentType : "",
            image:
              eachRow.person.peopleImages[0] && eachRow.person.peopleImages[0].path
                ? eachRow.person.peopleImages[0].path.replace("p/original", `p/${peopleImageW}`)
                : "",
          };
          characterCrewList.push(record);
        }
      }
    }

    // Media for videos
    videoResultData = videoResult;
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
    imageResultData = imageResult;
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
    posterResultData = posterResult;
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
      }
    }

    if (readData) {
      let list = [];
      for (const eachRow of readData) {
        if (eachRow) {
          const record = {
            id: eachRow.ottServiceProvider.id ? eachRow.ottServiceProvider.id : "",
            link:
              eachRow.ottServiceProvider.provider_url && eachRow.movie_id
                ? await generalHelper.generateWtReadOttUrl(
                    eachRow.ottServiceProvider.provider_url,
                    {
                      search_params_values: {
                        ID: eachRow.movie_id,
                        KOTITLE: titleName,
                        SEARCHTEXT: "",
                      },
                    },
                  )
                : await generalHelper.generateWtReadOttUrl(
                    eachRow.ottServiceProvider.provider_search_url,
                    {
                      search_params_values: {
                        ID: "",
                        KOTITLE: titleName,
                        SEARCHTEXT: titleName,
                      },
                    },
                    "search",
                  ),
            icon: eachRow.ottServiceProvider.logo_path
              ? await generalHelper.generateWtLogoUrl(req, eachRow.ottServiceProvider.logo_path)
              : "",
          };
          list.push(record);
        }
      }
      readList = list;
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
      getInformations.seasons[0].seasonTranslations[0].summary
        ? getInformations.seasons[0].seasonTranslations[0].summary
        : "";
    plotDetails =
      plotDetails == "" &&
      getInformations.seasons &&
      getInformations.seasons.length > 0 &&
      getInformations.seasons[0] &&
      getInformations.seasons[0].seasonTranslations &&
      getInformations.seasons[0].seasonTranslations.length > 0 &&
      getInformations.seasons[0].seasonTranslations[1] &&
      getInformations.seasons[0].seasonTranslations[1].summary
        ? getInformations.seasons[0].seasonTranslations[1].summary
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
      character_crew_list: characterCrewList,
      media: {
        videos: videoResultData.rows,
        images: imageResultData.rows,
        poster_images: posterResultData.rows,
      },
      related_articles: articleList,
      related_articles_details_url: zapzeeLink,
      read: readList,
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (seasonId, webtoonsId, language) => {
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
    where: { id: webtoonsId, type: "webtoons", record_status: "active" },
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
