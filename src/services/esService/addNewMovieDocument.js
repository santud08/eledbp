import model from "../../models/index.js";
import { Op, fn, col } from "sequelize";
import { searchClient, envs, isSearchClient } from "../../config/index.js";

/**
 * addNewMovieDocument
 * @param id // id of the new document to be added
 * @param indexName // index name
 */

export const addNewMovieDocument = async (id, indexName) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }

    const movieId = id;
    const indexValue = indexName;
    let movieElement = {};
    const movieData = await model.title.findOne({
      attributes: ["id", "uuid", "type", "release_date", "calculate_popularity"],
      include: [
        {
          model: model.titleTranslation,
          attributes: ["title_id", "name", "aka", "description", "site_language", "status"],
          left: true,
          required: true,
        },
        {
          model: model.titleReRelease,
          attributes: ["title_id", "re_release_date", "status"],
          left: true,
          where: {
            status: "active",
          },
          separate: true,
          order: [["re_release_date", "DESC"]],
          required: false,
          limit: 1,
        },
        {
          model: model.titleKeyword,
          attributes: ["title_id", "keyword", "status"],
          left: true,
          where: {
            status: "active",
            keyword_type: "search",
          },
          required: false,
        },
        {
          model: model.titleImage,
          attributes: [
            "title_id",
            "file_name",
            "url",
            "source",
            [fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "path"],
          ],
          left: true,
          where: {
            image_category: "poster_image",
            is_main_poster: "y",
            episode_id: null,
            original_name: {
              [Op.ne]: null,
            },
          },
          required: false,
          separate: true, //get the recently added image
          order: [["id", "DESC"]],
        },
      ],
      where: {
        type: "movie",
        record_status: "active",
        id: movieId,
      },
      subQuery: true,
    });

    if (movieData) {
      let nameEnglish = "";
      let descriptionEnglish = "";
      let nameKorean = "";
      let descriptionKorean = "";
      let reReleaseDate = "";
      let posterImage = "";
      let keywordArry = [];
      let searchData = {};
      let movieResultData = {};
      let sortingFiledsData = {};

      movieElement.id = movieData.id ? movieData.id : id;
      movieElement.uuid = movieData.uuid ? movieData.uuid : null;
      movieElement.type = movieData.type ? movieData.type : "movie";

      if (movieData.titleTranslations.length > 0) {
        for (const translationData of movieData.titleTranslations) {
          if (translationData.site_language == "en") {
            nameEnglish = translationData.name ? translationData.name : null;
            descriptionEnglish = translationData.description ? translationData.description : null;
          }
          if (translationData.site_language == "ko") {
            nameKorean = translationData.name ? translationData.name : null;
            descriptionKorean = translationData.description ? translationData.description : null;
          }
        }

        searchData.name_en = nameEnglish ? nameEnglish : null;
        searchData.name_ko = nameKorean ? nameKorean : null;
        searchData.aka = movieData.titleTranslations[0].aka
          ? movieData.titleTranslations[0].aka
          : null;
      }
      if (movieData.titleReReleases.length > 0) {
        reReleaseDate = movieData.titleReReleases[0].re_release_date
          ? movieData.titleReReleases[0].re_release_date
          : null;
      }
      if (movieData.titleImages.length > 0) {
        posterImage = movieData.titleImages[0].path ? movieData.titleImages[0].path : null;
      }

      if (movieData.titleKeywords.length > 0) {
        for (const keywordData of movieData.titleKeywords) {
          if (keywordData.keyword) {
            keywordArry.push(keywordData.keyword);
          }
        }
      }
      searchData.keywords = keywordArry;

      // -----------------------------Result data :
      movieResultData.en = {
        name: nameEnglish ? nameEnglish : nameKorean,
        description: descriptionEnglish ? descriptionEnglish : descriptionKorean,
      };
      movieResultData.ko = {
        name: nameKorean ? nameKorean : nameEnglish,
        description: descriptionKorean ? descriptionKorean : descriptionEnglish,
      };

      movieResultData.poster_image = posterImage ? posterImage : null;
      movieResultData.release_date = reReleaseDate
        ? reReleaseDate
        : movieData.release_date
        ? movieData.release_date
        : null;

      // -----------------------------sorting fields
      sortingFiledsData.popularity = movieData.calculate_popularity
        ? movieData.calculate_popularity
        : null; // popularity logic function field
      sortingFiledsData.release_date = movieResultData.release_date;

      movieElement.search = searchData;
      movieElement.results = movieResultData;
      movieElement.sorting_fileds = sortingFiledsData;
    }

    if (Object.keys(movieElement).length > 0) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexValue });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexValue,
          body: {
            query: {
              match: {
                id: movieId,
              },
            },
          },
        });
        if (docSearch.hits.total.value > 0) {
          if (docSearch.hits.hits.length > 0) {
            const documentId = docSearch.hits.hits[0]._id ? docSearch.hits.hits[0]._id : null;
            // check for document already exist
            // 1. If exist update the document
            // 2. Else Add a new document to the index
            if (documentId) {
              const res = await searchClient.update({
                index: indexValue,
                id: documentId,
                body: {
                  // New document data you want to update to
                  doc: movieElement,
                },
              });
              return res
                ? { status: "success", message: "document is updated" }
                : { status: "error", message: "something is wrong. document is not updated" };
            } else {
              const res = await searchClient.index({
                index: indexValue,
                body: movieElement,
              });
              return res
                ? { status: "success", message: "document is Created" }
                : { status: "error", message: "something is wrong. document is not Created" };
            }
          } else {
            return { status: "error", message: "Index data not found" };
          }
        } else {
          const res = await searchClient.index({
            index: indexValue,
            body: movieElement,
          });
          return res
            ? { status: "success", message: "document is Created" }
            : { status: "error", message: "something is wrong. document is not Created" };
        }
      } else {
        return { status: "error", message: "Index not found" };
      }
    } else {
      return { status: "error", message: "Index Data not found" };
    }
  } catch (error) {
    console.log(error);
    return { status: "sys_error", message: error };
  }
};
