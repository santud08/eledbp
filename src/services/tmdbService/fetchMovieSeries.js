import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import model from "../../models/index.js";
import { fn, col } from "sequelize";

/**
 * fetchMovieSeries
 * fetch the movie series list
 * @param collectionId - tmdb collection id
 * @dataType- return data type full/format
 * @param language - language
 */
export const fetchMovieSeries = async (collectionId, dataType, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    const API_URL = `${TMDB_APIS.MOVIE_COLLECTION_API_URL}/${collectionId}`;

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const axiosConfig = {
      method: "get",
      url: `${API_URL}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json;charset=utf-8",
      },
      httpsAgent: agent,
      params: searchParams,
    };
    const result = await axios(axiosConfig).then((results) => {
      if (results) {
        if (results.data) {
          return results.data;
        } else {
          return [];
        }
      } else {
        return [];
      }
    });
    const searchResult = { results: [] };
    if (result) {
      if (
        result.parts &&
        result.parts != "undefined" &&
        result.parts != null &&
        result.parts.length > 0
      ) {
        const results = [];
        for (const movie of result.parts) {
          if (movie) {
            const movieResults = {};
            const movieResultsInfo = {};
            const getTittle = await model.title.findOne({
              attributes: ["id", "type", "record_status"],
              where: { tmdb_id: movie.id, record_status: "active", type: "movie" },
              include: [
                {
                  model: model.titleTranslation,
                  attributes: ["title_id", "name", "description"],
                  left: true,
                  where: { status: "active", site_language: language },
                  required: false,
                },
                {
                  model: model.titleImage,
                  attributes: [
                    "title_id",
                    [
                      fn(
                        "REPLACE",
                        col("titleImages.file_name"),
                        `${envs.s3.BUCKET_URL}`,
                        `${envs.aws.cdnUrl}`,
                      ),
                      "file_name",
                    ],
                    "url",
                    "path",
                    "source",
                  ],
                  left: true,
                  where: {
                    site_language: language,
                    image_category: "poster_image",
                    is_main_poster: "y",
                    status: "active",
                  },
                  required: false,
                },
              ],
            });
            if (getTittle && getTittle != null && getTittle != "undefined") {
              movieResults.title_id = getTittle.id;
              movieResults.title_name =
                getTittle.titleTranslations &&
                getTittle.titleTranslations.length > 0 &&
                getTittle.titleTranslations[0].name
                  ? getTittle.titleTranslations[0].name
                  : "";
              movieResults.title_poster =
                getTittle.titleImages &&
                getTittle.titleImages.length > 0 &&
                getTittle.titleImages[0].path
                  ? getTittle.titleImages[0].path
                  : "";
              movieResults.tmdb_id = "";
            } else {
              movieResults.title_id = "";
              movieResults.title_name = movie.title;
              movieResults.title_poster = movie.poster_path
                ? `${TMDB_APIS.IMAGES.secure_base_url}original${movie.poster_path}`
                : "";
              movieResults.tmdb_id = movie.id;
            }
            movieResultsInfo.tmdb_id = movie.id;
            movieResultsInfo.backdrop_path = movie.backdrop_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${movie.backdrop_path}`
              : "";

            delete movie.id;
            delete movie.title;
            delete movie.backdrop_path;
            delete movie.poster_path;
            if (dataType == "format") {
              results.push({ ...movieResults });
            } else {
              results.push({ ...movieResults, ...movieResultsInfo, ...movie });
            }
          }
        }
        searchResult.results = results;
      }
    }
    return searchResult;
  } catch (error) {
    return { results: [] };
  }
};
