import model from "../../models/index.js";

/**
 * countryFormat
 * @param titleId
 * @param titleType
 * @param tmdbWatchData // watch details that are from TMDB response
 * @param seasonId
 */

export const watchOnFormat = async (titleId, titleType, tmdbWatchData, seasonId = null) => {
  try {
    let getStreamList = [],
      getRentList = [],
      getBuyList = [];
    const titleValid = await model.title.findOne({
      where: {
        id: titleId,
        type: titleType,
        record_status: "active",
      },
    });
    if (titleValid) {
      if (titleType == "movie") {
        //Watch on Details from TMDB
        //1.Stream
        if (tmdbWatchData.stream && tmdbWatchData.stream.length > 0) {
          for (const stream of tmdbWatchData.stream) {
            if (stream) {
              const record = {
                provider_id: stream.provider_id,
                movie_id: stream.movie_id,
                provider_name: stream.provider_name,
                ott_logo_path: stream.ott_logo_path,
              };
              // get the id - if provider id is already present
              const streamId = await model.titleWatchOn.findOne({
                attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
                where: {
                  title_id: titleId,
                  type: "stream",
                  provider_id: stream.provider_id,
                  status: "active",
                },
              });
              record.id = streamId && streamId.id ? streamId.id : "";
              getStreamList.push(record);
            }
          }
        }
        //2.Rent
        if (tmdbWatchData.rent && tmdbWatchData.rent.length > 0) {
          for (const rent of tmdbWatchData.rent) {
            if (rent) {
              const record = {
                provider_id: rent.provider_id,
                movie_id: rent.movie_id,
                provider_name: rent.provider_name,
                ott_logo_path: rent.ott_logo_path,
              };
              // get the id - if provider id is already present
              const rentId = await model.titleWatchOn.findOne({
                attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
                where: {
                  title_id: titleId,
                  status: "active",
                  type: "rent",
                  provider_id: rent.provider_id,
                },
              });
              record.id = rentId && rentId.id ? rentId.id : "";
              getRentList.push(record);
            }
          }
        }
        //3.Buy
        if (tmdbWatchData.buy && tmdbWatchData.buy.length > 0) {
          for (const buy of tmdbWatchData.buy) {
            if (buy) {
              const record = {
                provider_id: buy.provider_id,
                movie_id: buy.movie_id,
                provider_name: buy.provider_name,
                ott_logo_path: buy.ott_logo_path,
              };
              // get the id - if provider id is already present
              const buyId = await model.titleWatchOn.findOne({
                attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
                where: {
                  title_id: titleId,
                  status: "active",
                  type: "buy",
                  provider_id: buy.provider_id,
                },
              });
              record.id = buyId && buyId.id ? buyId.id : "";
              getBuyList.push(record);
            }
          }
        }
      } else if (titleType == "tv") {
        //Watch on Details from TMDB
        //1.Stream
        if (tmdbWatchData.stream && tmdbWatchData.stream.length > 0) {
          for (const stream of tmdbWatchData.stream) {
            if (stream) {
              let watchId = "";
              const record = {
                provider_id: stream.provider_id,
                movie_id: stream.movie_id,
                provider_name: stream.provider_name,
                ott_logo_path: stream.ott_logo_path,
              };
              if (seasonId) {
                // get the id - if provider id is already present
                const streamId = await model.titleWatchOn.findOne({
                  attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
                  where: {
                    title_id: titleId,
                    season_id: seasonId,
                    type: "stream",
                    provider_id: stream.provider_id,
                    status: "active",
                  },
                });
                watchId = streamId && streamId.id ? streamId.id : "";
              }
              record.id = watchId;
              getStreamList.push(record);
            }
          }
        }
        //2.Rent
        if (tmdbWatchData.rent && tmdbWatchData.rent.length > 0) {
          for (const rent of tmdbWatchData.rent) {
            if (rent) {
              let watchId = "";
              const record = {
                provider_id: rent.provider_id,
                movie_id: rent.movie_id,
                provider_name: rent.provider_name,
                ott_logo_path: rent.ott_logo_path,
              };
              // get the id - if provider id is already present
              if (seasonId) {
                const rentId = await model.titleWatchOn.findOne({
                  attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
                  where: {
                    title_id: titleId,
                    season_id: seasonId,
                    status: "active",
                    type: "rent",
                    provider_id: rent.provider_id,
                  },
                });
                watchId = rentId && rentId.id ? rentId.id : "";
              }

              record.id = watchId;
              getRentList.push(record);
            }
          }
        }
        //3.Buy
        if (tmdbWatchData.buy && tmdbWatchData.buy.length > 0) {
          for (const buy of tmdbWatchData.buy) {
            if (buy) {
              let watchId = "";
              const record = {
                provider_id: buy.provider_id,
                movie_id: buy.movie_id,
                provider_name: buy.provider_name,
                ott_logo_path: buy.ott_logo_path,
              };
              // get the id - if provider id is already present
              if (seasonId) {
                const buyId = await model.titleWatchOn.findOne({
                  attributes: ["id", "title_id", "movie_id", "type", "provider_id"],
                  where: {
                    title_id: titleId,
                    season_id: seasonId,
                    status: "active",
                    type: "buy",
                    provider_id: buy.provider_id,
                  },
                });
                watchId = buyId && buyId.id ? buyId.id : "";
              }
              record.id = watchId;
              getBuyList.push(record);
            }
          }
        }
      }

      return { stream: getStreamList, rent: getRentList, buy: getBuyList };
    } else {
      return { stream: [], rent: [], buy: [] };
    }
  } catch (e) {
    console.log("error", e);
    return { stream: [], rent: [], buy: [] };
  }
};
