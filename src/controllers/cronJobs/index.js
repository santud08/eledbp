import * as cron from "node-cron";
import * as schedule from "./schedule/index.js";

export const schedulers = () => {
  cron.schedule("*/1 * * * * *", () => {
    console.log("cron runs in each 1 sec");
    schedule.updateDataFromScheduler();
    schedule.updateSearchDbData();
  });

  cron.schedule("*/5 * * * * *", () => {
    console.log("cron runs in each 5 sec");
    schedule.getTmdbImportData();
  });

  cron.schedule("0 0 */1 * * *", () => {
    console.log("cron runs in each 1 hour");
    schedule.updateNews("movie");
    schedule.updateNews("tv_show");
    schedule.updateNews("webtoon");
    schedule.updatePeoplePopularity();
    schedule.updateTitlePopularity();
    schedule.updateTitleAverageRating();
    schedule.updatePeopleKoreanBirthPlace();
  });

  cron.schedule(
    "00 00 08 * * *",
    () => {
      console.log("cron runs in each day 8 AM UTC");
      schedule.getTvNetworkFile();
    },
    { timezone: "Etc/UTC" },
  );

  cron.schedule(
    "00 15 08 * * *",
    () => {
      console.log("cron runs in each day 8:15 AM UTC");
      schedule.getTvNetworkList();
    },
    { timezone: "Etc/UTC" },
  );

  //video data update runs at each 1 min
  cron.schedule("0 */10 * * * *", () => {
    schedule.updateVimeoVideo();
    schedule.updateYoutubeVideo();
    console.log("cron runs in each 10 mins interval");
  });

  //testing
  // cron.schedule("00 30 11 * * *", () => {
  //   console.log("cron runs 11:30 UTC");
  //   schedule.updatePeoplePopularity();
  //   schedule.updateTitlePopularity();
  //   schedule.updateTitleAverageRating();
  //   schedule.updatePeopleKoreanBirthPlace();
  // });
};
