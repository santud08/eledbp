import Sequelize from "sequelize";
import { sequelize } from "../config/index.js";
import * as emailTemplate from "./emailTemplate.js";
import * as user from "./user.js";
import * as userRole from "./userRole.js";
import * as role from "./role.js";
import * as cssTheme from "./cssTheme.js";
import * as country from "./country.js";
import * as countryTranslation from "./countryTranslation.js";
import * as department from "./department.js";
import * as departmentTranslation from "./departmentTranslation.js";
import * as departmentJob from "./departmentJob.js";
import * as departmentJobTranslation from "./departmentJobTranslation.js";
import * as cmsPage from "./cmsPage.js";
import * as contactUs from "./contactUs.js";
import * as title from "./title.js";
import * as localization from "./localization.js";
import * as titleTranslation from "./titleTranslation.js";
import * as titleImage from "./titleImage.js";
import * as titleRequestPrimaryDetails from "./titleRequestPrimaryDetails.js";
import * as ottServiceProvider from "./ottServiceProvider.js";
import * as titleRequestMedia from "./titleRequestMedia.js";
import * as people from "./people.js";
import * as creditable from "./creditable.js";
import * as peopleTranslation from "./peopleTranslation.js";
import * as tag from "./tag.js";
import * as tagTranslation from "./tagTranslation.js";
import * as tagGable from "./tagGable.js";
import * as news from "./news.js";
import * as agency from "./agency.js";
import * as agencyManager from "./agencyManager.js";
import * as agencyManagerArtist from "./agencyManagerArtist.js";
import * as video from "./video.js";
import * as agencyTranslation from "./agencyTranslation.js";
import * as agencyManagerTranslation from "./agencyManagerTranslation.js";
import * as titleRequestCredit from "./titleRequestCredit.js";
import * as titleKeyword from "./titleKeyword.js";
import * as favourites from "./favourites.js";
import * as ratings from "./ratings.js";
import * as titleCountries from "./titleCountries.js";
import * as originalWorks from "./originalWorks.js";
import * as titleWatchOn from "./titleWatchOn.js";
import * as titleRequestSeasonDetails from "./titleRequestSeasonDetails.js";
import * as titleRequestEpisodeDetails from "./titleRequestEpisodeDetails.js";
import * as relatedTitle from "./relatedTitle.js";
import * as relatedSeriesTitle from "./relatedSeriesTitle.js";
import * as tagCategory from "./tagCategory.js";
import * as tagCategoryTranslation from "./tagCategoryTranslation.js";
import * as titleRequestTag from "./titleRequestTag.js";
import * as community from "./community.js";
import * as communityLikes from "./communityLikes.js";
import * as titleReRelease from "./titleReRelease.js";
import * as season from "./season.js";
import * as episode from "./episode.js";
import * as tvNetworks from "./tvNetworks.js";
import * as titleChannelList from "./titleChannelList.js";
import * as peopleImages from "./peopleImages.js";
import * as peopleKeywords from "./peopleKeywords.js";
import * as peopleCountries from "./peopleCountries.js";
import * as peopleJobs from "./peopleJobs.js";
import * as peopleVideos from "./peopleVideos.js";
import * as peopleRequestPrimaryDetails from "./peopleRequestPrimaryDetails.js";
import * as peopleRequestMedia from "./peopleRequestMedia.js";
import * as usersActivity from "./usersActivity.js";
import * as settings from "./settings.js";
import * as topNewsMapping from "./topNewsMapping.js";
import * as importData from "./importData.js";
import * as importFiles from "./importFiles.js";
import * as exportData from "./exportData.js";
import * as worklistView from "./worklistView.js";
import * as priority from "./priority.js";
import * as searchSuggestionView from "./searchSuggestionView.js";
import * as seasonTranslation from "./seasonTranslation.js";
import * as episodeTranslation from "./episodeTranslation.js";
import * as schedulerJobs from "./schedulerJobs.js";
import * as userPoint from "./userPoint.js";
import * as level from "./level.js";
import * as awardSectors from "./awardSectors.js";
import * as awardSectorTranslations from "./awardSectorTranslations.js";
import * as shared from "./shared.js";
import * as awards from "./awards.js";
import * as awardTranslation from "./awardTranslation.js";
import * as awardImages from "./awardImages.js";
import * as userRequestReview from "./userRequestReview.js";
import * as editListView from "./editListView.js";
import * as videoListView from "./videoListView.js";
import * as imageListView from "./imageListView.js";
import * as awardRounds from "./awardRounds.js";
import * as city from "./city.js";
import * as cityTranslations from "./cityTranslations.js";
import * as awardNominees from "./awardNominees.js";
import * as videoReports from "./videoReports.js";
import * as edit from "./edit.js";
import * as editor from "./editor.js";
import * as webtoonsChannelList from "./webtoonsChannelList.js";
import * as weeklyTelecast from "./weeklyTelecast.js";
import * as creditableTranslation from "./creditableTranslation.js";
import * as permission from "./permission.js";
import * as userRolePermission from "./userRolePermission.js";
import * as schedulerProcedureJobs from "./schedulerProcedureJobs.js";
import * as activity from "./activity.js";
import * as pageVisit from "./pageVisit.js";
import * as searchActivity from "./searchActivity.js";

const db = {
  emailTemplate: emailTemplate.default(sequelize, Sequelize.DataTypes),
  user: user.default(sequelize, Sequelize.DataTypes),
  userRole: userRole.default(sequelize, Sequelize.DataTypes),
  role: role.default(sequelize, Sequelize.DataTypes),
  cssTheme: cssTheme.default(sequelize, Sequelize.DataTypes),
  country: country.default(sequelize, Sequelize.DataTypes),
  countryTranslation: countryTranslation.default(sequelize, Sequelize.DataTypes),
  department: department.default(sequelize, Sequelize.DataTypes),
  departmentTranslation: departmentTranslation.default(sequelize, Sequelize.DataTypes),
  departmentJob: departmentJob.default(sequelize, Sequelize.DataTypes),
  departmentJobTranslation: departmentJobTranslation.default(sequelize, Sequelize.DataTypes),
  cmsPage: cmsPage.default(sequelize, Sequelize.DataTypes),
  contactUs: contactUs.default(sequelize, Sequelize.DataTypes),
  title: title.default(sequelize, Sequelize.DataTypes),
  localization: localization.default(sequelize, Sequelize.DataTypes),
  titleTranslation: titleTranslation.default(sequelize, Sequelize.DataTypes),
  titleImage: titleImage.default(sequelize, Sequelize.DataTypes),
  titleRequestPrimaryDetails: titleRequestPrimaryDetails.default(sequelize, Sequelize.DataTypes),
  ottServiceProvider: ottServiceProvider.default(sequelize, Sequelize.DataTypes),
  titleRequestMedia: titleRequestMedia.default(sequelize, Sequelize.DataTypes),
  people: people.default(sequelize, Sequelize.DataTypes),
  creditable: creditable.default(sequelize, Sequelize.DataTypes),
  peopleTranslation: peopleTranslation.default(sequelize, Sequelize.DataTypes),
  tag: tag.default(sequelize, Sequelize.DataTypes),
  tagTranslation: tagTranslation.default(sequelize, Sequelize.DataTypes),
  tagGable: tagGable.default(sequelize, Sequelize.DataTypes),
  news: news.default(sequelize, Sequelize.DataTypes),
  agency: agency.default(sequelize, Sequelize.DataTypes),
  agencyManager: agencyManager.default(sequelize, Sequelize.DataTypes),
  agencyManagerArtist: agencyManagerArtist.default(sequelize, Sequelize.DataTypes),
  video: video.default(sequelize, Sequelize.DataTypes),
  agencyTranslation: agencyTranslation.default(sequelize, Sequelize.DataTypes),
  agencyManagerTranslation: agencyManagerTranslation.default(sequelize, Sequelize.DataTypes),
  titleRequestCredit: titleRequestCredit.default(sequelize, Sequelize.DataTypes),
  titleKeyword: titleKeyword.default(sequelize, Sequelize.DataTypes),
  favourites: favourites.default(sequelize, Sequelize.DataTypes),
  ratings: ratings.default(sequelize, Sequelize.DataTypes),
  titleCountries: titleCountries.default(sequelize, Sequelize.DataTypes),
  originalWorks: originalWorks.default(sequelize, Sequelize.DataTypes),
  titleWatchOn: titleWatchOn.default(sequelize, Sequelize.DataTypes),
  titleRequestSeasonDetails: titleRequestSeasonDetails.default(sequelize, Sequelize.DataTypes),
  titleRequestEpisodeDetails: titleRequestEpisodeDetails.default(sequelize, Sequelize.DataTypes),
  relatedTitle: relatedTitle.default(sequelize, Sequelize.DataTypes),
  relatedSeriesTitle: relatedSeriesTitle.default(sequelize, Sequelize.DataTypes),
  tagCategory: tagCategory.default(sequelize, Sequelize.DataTypes),
  tagCategoryTranslation: tagCategoryTranslation.default(sequelize, Sequelize.DataTypes),
  titleRequestTag: titleRequestTag.default(sequelize, Sequelize.DataTypes),
  community: community.default(sequelize, Sequelize.DataTypes),
  communityLikes: communityLikes.default(sequelize, Sequelize.DataTypes),
  titleReRelease: titleReRelease.default(sequelize, Sequelize.DataTypes),
  season: season.default(sequelize, Sequelize.DataTypes),
  episode: episode.default(sequelize, Sequelize.DataTypes),
  tvNetworks: tvNetworks.default(sequelize, Sequelize.DataTypes),
  titleChannelList: titleChannelList.default(sequelize, Sequelize.DataTypes),
  peopleImages: peopleImages.default(sequelize, Sequelize.DataTypes),
  peopleKeywords: peopleKeywords.default(sequelize, Sequelize.DataTypes),
  peopleCountries: peopleCountries.default(sequelize, Sequelize.DataTypes),
  peopleJobs: peopleJobs.default(sequelize, Sequelize.DataTypes),
  peopleVideos: peopleVideos.default(sequelize, Sequelize.DataTypes),
  peopleRequestPrimaryDetails: peopleRequestPrimaryDetails.default(sequelize, Sequelize.DataTypes),
  peopleRequestMedia: peopleRequestMedia.default(sequelize, Sequelize.DataTypes),
  usersActivity: usersActivity.default(sequelize, Sequelize.DataTypes),
  settings: settings.default(sequelize, Sequelize.DataTypes),
  topNewsMapping: topNewsMapping.default(sequelize, Sequelize.DataTypes),
  importData: importData.default(sequelize, Sequelize.DataTypes),
  importFiles: importFiles.default(sequelize, Sequelize.DataTypes),
  exportData: exportData.default(sequelize, Sequelize.DataTypes),
  worklistView: worklistView.default(sequelize, Sequelize.DataTypes),
  priority: priority.default(sequelize, Sequelize.DataTypes),
  searchSuggestionView: searchSuggestionView.default(sequelize, Sequelize.DataTypes),
  seasonTranslation: seasonTranslation.default(sequelize, Sequelize.DataTypes),
  episodeTranslation: episodeTranslation.default(sequelize, Sequelize.DataTypes),
  schedulerJobs: schedulerJobs.default(sequelize, Sequelize.DataTypes),
  userPoint: userPoint.default(sequelize, Sequelize.DataTypes),
  level: level.default(sequelize, Sequelize.DataTypes),
  awardSectors: awardSectors.default(sequelize, Sequelize.DataTypes),
  awardSectorTranslations: awardSectorTranslations.default(sequelize, Sequelize.DataTypes),
  shared: shared.default(sequelize, Sequelize.DataTypes),
  awards: awards.default(sequelize, Sequelize.DataTypes),
  awardTranslation: awardTranslation.default(sequelize, Sequelize.DataTypes),
  awardImages: awardImages.default(sequelize, Sequelize.DataTypes),
  userRequestReview: userRequestReview.default(sequelize, Sequelize.DataTypes),
  editListView: editListView.default(sequelize, Sequelize.DataTypes),
  videoListView: videoListView.default(sequelize, Sequelize.DataTypes),
  imageListView: imageListView.default(sequelize, Sequelize.DataTypes),
  awardRounds: awardRounds.default(sequelize, Sequelize.DataTypes),
  city: city.default(sequelize, Sequelize.DataTypes),
  cityTranslations: cityTranslations.default(sequelize, Sequelize.DataTypes),
  awardNominees: awardNominees.default(sequelize, Sequelize.DataTypes),
  videoReports: videoReports.default(sequelize, Sequelize.DataTypes),
  edit: edit.default(sequelize, Sequelize.DataTypes),
  editor: editor.default(sequelize, Sequelize.DataTypes),
  webtoonsChannelList: webtoonsChannelList.default(sequelize, Sequelize.DataTypes),
  weeklyTelecast: weeklyTelecast.default(sequelize, Sequelize.DataTypes),
  creditableTranslation: creditableTranslation.default(sequelize, Sequelize.DataTypes),
  permission: permission.default(sequelize, Sequelize.DataTypes),
  userRolePermission: userRolePermission.default(sequelize, Sequelize.DataTypes),
  schedulerProcedureJobs: schedulerProcedureJobs.default(sequelize, Sequelize.DataTypes),
  activity: activity.default(sequelize, Sequelize.DataTypes),
  pageVisit: pageVisit.default(sequelize, Sequelize.DataTypes),
  searchActivity: searchActivity.default(sequelize, Sequelize.DataTypes),
};

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
export default db;
