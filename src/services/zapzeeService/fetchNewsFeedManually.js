import fs from "fs";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { customDateTimeHelper } from "../../helpers/index.js";

/**
 * fetchNewsFeedManually
 * @param details
 */
export const fetchNewsFeedManually = async (dataDate, type = "movie") => {
  try {
    let jsonData = {};
    const results = fs.readFileSync(`./public/download/zapzee/${dataDate}/${type}.xml`, {
      encoding: "utf8",
    });

    const checkXML = XMLValidator.validate(results, {
      allowBooleanAttributes: true,
    });
    if (checkXML === true) {
      const options = {
        ignoreAttributes: false,
      };
      const parser = new XMLParser(options);
      jsonData = parser.parse(results);
    }
    let retResult = [];
    if (jsonData) {
      if (
        jsonData &&
        jsonData.rss &&
        jsonData.rss.channel &&
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
    return [];
  }
};
