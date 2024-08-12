import { tmdbService } from "../../services/index.js";

/**
 * getTmdbRefreshPrimaryDetails
 * @param tmdbId
 * @param language
 */
export const getTmdbRefreshPrimaryDetails = async (tmdbId, language) => {
  try {
    let tmdbData = {};
    let tmdbDataDetails = {};

    // Get TMDB Details
    if (tmdbId) {
      const tmdbResults = await tmdbService.fetchPeopleDetails(tmdbId, language);
      tmdbData = tmdbResults.results ? tmdbResults.results : "";
      tmdbDataDetails.tmdb_id = tmdbData && tmdbData.tmdb_id ? tmdbData.tmdb_id : "";
      tmdbDataDetails.imdb_id = tmdbData && tmdbData.imdb_id ? tmdbData.imdb_id : "";
      tmdbDataDetails.name = tmdbData && tmdbData.people_name ? tmdbData.people_name : "";
      tmdbDataDetails.birth_day = tmdbData && tmdbData.birth_day ? tmdbData.birth_day : "";
      tmdbDataDetails.death_day = tmdbData && tmdbData.death_day ? tmdbData.death_day : "";
      tmdbDataDetails.aka = tmdbData && tmdbData.aka ? tmdbData.aka : "";
      tmdbDataDetails.biography = tmdbData && tmdbData.biography ? tmdbData.biography : "";
      tmdbDataDetails.poster = tmdbData && tmdbData.profile_image ? tmdbData.profile_image : "";
      tmdbDataDetails.official_site = tmdbData && tmdbData.homepage ? tmdbData.homepage : "";
      tmdbDataDetails.gender =
        tmdbData && tmdbData.gender && tmdbData.gender == 2
          ? "male"
          : tmdbData && tmdbData.gender && tmdbData.gender == 1
          ? "female"
          : "";
    }
    tmdbDataDetails.job = tmdbData && tmdbData.role_name ? tmdbData.role_name : "";
    tmdbDataDetails.place_of_birth =
      tmdbData && tmdbData.place_of_birth ? tmdbData.place_of_birth : "";

    return tmdbDataDetails;
  } catch (error) {
    console.log("error", error);
    return {};
  }
};
