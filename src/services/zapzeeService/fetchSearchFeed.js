import axios from "axios";
import https from "https";
import { ZAPZEE_APIS } from "../../utils/constants.js";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { customDateTimeHelper } from "../../helpers/index.js";

/**
 * fetchSearchFeed
 * @param details
 */
export const fetchSearchFeed = async (searchText) => {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const axiosConfig = {
      method: "get",
      url: `${ZAPZEE_APIS.SEARCH_FEED_PAGE_URL}${searchText}`,
      httpsAgent: agent,
    };

    const jsonData = await axios(axiosConfig).then((results) => {
      if (results) {
        if (results.data) {
          const checkXML = XMLValidator.validate(results.data, {
            allowBooleanAttributes: true,
          });
          if (checkXML === true) {
            const options = {
              ignoreAttributes: false,
            };
            const parser = new XMLParser(options);
            return parser.parse(results.data);
          }
        }
      }
      return [];
    });
    let retResult = [];
    if (jsonData) {
      if (
        jsonData &&
        jsonData.rss &&
        jsonData.rss.channel &&
        jsonData.rss.channel.item &&
        jsonData.rss.channel.item.length > 0
      ) {
        const rssLink = jsonData.rss.channel.link ? jsonData.rss.channel.link : "";
        const language = jsonData.rss.channel.language ? jsonData.rss.channel.language : "";
        const updatePeriod = jsonData.rss.channel["sy:updatePeriod"]
          ? jsonData.rss.channel["sy:updatePeriod"]
          : "";
        const updateFrequency = jsonData.rss.channel["sy:updateFrequency"]
          ? jsonData.rss.channel["sy:updateFrequency"]
          : "";
        for (const eachItem of jsonData.rss.channel.item) {
          if (eachItem) {
            const pDateArr = eachItem.pubDate ? eachItem.pubDate.split("+") : [];
            const publishedDate = pDateArr.length > 0 && pDateArr[0] ? pDateArr[0] : "";
            const regx = /<img([\w\W]+?)>/g;
            const regx1 = /src="(.*?)"/g;
            const imgTagArr = eachItem["content:encoded"]
              ? regx.exec(eachItem["content:encoded"])
              : [];
            const srcTagArr =
              imgTagArr != null && imgTagArr.length > 0 ? regx1.exec(imgTagArr[0]) : [];
            const imageUrl = srcTagArr.length > 1 ? srcTagArr[1] : "";
            let category = [];
            if (eachItem.category) {
              if (typeof eachItem.category === "string") {
                category.push(eachItem.category);
              } else {
                category = eachItem.category;
              }
            }
            retResult.push({
              title: eachItem.title,
              slug: eachItem.link,
              creator_name: eachItem["dc:creator"],
              published_date: publishedDate
                ? await customDateTimeHelper.changeDateFormat(publishedDate, "YYYY-MM-DD HH:mm:ss")
                : "",
              category: category,
              description: eachItem.description,
              guid_text: eachItem.guid && eachItem.guid["#text"] ? eachItem.guid["#text"] : "",
              list_image: imageUrl,
              rss_link: rssLink,
              language: language,
              update_period: updatePeriod,
              update_frequency: updateFrequency,
            });
          }
        }
      }
    }
    return retResult;
  } catch (error) {
    console.log(error);
    return [];
  }
};
