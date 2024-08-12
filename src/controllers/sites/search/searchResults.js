import { searchService, userService } from "../../../services/index.js";
import { PAGINATION_LIMIT, PEOPLE_SETTINGS, TITLE_SETTINGS } from "../../../utils/constants.js";
import { generalHelper } from "../../../helpers/index.js";

/* *
 * searchResults
 * for all type of search global
 * @param req
 * @param res
 * @param next
 */
export const searchResults = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchText = reqBody.search_text ? reqBody.search_text.trim() : "";
    const searchTab = reqBody.search_type ? reqBody.search_type : "";
    const sortBy = reqBody.sort_by ? reqBody.sort_by : "";
    const sortingOrder = reqBody.sort_order ? reqBody.sort_order : "ASC";
    const isFirst = reqBody.is_first ? reqBody.is_first : "yes";
    const language = req.accept_language;
    const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
    const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
    let activeTab = searchTab;
    let resultData = { count: 0, rows: [] };
    let movieQuery = {},
      tvQuery = {},
      webtoonsQuery = {},
      peopleQuery = {},
      awardQuery = {},
      tagQuery = {},
      companyQuery = {},
      videoQuery = {};
    let movieSortOrder = [],
      tvSortOrder = [],
      webtoonsSortOrder = [],
      peopleSortOrder = [],
      awardSortOrder = [],
      tagSortOrder = [],
      companySortOrder = [],
      videoSortOrder = [];
    let movieIndexName = "",
      tvIndexName = "",
      webtoonsIndexName = "",
      peopleIndexName = "",
      awardIndexName = "",
      tagIndexName = "",
      companyIndexName = "",
      videoIndexName = "";

    if (searchText) {
      // Should query for all the tabs:
      let shouldQuery = [];
      const words = searchText.split(" ");
      const englishRegex = /^[A-Za-z\s]+$/;
      let wetEn = 5;
      let wetKo = 5;
      if (englishRegex.test(searchText)) {
        wetEn = 15;
        wetKo = 5;
      } else {
        wetEn = 5;
        wetKo = 15;
      }
      // Span Term Query :
      const spanTermEnQueries = words.map((word) => ({
        span_term: { "search.name_en": word.toLowerCase() },
      }));
      const spanTermKoQueries = words.map((word) => ({
        span_term: { "search.name_ko": word.toLowerCase() },
      }));
      const spanTermAkaQueries = words.map((word) => ({
        span_term: { "search.aka": word.toLowerCase() },
      }));
      const spanTermKeywordsQueries = words.map((word) => ({
        span_term: { "search.keywords": word.toLowerCase() },
      }));

      // span near Query:
      const spanNearEnQuery = {
        span_near: {
          clauses: spanTermEnQueries,
          slop: 0, // Adjust the slop as needed
          in_order: true,
        },
      };
      const spanNearKoQuery = {
        span_near: {
          clauses: spanTermKoQueries,
          slop: 0, // Adjust the slop as needed
          in_order: true,
        },
      };

      const spanNearAkaQuery = {
        span_near: {
          clauses: spanTermAkaQueries,
          slop: 0, // Adjust the slop as needed
          in_order: true,
        },
      };

      const spanNearKeywordsQuery = {
        span_near: {
          clauses: spanTermKeywordsQueries,
          slop: 0, // Adjust the slop as needed
          in_order: true,
        },
      };

      shouldQuery.push(spanNearEnQuery, spanNearKoQuery);

      // AKA and Keywords search are required for movies,tv_shows,people,webtoons
      if (
        searchTab == "movies" ||
        searchTab == "tv_shows" ||
        searchTab == "people" ||
        searchTab == "webtoons"
      ) {
        shouldQuery.push(spanNearAkaQuery, spanNearKeywordsQuery);
      }

      /* Multimatch Query for "and" functionality 
      eg: search term - "the sense" , check all the fields for "the" and "sense" search
      */
      const multiMatch = {
        multi_match: {
          query: `${searchText}`,
          //fields: ["search.name_en^3", "search.name_ko^3", "search.aka", "search.keywords"],
          fields: [
            `search.name_en^${wetEn}`,
            `search.name_ko^${wetKo}`,
            "search.aka",
            "search.keywords",
          ],
          type: "best_fields",
          operator: "and",
        },
      };
      const constantScore = {
        constant_score: {
          filter: {
            term: {
              "search.keywords": 0,
            },
          },
          boost: 0,
        },
      };
      const constantScore1 = {
        constant_score: {
          filter: {
            term: {
              "search.aka": 0,
            },
          },
          boost: 0,
        },
      };
      shouldQuery.push(multiMatch);
      shouldQuery.push(constantScore);
      shouldQuery.push(constantScore1);

      // Prefix query needed only for words length > 1
      let prefixQuery = {
        bool: {
          should: [
            {
              prefix: {
                "search.name_en": `${searchText.toLowerCase()}`,
              },
            },
            {
              prefix: {
                "search.name_ko": `${searchText.toLowerCase()}`,
              },
            },
          ],
        },
      };
      if (words.length < 2) {
        shouldQuery.push(prefixQuery);
      }

      // Ordering Conditions and Query for different Sections
      if (searchTab == "movies" || isFirst == "yes") {
        //movies
        movieIndexName = "search-movie";
        if (sortBy == "oldest" || sortBy == "latest") {
          movieSortOrder.push({
            "sorting_fileds.release_date": {
              order: sortingOrder,
            },
          });
        } else if (sortBy == "popularity") {
          movieSortOrder.push({
            "sorting_fileds.popularity": {
              order: sortingOrder,
            },
          });
        } else if (sortBy == "default") {
          // Elastic search relevent score as per the seach text that matches max field
          movieSortOrder.push({
            _score: {
              order: sortingOrder,
            },
          });

          movieSortOrder.push({
            "sorting_fileds.popularity": {
              order: "desc",
            },
          });
        } else {
          movieSortOrder.push({
            _score: {
              order: "desc",
            },
          });
        }

        // Query :
        movieQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      if (searchTab == "tv_shows" || isFirst == "yes") {
        //tv shows
        tvIndexName = "search-tv";
        if (sortBy == "default") {
          // Elastic search relevent score as per the seach text that matches max field
          tvSortOrder.push({
            _score: {
              order: sortingOrder,
            },
          });
          tvSortOrder.push({
            "sorting_fileds.popularity": {
              order: "desc",
            },
          });
        } else if (sortBy == "oldest" || sortBy == "latest") {
          tvSortOrder.push({
            "sorting_fileds.release_date": {
              order: sortingOrder,
            },
          });
        } else if (sortBy == "popularity") {
          tvSortOrder.push({
            "sorting_fileds.popularity": {
              order: sortingOrder,
            },
          });
        } else {
          // Elastic search relevent score as per the seach text that matches max field
          tvSortOrder.push({
            _score: {
              order: "desc",
            },
          });
        }

        // Query:
        tvQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      //
      const webtoonHide = await userService.checkUserWebtoonMenu(req);
      const videoHide = await userService.checkUserVideoMenu(req);
      if ((searchTab == "webtoons" || isFirst == "yes") && !webtoonHide) {
        //webtoons
        webtoonsIndexName = "search-webtoons";
        if (sortBy == "default") {
          // Elastic search relevent score as per the seach text that matches max field
          webtoonsSortOrder.push({
            _score: {
              order: sortingOrder,
            },
          });
          webtoonsSortOrder.push({
            "sorting_fileds.popularity": {
              order: "desc",
            },
          });
        } else if (sortBy == "oldest" || sortBy == "latest") {
          webtoonsSortOrder.push({
            "sorting_fileds.release_date": {
              order: sortingOrder,
            },
          });
        } else if (sortBy == "popularity") {
          webtoonsSortOrder.push({
            "sorting_fileds.popularity": {
              order: sortingOrder,
            },
          });
        } else {
          // Elastic search relevent score as per the seach text that matches max field
          webtoonsSortOrder.push({
            _score: {
              order: "desc",
            },
          });
        }
        webtoonsQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      if ((searchTab == "videos" || isFirst == "yes") && !videoHide) {
        //videos
        videoIndexName = "search-video";
        if (sortBy == "oldest" || sortBy == "latest") {
          videoSortOrder.push({
            "sorting_fileds.registration_date": {
              order: sortingOrder,
            },
          });
        } else if (sortBy == "popularity") {
          videoSortOrder.push({
            "sorting_fileds.popularity": {
              order: sortingOrder,
            },
          });
        } else if (sortBy == "default") {
          // Elastic search relevent score as per the seach text that matches max field
          videoSortOrder.push({
            _score: {
              order: sortingOrder,
            },
          });

          videoSortOrder.push({
            "sorting_fileds.popularity": {
              order: "desc",
            },
          });
        } else {
          videoSortOrder.push({
            _score: {
              order: "desc",
            },
          });
        }

        // Query:
        videoQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      if (searchTab == "people" || isFirst == "yes") {
        peopleIndexName = "search-people";
        if (sortBy == "default") {
          // Elastic search relevent score as per the seach text that matches max field
          peopleSortOrder.push({ _score: { order: sortingOrder } });

          peopleSortOrder.push({
            "sorting_fileds.popularity": {
              order: "desc",
            },
          });
        } else if (sortBy == "birth_year") {
          peopleSortOrder.push({
            "sorting_fileds.birth_date": {
              order: sortingOrder,
            },
          });
        } else if (sortBy == "popularity") {
          peopleSortOrder.push({
            "sorting_fileds.popularity": {
              order: sortingOrder,
            },
          });
        } else {
          // Elastic search relevent score as per the seach text that matches max field
          peopleSortOrder.push({ _score: { order: "desc" } });
          peopleSortOrder.push({
            "sorting_fileds.popularity": {
              order: sortingOrder,
            },
          });
        }
        // Query:
        peopleQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      if ((searchTab == "award" || isFirst == "yes") && !webtoonHide) {
        //award
        awardIndexName = "search-award";
        if (sortBy == "alphabetic") {
          awardSortOrder.push({
            "sorting_fileds.name_en": {
              order: sortingOrder,
            },
          });
        } else {
          // Elastic search relevent score as per the seach text that matches max field
          awardSortOrder.push({
            _score: {
              order: "desc",
            },
          });
        }
        //Query :
        awardQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      if (searchTab == "tags" || isFirst == "yes") {
        //tags
        tagIndexName = "search-tag";
        if (sortBy == "alphabetic") {
          tagSortOrder.push({
            "sorting_fileds.name_en": {
              order: sortingOrder,
            },
          });
        } else {
          // Elastic search relevent score as per the seach text that matches max field
          tagSortOrder.push({
            _score: {
              order: "desc",
            },
          });
        }
        //Query:
        tagQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      if (searchTab == "companies" || isFirst == "yes") {
        //companies
        companyIndexName = "search-company";
        if (sortBy == "alphabetic") {
          companySortOrder.push({
            "sorting_fileds.name_en": {
              order: sortingOrder,
            },
          });
        } else {
          // Elastic search relevent score as per the seach text that matches max field
          companySortOrder.push({
            _score: {
              order: "desc",
            },
          });
        }
        // Query:
        companyQuery = {
          bool: {
            should: shouldQuery,
          },
        };
      }
      let movieCount = 0,
        peopleCount = 0,
        awardCount = 0,
        tagCount = {},
        companyCount = 0,
        videoCount = 0,
        tvCount = 0,
        webtoonsCount = 0,
        movieMenuActive = "y",
        peopleMenuActive = "n",
        awardMenuActive = "n",
        tagMenuActive = "n",
        companyMenuActive = "n",
        videoMenuActive = "n",
        tvMenuActive = "n",
        webtoonsMenuActive = "n",
        menuActive = "n";

      if (isFirst == "yes") {
        [
          movieCount,
          peopleCount,
          tagCount,
          companyCount,
          tvCount,
          webtoonsCount,
          awardCount,
          videoCount,
        ] = await Promise.all([
          searchService.getSearchCount(movieIndexName, movieQuery),
          searchService.getSearchCount(peopleIndexName, peopleQuery),
          searchService.getSearchCount(tagIndexName, tagQuery),
          searchService.getSearchCount(companyIndexName, companyQuery),
          searchService.getSearchCount(tvIndexName, tvQuery),
          searchService.getSearchCount(webtoonsIndexName, webtoonsQuery),
          searchService.getSearchCount(awardIndexName, awardQuery),
          searchService.getSearchCount(videoIndexName, videoQuery),
        ]);

        if (movieCount > 0) {
          if (searchTab == "movies") {
            movieMenuActive = "y";
            menuActive = "y";
            activeTab = searchTab;
          } else {
            movieMenuActive = "n";
            menuActive = "n";
          }
        } else {
          movieMenuActive = "n";
          menuActive = "n";
        }
        if (tvCount > 0) {
          if (searchTab == "tv_shows") {
            tvMenuActive = "y";
            menuActive = "y";
            activeTab = searchTab;
          }
          if (menuActive == "n") {
            tvMenuActive = "y";
            menuActive = "y";
            activeTab = "tv_shows";
          }
        }
        if (webtoonsCount > 0 && !webtoonHide) {
          if (searchTab == "webtoons") {
            webtoonsMenuActive = "y";
            menuActive = "y";
            activeTab = searchTab;
          }
          if (menuActive == "n") {
            webtoonsMenuActive = "y";
            menuActive = "y";
            activeTab = "webtoons";
          }
        }
        if (videoCount > 0 && !videoHide) {
          if (searchTab == "videos") {
            videoMenuActive = "y";
            menuActive = "y";
            activeTab = searchTab;
          }
          if (menuActive == "n") {
            videoMenuActive = "y";
            menuActive = "y";
            activeTab = "videos";
          }
        }
        if (peopleCount > 0) {
          if (searchTab == "people") {
            peopleMenuActive = "y";
            menuActive = "y";
            activeTab = searchTab;
          }
          if (menuActive == "n") {
            peopleMenuActive = "y";
            menuActive = "y";
            activeTab = "people";
          }
        }
        if (awardCount > 0 && !webtoonHide) {
          if (searchTab == "award") {
            awardMenuActive = "y";
            menuActive = "y";
            activeTab = searchTab;
          }
          if (menuActive == "n") {
            awardMenuActive = "y";
            menuActive = "y";
            activeTab = "award";
          }
        }
        if (typeof tagCount == "object") {
          if (tagCount.length > 0) {
            if (searchTab == "tags") {
              tagMenuActive = "y";
              menuActive = "y";
              activeTab = searchTab;
            }
            if (menuActive == "n") {
              tagMenuActive = "y";
              menuActive = "y";
              activeTab = "tags";
            }
          }
        } else {
          if (tagCount > 0) {
            if (searchTab == "tags") {
              tagMenuActive = "y";
              menuActive = "y";
              activeTab = searchTab;
            }
            if (menuActive == "n") {
              tagMenuActive = "y";
              menuActive = "y";
              activeTab = "tags";
            }
          }
        }
        if (companyCount > 0) {
          if (searchTab == "companies") {
            companyMenuActive = "y";
            menuActive = "y";
            activeTab = searchTab;
          }

          if (menuActive == "n") {
            companyMenuActive = "y";
            menuActive = "y";
            activeTab = "companies";
          }
        }
      }
      //result query
      //movie query
      if (activeTab == "movies") {
        const movieData = await searchService.getSearchData(
          movieIndexName,
          offset,
          limit,
          movieQuery,
          movieSortOrder,
        );
        if (movieData && movieData.status == "success" && movieData.results.count > 0) {
          let movieResult = [];
          resultData.count = movieData.results.count;
          for (const eachRow of movieData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                title: "",
                overview: "",
                release_date: "",
                poster_image: "",
              };
              if (eachRow._source.results) {
                record.title =
                  eachRow._source.results[`${language}`] &&
                  eachRow._source.results[`${language}`]["name"]
                    ? eachRow._source.results[`${language}`]["name"]
                    : "";
                record.overview =
                  eachRow._source.results[`${language}`] &&
                  eachRow._source.results[`${language}`]["description"]
                    ? eachRow._source.results[`${language}`]["description"]
                    : "";
                record.release_date = eachRow._source.results.release_date
                  ? eachRow._source.results.release_date
                  : "";
                record.poster_image = eachRow._source.results.poster_image
                  ? eachRow._source.results.poster_image.replace("p/original", `p/${tittleImageW}`)
                  : "";
              }
              movieResult.push(record);
            }
          }
          resultData.rows = movieResult;
        }
      }
      // movie end
      //tv query
      if (activeTab == "tv_shows") {
        const tvData = await searchService.getSearchData(
          tvIndexName,
          offset,
          limit,
          tvQuery,
          tvSortOrder,
        );

        if (tvData && tvData.status == "success" && tvData.results.count > 0) {
          let tvResult = [];
          resultData.count = tvData.results.count;
          for (const eachRow of tvData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                title: "",
                overview: "",
                release_date: "",
                poster_image: "",
              };
              if (eachRow._source.results) {
                record.title =
                  eachRow._source.results[language] && eachRow._source.results[language].name
                    ? eachRow._source.results[language].name
                    : "";
                record.overview =
                  eachRow._source.results[language] && eachRow._source.results[language].description
                    ? eachRow._source.results[language].description
                    : "";
                record.release_date = eachRow._source.results.release_date
                  ? eachRow._source.results.release_date
                  : "";
                record.poster_image = eachRow._source.results.poster_image
                  ? eachRow._source.results.poster_image.replace("p/original", `p/${tittleImageW}`)
                  : "";
              }
              tvResult.push(record);
            }
          }
          resultData.rows = tvResult;
        }
      }
      //tv end
      //webtoons query
      if (activeTab == "webtoons" && !webtoonHide) {
        const webtoonsData = await searchService.getSearchData(
          webtoonsIndexName,
          offset,
          limit,
          webtoonsQuery,
          webtoonsSortOrder,
        );

        if (webtoonsData && webtoonsData.status == "success" && webtoonsData.results.count > 0) {
          let webtoonsResult = [];
          resultData.count = webtoonsData.results.count;
          for (const eachRow of webtoonsData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                title: "",
                overview: "",
                release_date: "",
                poster_image: "",
              };
              if (eachRow._source.results) {
                record.title =
                  eachRow._source.results[language] && eachRow._source.results[language].name
                    ? eachRow._source.results[language].name
                    : "";
                record.overview =
                  eachRow._source.results[language] && eachRow._source.results[language].description
                    ? eachRow._source.results[language].description
                    : "";
                record.release_date = eachRow._source.results.release_date
                  ? eachRow._source.results.release_date
                  : "";
                record.poster_image = eachRow._source.results.poster_image
                  ? eachRow._source.results.poster_image.replace("p/original", `p/${tittleImageW}`)
                  : "";
                record.title_status = eachRow._source.results.title_status
                  ? eachRow._source.results.title_status
                  : "";
                let weeklyList = "";
                if (eachRow._source.results.weekly_telecast) {
                  const weeklyArr = await generalHelper.sortDaysOfWeek(
                    eachRow._source.results.weekly_telecast.split(","),
                  );

                  if (weeklyArr.length > 0) weeklyList = weeklyArr.join(",");
                }
                record.weekly_telecast = weeklyList;
              }
              webtoonsResult.push(record);
            }
          }
          resultData.rows = webtoonsResult;
        }
      }
      //webtoons end
      //video query
      if (activeTab == "videos" && !videoHide) {
        //video
        const videoData = await searchService.getSearchData(
          videoIndexName,
          offset,
          limit,
          videoQuery,
          videoSortOrder,
        );

        if (videoData && videoData.status == "success" && videoData.results.count > 0) {
          let videoResult = [];
          resultData.count = videoData.results.count;
          for (const eachRow of videoData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                registration_date: "",
                video_path: "",
                video_thumb: "",
                video_duration: "",
                video_title: "",
                title_name: "",
                video_source: "",
                item_id: "",
                video_for: "",
                no_of_views: "",
              };

              if (eachRow._source.results) {
                record.video_title =
                  eachRow._source.results[language] && eachRow._source.results[language].name
                    ? eachRow._source.results[language].name
                    : "";
                record.title_name =
                  eachRow._source.results[language] && eachRow._source.results[language].title_name
                    ? eachRow._source.results[language].title_name
                    : "";
                record.registration_date = eachRow._source.results.registration_date
                  ? eachRow._source.results.registration_date
                  : "";
                record.video_path = eachRow._source.results.video_path
                  ? eachRow._source.results.video_path
                  : "";
                record.video_thumb = eachRow._source.results.video_thumb
                  ? eachRow._source.results.video_thumb
                  : "";
                record.video_duration = eachRow._source.results.video_duration
                  ? eachRow._source.results.video_duration
                  : "";
                record.video_source = eachRow._source.results.video_source
                  ? eachRow._source.results.video_source
                  : "";
                record.video_for = eachRow._source.results.video_for
                  ? eachRow._source.results.video_for
                  : "";
                record.item_id = eachRow._source.results.item_id
                  ? eachRow._source.results.item_id
                  : "";
              }
              record.no_of_views =
                eachRow._source.sorting_fileds && eachRow._source.sorting_fileds.popularity
                  ? eachRow._source.sorting_fileds.popularity
                  : 0;
              videoResult.push(record);
            }
          }
          resultData.rows = videoResult;
        }
      }
      //video end
      //people query
      if (activeTab == "people") {
        const peopleData = await searchService.getSearchData(
          peopleIndexName,
          offset,
          limit,
          peopleQuery,
          peopleSortOrder,
        );

        if (peopleData && peopleData.status == "success" && peopleData.results.count > 0) {
          let peopleResult = [];
          resultData.count = peopleData.results.count;
          for (const eachRow of peopleData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                birth_date: "",
                poster: "",
                people_name: "",
                known_for:
                  eachRow._source.search && eachRow._source.search.aka
                    ? eachRow._source.search.aka
                    : "",
                work_list: [],
              };

              if (eachRow._source.results) {
                record.people_name =
                  eachRow._source.results[language] && eachRow._source.results[language].name
                    ? eachRow._source.results[language].name
                    : "";

                record.birth_date = eachRow._source.results.birth_date
                  ? eachRow._source.results.birth_date
                  : "";
                record.poster = eachRow._source.results.poster_image
                  ? eachRow._source.results.poster_image.replace("p/original", `p/${peopleImageW}`)
                  : "";
                record.work_list =
                  eachRow._source.results.work_list && eachRow._source.results.work_list[language]
                    ? eachRow._source.results.work_list[language]
                    : [];
              }
              peopleResult.push(record);
            }
          }
          resultData.rows = peopleResult;
        }
      }
      //people end
      //award query
      if (activeTab == "award" && !webtoonHide) {
        const awardData = await searchService.getSearchData(
          awardIndexName,
          offset,
          limit,
          awardQuery,
          awardSortOrder,
        );

        if (awardData && awardData.status == "success" && awardData.results.count > 0) {
          let awardResult = [];
          resultData.count = awardData.results.count;
          for (const eachRow of awardData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                name: "",
                description: "",
                date: "",
                poster_image: "",
              };
              if (eachRow._source.results) {
                record.name =
                  eachRow._source.results[language] && eachRow._source.results[language].name
                    ? eachRow._source.results[language].name
                    : "";
                record.description =
                  eachRow._source.results[language] && eachRow._source.results[language].description
                    ? eachRow._source.results[language].description
                    : "";
                record.date = eachRow._source.results.date ? eachRow._source.results.date : "";
                record.poster_image = eachRow._source.results.poster_image
                  ? eachRow._source.results.poster_image.replace("p/original", `p/${tittleImageW}`)
                  : "";
              }
              awardResult.push(record);
            }
          }
          resultData.rows = awardResult;
        }
      }
      //award end
      //tag query
      if (activeTab == "tags") {
        const tagData = await searchService.getSearchData(
          tagIndexName,
          offset,
          limit,
          tagQuery,
          tagSortOrder,
        );

        if (tagData && tagData.status == "success" && tagData.results.count > 0) {
          let tagResult = [];
          resultData.count = tagData.results.count;
          for (const eachRow of tagData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                title: "",
              };
              if (eachRow._source.results) {
                record.title =
                  eachRow._source.results[language] && eachRow._source.results[language].name
                    ? eachRow._source.results[language].name
                    : "";
              }
              tagResult.push(record);
            }
          }
          resultData.rows = tagResult;
        }
      }
      //tag end
      //companies query
      if (activeTab == "companies") {
        const companyData = await searchService.getSearchData(
          companyIndexName,
          offset,
          limit,
          companyQuery,
          companySortOrder,
        );

        if (companyData && companyData.status == "success" && companyData.results.count > 0) {
          let companyResult = [];
          resultData.count = companyData.results.count;
          for (const eachRow of companyData.results.rows) {
            if (eachRow && eachRow._source) {
              let record = {
                id: eachRow._source.id,
                name: "",
              };
              if (eachRow._source.results) {
                record.name =
                  eachRow._source.results[language] && eachRow._source.results[language].name
                    ? eachRow._source.results[language].name
                    : "";
              }
              companyResult.push(record);
            }
          }
          resultData.rows = companyResult;
        }
      }
      //end company
      // result end
      if (isFirst == "yes") {
        let menuList = [];
        if (videoHide && webtoonHide) {
          menuList = [
            {
              menu_key: "movies",
              menu_name: res.__("movies"),
              result_count: movieCount,
              menu_active: movieMenuActive,
            },
            {
              menu_key: "tv_shows",
              menu_name: res.__("tv_shows"),
              result_count: tvCount,
              menu_active: tvMenuActive,
            },
            {
              menu_key: "people",
              menu_name: res.__("people"),
              result_count: typeof peopleCount == "object" ? peopleCount.length : peopleCount,
              menu_active: peopleMenuActive,
            },
            {
              menu_key: "tags",
              menu_name: res.__("tags"),
              result_count: typeof tagCount == "object" ? tagCount.length : tagCount,
              menu_active: tagMenuActive,
            },
            {
              menu_key: "companies",
              menu_name: res.__("companies"),
              result_count: companyCount,
              menu_active: companyMenuActive,
            },
          ];
        } else if (videoHide && !webtoonHide) {
          menuList = [
            {
              menu_key: "movies",
              menu_name: res.__("movies"),
              result_count: movieCount,
              menu_active: movieMenuActive,
            },
            {
              menu_key: "tv_shows",
              menu_name: res.__("tv_shows"),
              result_count: tvCount,
              menu_active: tvMenuActive,
            },
            {
              menu_key: "webtoons",
              menu_name: res.__("webtoons"),
              result_count: webtoonsCount,
              menu_active: webtoonsMenuActive,
            },
            {
              menu_key: "people",
              menu_name: res.__("people"),
              result_count: typeof peopleCount == "object" ? peopleCount.length : peopleCount,
              menu_active: peopleMenuActive,
            },
            {
              menu_key: "award",
              menu_name: res.__("awards"),
              result_count: awardCount,
              menu_active: awardMenuActive,
            },
            {
              menu_key: "tags",
              menu_name: res.__("tags"),
              result_count: typeof tagCount == "object" ? tagCount.length : tagCount,
              menu_active: tagMenuActive,
            },
            {
              menu_key: "companies",
              menu_name: res.__("companies"),
              result_count: companyCount,
              menu_active: companyMenuActive,
            },
          ];
        } else if (!videoHide && webtoonHide) {
          menuList = [
            {
              menu_key: "movies",
              menu_name: res.__("movies"),
              result_count: movieCount,
              menu_active: movieMenuActive,
            },
            {
              menu_key: "tv_shows",
              menu_name: res.__("tv_shows"),
              result_count: tvCount,
              menu_active: tvMenuActive,
            },
            {
              menu_key: "videos",
              menu_name: res.__("videos"),
              result_count: videoCount,
              menu_active: videoMenuActive,
            },
            {
              menu_key: "people",
              menu_name: res.__("people"),
              result_count: typeof peopleCount == "object" ? peopleCount.length : peopleCount,
              menu_active: peopleMenuActive,
            },
            {
              menu_key: "award",
              menu_name: res.__("awards"),
              result_count: awardCount,
              menu_active: awardMenuActive,
            },
            {
              menu_key: "tags",
              menu_name: res.__("tags"),
              result_count: typeof tagCount == "object" ? tagCount.length : tagCount,
              menu_active: tagMenuActive,
            },
            {
              menu_key: "companies",
              menu_name: res.__("companies"),
              result_count: companyCount,
              menu_active: companyMenuActive,
            },
          ];
        } else {
          menuList = [
            {
              menu_key: "movies",
              menu_name: res.__("movies"),
              result_count: movieCount,
              menu_active: movieMenuActive,
            },
            {
              menu_key: "tv_shows",
              menu_name: res.__("tv_shows"),
              result_count: tvCount,
              menu_active: tvMenuActive,
            },
            {
              menu_key: "webtoons",
              menu_name: res.__("webtoons"),
              result_count: webtoonsCount,
              menu_active: webtoonsMenuActive,
            },
            {
              menu_key: "videos",
              menu_name: res.__("videos"),
              result_count: videoCount,
              menu_active: videoMenuActive,
            },
            {
              menu_key: "people",
              menu_name: res.__("people"),
              result_count: typeof peopleCount == "object" ? peopleCount.length : peopleCount,
              menu_active: peopleMenuActive,
            },
            {
              menu_key: "award",
              menu_name: res.__("awards"),
              result_count: awardCount,
              menu_active: awardMenuActive,
            },
            {
              menu_key: "tags",
              menu_name: res.__("tags"),
              result_count: typeof tagCount == "object" ? tagCount.length : tagCount,
              menu_active: tagMenuActive,
            },
            {
              menu_key: "companies",
              menu_name: res.__("companies"),
              result_count: companyCount,
              menu_active: companyMenuActive,
            },
          ];
        }
        res.ok({
          page: page,
          limit: limit,
          total_records: resultData.count,
          total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
          //search_type: searchTab,
          search_type: activeTab,
          menu_list: menuList,
          results: resultData.rows,
        });
      } else {
        res.ok({
          page: page,
          limit: limit,
          total_records: resultData.count,
          total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
          search_type: searchTab,
          results: resultData.rows,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};
