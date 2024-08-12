const TABLES = {
  USER_TABLE: "edb_users",
  USER_ROLE_TABLE: "edb_user_role",
  ROLE_TABLE: "edb_roles",
  CSS_THEME_TABLE: "edb_css_themes",
  CMS_PAGE_TABLE: "edb_custom_pages",
  CONTACT_US_TABLE: "edb_contact_us",
  EMAIL_TEMPLATE_TABLE: "edb_mail_templates",
  DEPARTMENT_TABLE: "edb_departments",
  DEPARTMENT_TRANSLATION_TABLE: "edb_departments_translations",
  DEPARTMENT_JOB_TABLE: "edb_department_jobs",
  DEPARTMENT_JOB_TRANSLATION_TABLE: "edb_department_jobs_translations",
  COUNTRIES_TABLE: "edb_countries",
  COUNTRIES_TRANSLATION_TABLE: "edb_countries_translations",
  TITLE_TABLE: "edb_titles",
  LOCALIZATION_TABLE: "edb_localizations",
  TITLE_TRANSLATION_TABLE: "edb_title_translations",
  TITLE_IMAGE_TABLE: "edb_titles_images",
  TITLE_REQUEST_PRIMARY_DETAILS_TABLE: "edb_title_request",
  OTT_SERVICE_PROVIDER_TABLE: "edb_ott_service_provider",
  TITLE_REQUEST_MEDIA: "edb_title_request_for_media",
  PEOPLE_TABLE: "edb_people",
  CREDITABLES_TABLE: "edb_creditables",
  PEOPLE_TRANSLATION_TABLE: "edb_people_translations",
  TAG_TABLE: "edb_tags",
  TAG_TRANSLATION_TABLE: "edb_tag_translations",
  TAG_GABLE_TABLE: "edb_taggables",
  NEWS_TABLE: "edb_news",
  AGENCY_TABLE: "edb_agency",
  AGENCY_MANAGERS_TABLE: "edb_agency_managers",
  VIDEO_TABLE: "edb_videos",
  AGENCY_MANAGER_ARTIST_TABLE: "edb_agency_manager_artists",
  AGENCY_TRANSLATION_TABLE: "edb_agency_translation",
  AGENCY_MANAGER_TRANSLATION_TABLE: "edb_agency_managers_translation",
  TITLE_REQUEST_CREDIT: "edb_title_request_for_credit",
  TITLE_KEYWORD_TABLE: "edb_title_keywords",
  FAVOURITES_TABLE: "edb_favourites",
  RATINGS_TABLE: "edb_ratings",
  TITLE_COUNTRIES_TABLE: "edb_title_countries",
  ORIGINAL_WORKS_TABLE: "edb_original_works",
  TITLE_WATCH_ON_TABLE: "edb_titles_watch_on",
  TITLE_REQUEST_SEASON_DETAILS: "edb_title_request_for_season",
  TITLE_REQUEST_EPISODE_DETAILS: "edb_title_request_for_episode",
  RELATED_TITLE_TABLE: "edb_related_titles",
  RELATED_SERIES_TITLE_TABLE: "edb_related_series_titles",
  TAG_CATEGORY_TABLE: "edb_tag_category",
  TAG_CATEGORY_TRANSLATION_TABLE: "edb_tag_category_translations",
  TITLE_REQUEST_TAG: "edb_title_request_for_tag",
  COMMUNITY: "edb_community",
  COMMUNITY_LIKES: "edb_community_likes",
  TITLE_RERELEASE_TABLE: "edb_titles_re_release",
  SEASON_TABLE: "edb_seasons",
  EPISODE_TABLE: "edb_episodes",
  TV_NETWORKS_TABLE: "edb_tv_networks",
  TITLE_CHANNEL_LIST_TABLE: "edb_titles_channel_list",
  PEOPLE_IMAGE_TABLE: "edb_people_images",
  PEOPLE_KEYWORD_TABLE: "edb_people_keywords",
  PEOPLE_COUNTRIES_TABLE: "edb_people_countries",
  PEOPLE_JOB_TABLE: "edb_people_jobs",
  PEOPLE_VIDEO_TABLE: "edb_people_videos",
  PEOPLE_REQUEST_MEDIA_TABLE: "edb_people_request_for_media",
  PEOPLE_REQUEST_PRIMARY_DETAILS_TABLE: "edb_people_request",
  USERS_ACTIVITY_TABLE: "edb_users_activity",
  SETTINGS_TABLE: "edb_settings",
  TOP_NEWS_MAPPING_TABLE: "edb_top_news_mapping",
  IMPORT_DATA_LOGS_TABLE: "edb_imported_data_logs",
  IMPORT_FILES_TABLE: "edb_imported_files",
  EXPORT_FILES_TABLE: "edb_exported_files",
  WORKLIST_VIEW_TABLE: "edb_worklist_view",
  PRIORITY_SETTINGS_TABLE: "edb_priority_settings",
  SEARCH_SUGGESTION_VIEW_TABLE: "edb_search_suggestion_view",
  SEASON_TRANSLATION_TABLE: "edb_season_translations",
  EPISODE_TRANSLATION_TABLE: "edb_episode_translations",
  SCHEDULER_JOBS_TABLE: "edb_scheduler_jobs",
  MESSAGE_TABLE: "edb_message",
  MESSAGE_CONVERSATION_TABLE: "edb_message_conversation",
  MESSAGE_CONVERSATION_RECIPIENTS_TABLE: "edb_message_conversation_recipients",
  SITE_MENUS: "site_menus",
  PERMISSION: "edb_permissions",
  USER_ROLE_PERMISSION: "edb_user_role_permission_mapping",
  POINTS: "edb_points",
  USER_POINTS: "edb_user_points",
  LEVEL: "edb_level",
  AWARD_SECTORS_TABLE: "edb_award_sectors",
  AWARD_SECTOR_TRANSLATIONS_TABLE: "edb_award_sector_translations",
  SHARED: "edb_shared",
  AWARDS: "edb_awards",
  AWARD_TRANSLATION_TABLE: "edb_award_translations",
  AWARD_IMAGE_TABLE: "edb_award_images",
  USER_REQUEST_REVIEW_TABLE: "edb_user_request_for_review",
  EDITLIST_VIEW_TABLE: "edb_edit_list_view",
  VIDEOLIST_VIEW_TABLE: "edb_videolist_view",
  IMAGE_VIEW_TABLE: "edb_imagelist_view",
  AWARD_ROUNDS_TABLE: "edb_award_rounds",
  CITIIES_TABLE: "edb_cities",
  CITIES_TRANSLATION_TABLE: "edb_cities_translations",
  AWARD_NOMINEES_TABLE: "edb_award_nominees",
  VIDEO_REPORTS_TABLE: "edb_video_reports",
  EDITS_TABLE: "edb_edits",
  EDITORS_TABLE: "edb_editors",
  WEBTOONS_CHANNEL_LIST_TABLE: "edb_webtoons_channel_list",
  WEEKLY_TELECAST_TABLE: "edb_weekly_telecast",
  CREDITABLES_TRANSLATION_TABLE: "edb_creditable_translations",
  SCHEDULER_PROCEDURE_JOBS_TABLE: "edb_scheduler_procedure_jobs",
  ACTIVITIES_TABLE: "edb_activities",
  PAGE_VISITS_TABLE: "edb_page_visits",
  SEARCH_ACTIVITY_TABLE: "edb_search_activity",
};

const TMDB_APIS = {
  BASE_API_URL: "https://api.themoviedb.org/3",
  JOB_API_URL: "https://api.themoviedb.org/3/configuration/jobs",
  COUNTRY_API_URL: "https://api.themoviedb.org/3/configuration/countries",
  SEARCH_MOVIE_API_URL: "https://api.themoviedb.org/3/search/movie",
  SEARCH_TVSHOW_API_URL: "https://api.themoviedb.org/3/search/tv",
  MOVIE_DETAILS_API_URL: "https://api.themoviedb.org/3/movie",
  TVSHOW_DETAILS_API_URL: "https://api.themoviedb.org/3/tv",
  FIND_BY_ID_API_URL: "https://api.themoviedb.org/3/find",
  TV_NETWORK_EXPORT_API_URL: "https://files.tmdb.org/p/exports/tv_network_ids_",
  IMAGES: {
    base_url: "http://image.tmdb.org/t/p/",
    secure_base_url: "https://image.tmdb.org/t/p/",
    backdrop_sizes: ["w300", "w780", "w1280", "original"],
    logo_sizes: ["w45", "w92", "w154", "w185", "w300", "w500", "original"],
    poster_sizes: ["w92", "w154", "w185", "w342", "w500", "w780", "original"],
    profile_sizes: ["w45", "w185", "h632", "original"],
    still_sizes: ["w92", "w185", "w300", "original"],
  },
  TMDB_LIMIT: 20,
  SEARCH_PEOPLE_API_URL: "https://api.themoviedb.org/3/search/person",
  PEOPLE_DETAILS_API_URL: "https://api.themoviedb.org/3/person",
  TV_NETWORK_IMAGE_API_URL: "https://api.themoviedb.org/3/network",
  SEX_KEY_MAPPING: {
    0: null,
    1: "female",
    2: "male",
  },
  MOVIE_COLLECTION_API_URL: "https://api.themoviedb.org/3/collection",
};

const KOBIS_APIS = {
  SEARCH_MOVIE_API_URL:
    "http://kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json",
  GET_MOVIE_DETAILS_API_URL:
    "http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json",
  SEARCH_PEOPLE_API_URL:
    "http://kobis.or.kr/kobisopenapi/webservice/rest/people/searchPeopleList.json",
  GET_PEOPLE_DETAILS_API_URL:
    "http://kobis.or.kr/kobisopenapi/webservice/rest/people/searchPeopleInfo.json",
};

const ZAPZEE_APIS = {
  MOVIE_NEWS_FEED_URl: "https://zapzee.net/tag/movie/feed/",
  TV_SHOWS_NEWS_FEED_URl: "https://zapzee.net/tag/drama/feed/",
  WEBTOON_NEWS_FEED_URl: "https://zapzee.net/tag/webtoon/feed/",
  MOVIE_NEWS_WEBSITE_URl: "https://zapzee.net/tag/movie/",
  TV_SHOWS_NEWS_WEBSITE_URl: "https://zapzee.net/tag/drama/",
  WEBTOON_NEWS_WEBSITE_URl: "https://zapzee.net/tag/webtoon/",
  MORE_SEARCH_PAGE_URL: "https://zapzee.net/?s=",
  SEARCH_FEED_PAGE_URL: "https://zapzee.net/feed/?s=",
};

const consoleColors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m", // Scarlet
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m",
  },
};

const PAGINATION_LIMIT = 10;
const YOUTUBE_URL = "https://www.youtube.com/watch?v=";
const VIMEO_URL = "https://vimeo.com/";

const OTT_URL = {
  netflix: "https://www.netflix.com/title/_:ID",
  amazon_prime_video: "https://www.primevideo.com/detail/_:ID",
  apple_itune: "https://tv.apple.com/kr/_:category/_:ID", //category=movie/show/sporting-event/room
  google_play_movie: "https://play.google.com/store/movies/details/?id=_:ID",
  wavve: "https://www.wavve.com/player/_:type?_:paramname=_:ID", //type=vod/movie,paramname=programid/movieid
  watcha: "https://watcha.com/contents/_:ID",
  naver_store: "https://serieson.naver.com/v2/_:type/_:ID", //type=movie/broadcasting
  apple_tv_plus: "https://tv.apple.com/kr/_:category/_:ID", //category=movie/show/sporting-event/room
  disney_plus: "https://www.disneyplus.com/ko-kr/_:category/_:title/_:ID", //category=series/movies, title=english title name
};
const SOUTH_KOREA_COUNTRY_ID = 117; //may change in the future if the country id changes from database

const PEOPLE_SETTINGS = { LIST_IMAGE: "w185" };
const TITLE_SETTINGS = {
  //LIST_IMAGE: "w185",
  LIST_IMAGE: "w342",
};
const IMAGE_RESIZE = {
  TOP_NEWS: {
    key: "w750",
    height: 480,
    width: 750,
  },
};
const LIST_PAGE = {
  MOVIE: {
    POPULAR: { TIME_SPAN: 1, TYPE: "year" },
    NEWEST: { TIME_SPAN: 6, TYPE: "month" },
  },
  TV: {
    POPULAR: { TIME_SPAN: 1, TYPE: "year" },
    NEWEST: { TIME_SPAN: 6, TYPE: "month" },
  },
  PEOPLE: {
    POPULAR: { TIME_SPAN: 1, TYPE: "year" },
  },
  WEBTOONS: {
    POPULAR: { TIME_SPAN: 3, TYPE: "year" },
    NEWEST: { TIME_SPAN: 6, TYPE: "month" },
  },
};

const SOUTH_KOREA_COUNTRY = "south korea"; //may change in the future if the country id changes from database

const TAG_SCORE = 10; // store default score value for tag fetched from TMDB and CLIENT JSON
const TEMP_USERS_EDIT_ACCESS = [1, 120, 76, 65, 101, 143]; //admin@gmail.com-1,bokwang75@naver.com-120,bokwangkim@odkmedia.net-76,bowang@tailorcontents.com-65,chloecho@tailorcontents.com-101,dev testing-143
const YOUTUBE_APIS = {
  VIDEO_API_URL: "https://www.googleapis.com/youtube/v3/videos",
  MAX_LIMIT: 10000,
  FREE_LIMIT: 3000,
  CRON_LIMIT: 7000,
  PER_BATCH: 50,
};
const VIMEO_APIS = {
  VIDEO_API_URL: "https://vimeo.com/api/v2/video/_:ID.json",
  PER_BATCH: 50,
};

const SIDEBAR_MENU = [
  {
    u_key: "edit",
    label: "Edit",
    icon: "ad-icon1.svg",
    subCategory: [
      {
        u_key: "list",
        label: "List",
        key: ["List"],
        icon: "sub-icon4.svg",
        redirectionLink: "/edit-list",
      },
      {
        u_key: "award",
        label: "Awards",
        key: [
          "AwardList",
          "AwardEditBasicInfo",
          "AwardSectorAdd",
          "AwardAddRound",
          "AwardEdit",
          "AddNominee",
        ],
        icon: "sub-icon7.svg",
        redirectionLink: "/AwardList",
      },
    ],
  },
  {
    u_key: "news",
    label: "News",
    icon: "news-icon.svg",
    subCategory: [
      {
        u_key: "news_manager",
        label: "News Manager",
        key: ["NewsManager"],
        icon: "sub-icon1.svg",
        redirectionLink: "/news-manager",
      },
    ],
  },
  {
    u_key: "dictionary",
    label: "Dictionary",
    icon: "ad-icon3.svg",
    subCategory: [
      {
        u_key: "tag",
        label: "Tag-Data",
        key: ["TagData", "AddMainCategory", "AddSubCategory", "AddTag", "EditTag"],
        icon: "sub-icon2.svg",
        redirectionLink: "/tag-data",
      },
      {
        u_key: "agency",
        label: "Agency",
        key: ["AgentList", "AgentAdd", "AgentDetails", "AgentEdit"],
        icon: "sub-icon3.svg",
        redirectionLink: "/agent-list",
      },
    ],
  },
  {
    u_key: "bulk_working",
    label: "Bulk Working",
    icon: "ad-icon5.svg",
    subCategory: [
      {
        u_key: "worklist",
        label: "Worklist",
        key: ["Worklist"],
        icon: "sub-icon8.svg",
        redirectionLink: "/worklist",
      },
      {
        u_key: "import",
        label: "Import",
        key: ["ImportList", "ImportUpload", "ImportStatus"],
        icon: "sub-icon9.svg",
        redirectionLink: "/import-list",
      },
      {
        u_key: "export",
        label: "Export",
        key: ["ExportList"],
        icon: "sub-icon10.svg",
        redirectionLink: "/export-list",
      },
    ],
  },
  {
    u_key: "data_management",
    label: "Data Management",
    icon: "ad-icon6.svg",
    subCategory: [
      {
        u_key: "priority",
        label: "Priority",
        icon: "sub-icon12.svg",
        key: ["Priority"],
        redirectionLink: "/priority",
      },
    ],
  },
  {
    u_key: "setting",
    label: "Setting",
    icon: "ad-icon7.svg",
    subCategory: [
      {
        u_key: "front_lists",
        label: "Front lists",
        key: ["FrontLists", "FrontListsPolicyDetails", "FrontListsAddPolicy", "NewsEdit"],
        icon: "sub-icon14.svg",
        redirectionLink: "/FrontLists",
      },
      {
        u_key: "user_management",
        label: "User Management",
        key: ["UserManagementList", "UserManagementAddUser", "UserManagementDetails"],
        icon: "sub-icon15.svg",
        redirectionLink: "/UserManagementList",
      },
    ],
  },
  {
    u_key: "analytics",
    label: "Admin Analytics",
    icon: "ad-icon8.svg",
    subCategory: [
      {
        u_key: "bulk_report",
        label: "DB Content",
        key: ["DbContent"],
        icon: "sub-icon16.svg",
        redirectionLink: "/dbContent",
      },
      {
        u_key: "bulk_report",
        label: "User Feedback Report",
        key: ["UserFeedbackReport"],
        icon: "sub-icon17.svg",
        redirectionLink: "/user-feedback-report",
      },
      {
        u_key: "bulk_report",
        label: "Community Report",
        key: ["UserCommunityReport"],
        icon: "sub-icon18.svg",
        redirectionLink: "/community-report",
      },
      {
        u_key: "site_report",
        label: "Google Analytics",
        key: [],
        icon: "sub-icon19.svg",
        redirectionLink: "",
      },
    ],
  },
  {
    u_key: "statistics",
    label: "Statistics",
    icon: "ad-icon9.svg",
    subCategory: [
      {
        u_key: "statistics",
        label: "Statistics / User behaviour Log",
        key: ["UserStatistics"],
        icon: "sub-icon20.svg",
        redirectionLink: "/user-statistic",
      },
    ],
  },
];

const MAIL_TEMPLATE = {
  SUPPORT_MAIL: "internal@tailorcontents.com",
  ADDRESS: "Lorem Ipsum is simply dummy text of the printing",
  TEL: "02-123-4567",
  FAX: "02-123-4567",
  TAHNKS_FROM: "11DB Help",
};

const SCHEDULAR_JOBS_SETTING = {
  PEOPLE_KOREN_BIRTH_PLACE: 20000,
  TITLE_AVG_RATING: 10000,
  TITLE_POPULARITY: 10000,
  PEOPLE_POPULARITY: 25000,
};

export {
  PAGINATION_LIMIT,
  TABLES,
  TMDB_APIS,
  consoleColors,
  KOBIS_APIS,
  ZAPZEE_APIS,
  YOUTUBE_URL,
  OTT_URL,
  SOUTH_KOREA_COUNTRY_ID,
  PEOPLE_SETTINGS,
  TITLE_SETTINGS,
  IMAGE_RESIZE,
  LIST_PAGE,
  SOUTH_KOREA_COUNTRY,
  TAG_SCORE,
  TEMP_USERS_EDIT_ACCESS,
  YOUTUBE_APIS,
  VIMEO_URL,
  VIMEO_APIS,
  SIDEBAR_MENU,
  MAIL_TEMPLATE,
  SCHEDULAR_JOBS_SETTING,
};
